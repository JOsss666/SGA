import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createSupplierDelegationService, normalizeDelegationRequest, normalizeDelegationUpdateRequest } from './supplierDelegationService.js';
import { validateDelegationProgress } from './delegationProgressService.js';

const auth={companyId:7,userId:83,roleId:30};
const relation=(item_id,thirdParty_id=212,doc_id=100)=>({doc_id,item_id,thirdParty_id,asignationNote:'Trabajo asignado'});
const request=relations=>({instance_id:1000,request_id:randomUUID(),relations});

test('valida IDs, duplicados y notas antes de iniciar una transacción',()=>{
    assert.throws(()=>normalizeDelegationRequest(request([relation(1),relation(1)]),auth),/más de una vez/);
    assert.throws(()=>normalizeDelegationRequest(request([relation('1;DROP')]),auth),/válido/);
    assert.throws(()=>normalizeDelegationRequest(request([{...relation(1),asignationNote:'x'.repeat(4001)}]),auth),/4000/);
    assert.throws(()=>normalizeDelegationRequest(request([]),auth),/Selecciona/);
    const data=normalizeDelegationRequest({...request([relation(1)]),company_id:8,user_id:99},auth);
    assert.equal(data.company_id,'7');assert.equal(data.user_id,'83');
    assert.throws(()=>normalizeDelegationUpdateRequest({instance_id:1000,delegation_document_id:200,relations:[relation(1,212),relation(2,213)]},auth),/un proveedor/);
    assert.equal(normalizeDelegationUpdateRequest({instance_id:1000,delegation_document_id:200,relations:[relation(1)]},auth).delegation_document_id,'200');
});

// Requiere PostgreSQL local; crea y elimina una base propia, nunca usa la base de negocio.
test('delegación transaccional con PostgreSQL aislado', {skip:!process.env.SGA_DELEGATION_TEST_URL}, async t=>{
    const url=new URL(process.env.SGA_DELEGATION_TEST_URL);
    assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname),'Las pruebas solo pueden ejecutarse en localhost');
    const admin=new pg.Client({connectionString:url.href});await admin.connect();
    const database=`sga_delegation_test_${Date.now()}`;
    await admin.query(`CREATE DATABASE "${database}"`);
    url.pathname=`/${database}`;
    const pool=new pg.Pool({connectionString:url.href});
    const withTransaction=async callback=>{
        const client=await pool.connect();
        try {await client.query('BEGIN');const result=await callback(client);await client.query('COMMIT');return result;}
        catch(error){await client.query('ROLLBACK');throw error;}
        finally{client.release();}
    };
    // Adaptadores mínimos de los helpers ya existentes; todas las escrituras van al mismo client.
    const adapters={withTransaction,
        registerDocument:async(info,{client})=>(await client.query(`INSERT INTO "Ecosystem".documents(company_id,store_id,"thirdParty_id",document_type,status,"subTotal",total,created_by,description,attached) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,"ownSerial"`,[info.company_id,info.store_id,info.thirdParty_id,info.doc_type,info.status,info.subTotal,info.total,info.created_by,info.description,JSON.stringify(info.attached)])).rows[0],
        linkDocumentInstances:async(docId,instances,{client})=>{for(const instance of instances)await client.query(`INSERT INTO "Ecosystem".docs_instances VALUES($1,$2,$3)`,[docId,instance.instance_id,instance.step_id]);}
    };
    const service=createSupplierDelegationService(adapters);
    const reset=async()=>{
        await pool.query(`TRUNCATE "Process"."ordersDelegation","Process".orders_delegation_requests,"Ecosystem".docs_instances,"Ecosystem".documents_group,"Inventory".services_movement,"Ecosystem".documents,"Process".process_historial,"Process".process_instance RESTART IDENTITY CASCADE`);
        await pool.query(`INSERT INTO "Process".process_instance(id,company_id,process_id,step_id,status) VALUES(1000,7,9,70,'active'),(1001,8,9,70,'active');
            INSERT INTO "Ecosystem".documents(id,company_id,store_id,document_type,status,attached,instance_id) VALUES(100,7,23,'Client Order','active','[]',1000),(101,7,23,'Client Order','active','[]',1000),(102,8,23,'Client Order','active','[]',1001);
            INSERT INTO "Inventory".services_movement VALUES(1,7,100,5,2),(2,7,100,5,3),(3,7,101,6,4),(4,8,102,5,1),(5,7,100,5,1);`);
    };
    const counts=async()=>(await pool.query(`SELECT (SELECT count(*) FROM "Process"."ordersDelegation") AS assignments,(SELECT count(*) FROM "Ecosystem".documents WHERE document_type='ThirdParty Delegation') AS documents,(SELECT count(*) FROM "Process".process_instance WHERE parent_id IS NOT NULL) AS children,(SELECT count(*) FROM "Process".orders_delegation_requests) AS requests`)).rows[0];
    try {
        await pool.query(await readFile(new URL('./fixtures/supplierDelegation.sql',import.meta.url),'utf8'));
        const migration=await readFile(new URL('../../db/migrations/0024_create_orders_delegation.sql',import.meta.url),'utf8');
        await withTransaction(client=>client.query(migration));
        await withTransaction(client=>client.query(migration));
        await t.test('crea un documento y subproceso por orden/proveedor y conserva vínculos',async()=>{
            await reset();
            const payload=request([relation(1),relation(2),relation(3,213,101)]);
            const result=await service.register(payload,auth);assert.equal(result.delegations.length,2);
            assert.deepEqual(await counts(),{assignments:'3',documents:'2',children:'2',requests:'1'});
            const children=(await pool.query(`SELECT parent_id,parent_step,step_id,"thirdParty_id",abs(extract(epoch FROM (CURRENT_TIMESTAMP-(created_at AT TIME ZONE 'UTC')))) AS age FROM "Process".process_instance WHERE parent_id=1000`)).rows;
            assert.ok(children.every(child=>child.parent_step==='71' && child.step_id==='76' && Number(child.age)<10));
            assert.equal((await pool.query(`SELECT * FROM "Ecosystem".documents_group`)).rowCount,2);
            assert.equal((await pool.query(`SELECT * FROM "Ecosystem".docs_instances`)).rowCount,4);
            assert.ok((await pool.query(`SELECT total FROM "Ecosystem".documents WHERE document_type='ThirdParty Delegation'`)).rows.every(doc=>Number(doc.total)===0));
            assert.deepEqual(await service.register(payload,auth),JSON.parse(JSON.stringify(result)));
            const loaded=await service.list(1000,auth);assert.equal(loaded.relations.length,3);assert.equal(loaded.relations[0].thirdParty_name,'José');
            assert.equal(loaded.relations[0].business_time_zone,'America/Bogota');
            const editableDocument=result.delegations.find(delegation=>delegation.source_doc_id==='100').doc_id;
            const updated=await service.update({
                instance_id:1000,
                delegation_document_id:editableDocument,
                relations:[relation(1,213,100),{...relation(2,213,100),asignationNote:'Nueva indicación'},relation(5,213,100)]
            },auth);
            assert.equal(updated.message,'Asignación actualizada correctamente.');
            const updatedAssignments=(await pool.query(`SELECT "thirdParty_id",asignation_note FROM "Process"."ordersDelegation" WHERE delegation_document_id=$1 ORDER BY service_movement_id`,[editableDocument])).rows;
            assert.deepEqual(updatedAssignments,[{thirdParty_id:'213',asignation_note:'Trabajo asignado'},{thirdParty_id:'213',asignation_note:'Nueva indicación'},{thirdParty_id:'213',asignation_note:'Trabajo asignado'}]);
            assert.equal((await pool.query(`SELECT "thirdParty_id" FROM "Ecosystem".documents WHERE id=$1`,[editableDocument])).rows[0].thirdParty_id,'213');
            assert.equal((await pool.query(`SELECT "thirdParty_id" FROM "Process".process_instance WHERE parent_id=1000 AND "thirdParty_id"=213`)).rowCount,2);
        });
        await t.test('rollback de documento, grupo, subproceso e historial ante error intermedio',async()=>{
            await reset();const failing=createSupplierDelegationService({...adapters,linkDocumentInstances:async()=>{throw new Error('fallo simulado')}});
            await assert.rejects(failing.register(request([relation(1)]),auth),/simulado/);
            assert.deepEqual(await counts(),{assignments:'0',documents:'0',children:'0',requests:'0'});
            assert.equal((await pool.query(`SELECT * FROM "Process".process_historial`)).rowCount,0);
            assert.equal((await pool.query(`SELECT * FROM "Ecosystem".documents_group`)).rowCount,0);
        });
        await t.test('rechaza compañía ajena, rol, documento, proveedor y paso incorrectos',async()=>{
            await reset();
            for(const payload of [request([relation(4,212,102)]),request([relation(1,214)]),request([relation(1,215)]),request([relation(1,212,101)])])await assert.rejects(service.register(payload,auth));
            await assert.rejects(service.register(request([relation(1)]),{...auth,roleId:99}),/rol/);
            await assert.rejects(service.register({...request([relation(1)]),instance_id:1001},auth),/no encontrado/);
            await pool.query(`UPDATE "Process".process_instance SET step_id=71 WHERE id=1000`);
            await assert.rejects(service.register(request([relation(1)]),auth),/paso/);
            assert.equal((await counts()).assignments,'0');
        });
        await t.test('solicitudes concurrentes no duplican el ítem',async()=>{
            await reset();const result=await Promise.allSettled([service.register(request([relation(1)]),auth),service.register(request([relation(1,213)]),auth)]);
            assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
            assert.deepEqual(await counts(),{assignments:'1',documents:'1',children:'1',requests:'1'});
        });
        await t.test('reintentos concurrentes con la misma clave devuelven el mismo resultado',async()=>{
            await reset();const payload=request([relation(1)]);
            const results=await Promise.all([service.register(payload,auth),service.register(payload,auth)]);
            assert.deepEqual(results[0],results[1]);assert.equal((await counts()).documents,'1');
            await assert.rejects(service.register({...payload,relations:[relation(2)]},auth),/otros datos/);
            await service.register(request([relation(2)]),auth);assert.equal((await counts()).assignments,'2');
        });
        await t.test('bloquea avance con ítems pendientes o subprocesos sin entregar',async()=>{
            await reset();let parent=(await pool.query(`SELECT * FROM "Process".process_instance WHERE id=1000`)).rows[0];
            await assert.rejects(withTransaction(client=>validateDelegationProgress(client,parent)),/pendientes/);
            await service.register(request([relation(1),relation(2),relation(3,213,101),relation(5)]),auth);
            await withTransaction(client=>validateDelegationProgress(client,parent));
            parent={...parent,step_id:71};
            await assert.rejects(withTransaction(client=>validateDelegationProgress(client,parent)),/entregados/);
            await pool.query(`UPDATE "Process".process_instance SET step_id=80 WHERE parent_id=1000`);
            await withTransaction(client=>validateDelegationProgress(client,parent));
        });
        await t.test('fecha comercial alrededor de medianoche y horario de verano',async()=>{
            await reset();await service.register(request([relation(1)]),auth);
            await pool.query(`UPDATE "Process"."ordersDelegation" SET created_at='2026-09-11T04:59:59Z'`);
            const before=await service.list(1000,auth);assert.equal(new Date(before.relations[0].business_date).getDate(),10);
            await pool.query(`UPDATE "Process"."ordersDelegation" SET created_at='2026-09-11T05:00:00Z'`);
            const after=await service.list(1000,auth);assert.equal(new Date(after.relations[0].business_date).getDate(),11);
            await pool.query(`UPDATE "Ecosystem".company_settings SET time_zone='America/New_York' WHERE company_id=7`);
            for(const instant of ['2026-03-08T06:59:59Z','2026-03-08T07:00:00Z']) {
                await pool.query(`UPDATE "Process"."ordersDelegation" SET created_at=$1`,[instant]);
                const loaded=await service.list(1000,auth);assert.equal(loaded.relations[0].business_time_zone,'America/New_York');assert.equal(new Date(loaded.relations[0].created_at).toISOString(),new Date(instant).toISOString());
            }
        });
    } finally {
        await pool.end();await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);await admin.end();
    }
});
