import { createHash } from 'node:crypto';
import { createProcessInstance } from './processInstanceService.js';
import { companyTimeZoneSql } from './businessTimeZoneService.js';

function fail(message, statusCode = 400) {
    throw Object.assign(new Error(message), {statusCode});
}

function id(value, name) {
    if(typeof value === 'number' && !Number.isSafeInteger(value)) fail(`${name} debe enviarse como un ID entero seguro o texto.`);
    if(!/^[1-9]\d*$/.test(String(value)) || BigInt(value) > 9223372036854775807n) fail(`${name} no es válido.`);
    return String(value);
}

export function normalizeDelegationRequest(input, auth) {
    if(!input || typeof input !== 'object') fail('La solicitud no es válida.');
    const company_id = id(auth.companyId, 'Compañía');
    const user_id = id(auth.userId, 'Usuario');
    const instance_id = id(input.instance_id, 'Proceso');
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.request_id ?? '')) fail('request_id no es válido.');
    if(!Array.isArray(input.relations) || !input.relations.length || input.relations.length > 1000) fail('Selecciona entre 1 y 1000 ítems.');
    const seen = new Set();
    const relations = input.relations.map(relation => {
        const item_id = id(relation?.item_id, 'Ítem');
        if(seen.has(item_id)) fail('Un ítem no puede aparecer más de una vez.');
        seen.add(item_id);
        const note = relation.asignationNote ?? '';
        if(typeof note !== 'string' || note.length > 4000) fail('La nota no puede superar 4000 caracteres.');
        return {item_id, doc_id:id(relation.doc_id, 'Documento'), thirdParty_id:id(relation.thirdParty_id, 'Proveedor'), asignationNote:note};
    }).sort((a,b) => a.item_id.localeCompare(b.item_id));
    return {company_id, user_id, instance_id, request_id:input.request_id.toLowerCase(), relations};
}

export function normalizeDelegationUpdateRequest(input, auth) {
    if(!input || typeof input !== 'object') fail('La solicitud no es válida.');
    const company_id = id(auth.companyId, 'Compañía');
    const user_id = id(auth.userId, 'Usuario');
    const instance_id = id(input.instance_id, 'Proceso');
    const delegation_document_id = id(input.delegation_document_id, 'Documento de asignación');
    if(!Array.isArray(input.relations) || !input.relations.length || input.relations.length > 1000) fail('Selecciona entre 1 y 1000 ítems.');
    const seen = new Set();
    const relations = input.relations.map(relation => {
        const item_id = id(relation?.item_id, 'Ítem');
        if(seen.has(item_id)) fail('Un ítem no puede aparecer más de una vez.');
        seen.add(item_id);
        const note = relation.asignationNote ?? '';
        if(typeof note !== 'string' || note.length > 4000) fail('La nota no puede superar 4000 caracteres.');
        return {item_id, doc_id:id(relation.doc_id, 'Documento'), thirdParty_id:id(relation.thirdParty_id, 'Proveedor'), asignationNote:note};
    }).sort((a,b) => a.item_id.localeCompare(b.item_id));
    if(new Set(relations.map(relation => relation.thirdParty_id)).size !== 1) fail('Un documento de asignación solo puede tener un proveedor.');
    return {company_id, user_id, instance_id, delegation_document_id, relations};
}

// Inyección explícita para probar con PostgreSQL aislado, sin cargar app.js.
export function createSupplierDelegationService({withTransaction, registerDocument, linkDocumentInstances}) {
    return {
        async register(input, auth) {
            const data = normalizeDelegationRequest(input, auth);
            const hash = createHash('sha256').update(JSON.stringify({instance_id:data.instance_id, user_id:data.user_id, relations:data.relations})).digest('hex');
            return withTransaction(async client => {
                const request = await client.query(`
                    INSERT INTO "Process".orders_delegation_requests(company_id, request_id, payload_hash)
                    VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING request_id
                `, [data.company_id, data.request_id, hash]);
                if(!request.rowCount) {
                    const previous = (await client.query(`SELECT payload_hash, response FROM "Process".orders_delegation_requests WHERE company_id=$1 AND request_id=$2`, [data.company_id,data.request_id])).rows[0];
                    if(previous.payload_hash !== hash) fail('Esta solicitud ya fue usada con otros datos.',409);
                    if(!previous.response) fail('La solicitud sigue en proceso.',409);
                    return previous.response;
                }
                const parent = (await client.query(`
                    SELECT * FROM "Process".process_instance WHERE id=$1 AND company_id=$2 FOR UPDATE
                `,[data.instance_id,data.company_id])).rows[0];
                if(!parent) fail('Proceso no encontrado.',404);
                const config = (await client.query(`
                    SELECT config.*, assignment.required_roll
                    FROM "Process".orders_delegation_config config
                    JOIN "Process".process_steps assignment ON assignment.id=config.assignment_step_id
                        AND assignment.process_id=config.parent_process_id AND assignment.company_id=config.company_id
                    JOIN "Process".process_steps production ON production.id=config.production_step_id
                        AND production.process_id=config.parent_process_id AND production.company_id=config.company_id
                    JOIN "Process".processes child ON child.id=config.child_process_id AND child.company_id=config.company_id AND child.status='active'
                    JOIN "Process".process_steps initial ON initial.id=config.child_initial_step_id
                        AND initial.process_id=child.id AND initial.company_id=config.company_id
                    WHERE config.company_id=$1 AND config.parent_process_id=$2
                `,[data.company_id,parent.process_id])).rows[0];
                if(!config) fail('Falta configurar los pasos y el subproceso de delegación.',409);
                if(parent.status !== 'active' || String(parent.step_id) !== String(config.assignment_step_id)) fail('El proceso debe estar activo en el paso de asignación a proveedores.',409);
                if(!config.required_roll.map(String).includes(String(auth.roleId))) fail('Tu rol no puede asignar proveedores en este paso.',403);
                const items = (await client.query(`
                    SELECT movement.id, movement.doc_id, document.store_id, document.attached, document.description
                    FROM "Inventory".services_movement movement
                    JOIN "Ecosystem".documents document ON document.id=movement.doc_id AND document.company_id=movement.company_id
                    WHERE movement.company_id=$1 AND movement.id=ANY($2::bigint[])
                        AND document.document_type='Client Order' AND document.status='active'
                        AND (document.instance_id=$3 OR EXISTS (
                            SELECT 1 FROM "Ecosystem".docs_instances link WHERE link.doc_id=document.id AND link.instance_id=$3
                        ))
                    ORDER BY movement.id FOR UPDATE OF movement, document
                `,[data.company_id,data.relations.map(r=>r.item_id),data.instance_id])).rows;
                if(items.length !== data.relations.length) fail('Hay ítems que no pertenecen a órdenes activas de este proceso.',409);
                const itemsById = new Map(items.map(item=>[String(item.id),item]));
                for(const relation of data.relations) {
                    if(String(itemsById.get(relation.item_id).doc_id) !== relation.doc_id) fail('El ítem no pertenece a la orden indicada.');
                }
                const supplierIds = [...new Set(data.relations.map(r=>r.thirdParty_id))];
                const suppliers = (await client.query(`SELECT id FROM "Ecosystem".thirdparties WHERE company_id=$1 AND id=ANY($2::bigint[]) AND type IN ('supplier','both') FOR SHARE`,[data.company_id,supplierIds])).rows;
                if(suppliers.length !== supplierIds.length) fail('Selecciona proveedores válidos de la compañía.');
                const existing = await client.query(`SELECT id FROM "Process"."ordersDelegation" WHERE company_id=$1 AND service_movement_id=ANY($2::bigint[]) AND status='active'`,[data.company_id,data.relations.map(r=>r.item_id)]);
                if(existing.rowCount) fail('Uno o más ítems ya tienen una asignación activa. Recarga el formulario.',409);
                // También evita carreras al crear las secuencias documentales legacy por primera vez.
                await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[`supplier-delegation:${data.company_id}`]);
                const groups = new Map();
                for(const relation of data.relations) {
                    const key = `${relation.doc_id}:${relation.thirdParty_id}`;
                    if(!groups.has(key)) groups.set(key,[]);
                    groups.get(key).push(relation);
                }
                const delegations = [];
                for(const relations of groups.values()) {
                    const first = relations[0];
                    const order = itemsById.get(first.item_id);
                    let attached = [];
                    try { const parsed = JSON.parse(order.attached || '[]'); if(Array.isArray(parsed)) attached=parsed; } catch { /* Adjuntos legacy inválidos no se copian. */ }
                    const document = await registerDocument({
                        company_id:data.company_id, store_id:order.store_id, thirdParty_id:first.thirdParty_id,
                        doc_type:config.document_type, status:'active', subTotal:0, total:0,
                        created_by:data.user_id, description:order.description || 'Delegación de trabajo a proveedor', attached
                    },{client,includeProcessFields:false});
                    if(!document?.id) throw new Error('No se pudo crear el documento de delegación.');
                    await client.query(`INSERT INTO "Ecosystem".documents_group(main_doc_id,doc_id) VALUES ($1,$2)`,[first.doc_id,document.id]);
                    const child = await createProcessInstance(client,{
                        company_id:data.company_id, process_id:config.child_process_id, step_id:config.child_initial_step_id,
                        status:'active', parent_id:data.instance_id, parent_step:config.production_step_id,
                        thirdParty_id:first.thirdParty_id, user_id:data.user_id
                    });
                    await linkDocumentInstances(document.id,[
                        {instance_id:data.instance_id,step_id:config.assignment_step_id},
                        {instance_id:child.id,step_id:config.child_initial_step_id}
                    ],{client});
                    await client.query(`
                        INSERT INTO "Process"."ordersDelegation" (company_id,service_movement_id,delegation_document_id,"thirdParty_id",asignation_note,created_by)
                        SELECT $1, item.item_id, $2, $3, item.note, $4
                        FROM jsonb_to_recordset($5::jsonb) AS item(item_id bigint,note text)
                    `,[data.company_id,document.id,first.thirdParty_id,data.user_id,JSON.stringify(relations.map(r=>({item_id:r.item_id,note:r.asignationNote})))]);
                    delegations.push({doc_id:document.id,ownSerial:document.ownSerial,source_doc_id:first.doc_id,thirdParty_id:first.thirdParty_id,instance_id:child.id,item_ids:relations.map(r=>r.item_id)});
                }
                const response = {ok:true,delegations,message:`Se crearon ${delegations.length} delegaciones.`};
                await client.query(`UPDATE "Process".orders_delegation_requests SET response=$3::jsonb WHERE company_id=$1 AND request_id=$2`,[data.company_id,data.request_id,JSON.stringify(response)]);
                return response;
            });
        },

        async update(input, auth) {
            const data = normalizeDelegationUpdateRequest(input, auth);
            return withTransaction(async client => {
                const assignments = (await client.query(`
                    SELECT assignment.id, assignment.service_movement_id AS item_id,
                        movement.doc_id, assignment.delegation_document_id,
                        parent.id AS parent_instance_id, parent.process_id, parent.step_id,
                        parent.status AS parent_status, config.assignment_step_id,
                        assignment_step.required_roll
                    FROM "Process"."ordersDelegation" assignment
                    JOIN "Inventory".services_movement movement
                        ON movement.id=assignment.service_movement_id AND movement.company_id=assignment.company_id
                    JOIN "Ecosystem".docs_instances parent_link
                        ON parent_link.doc_id=assignment.delegation_document_id
                    JOIN "Process".process_instance parent
                        ON parent.id=parent_link.instance_id AND parent.company_id=assignment.company_id
                    JOIN "Process".orders_delegation_config config
                        ON config.company_id=parent.company_id AND config.parent_process_id=parent.process_id
                    JOIN "Process".process_steps assignment_step
                        ON assignment_step.id=config.assignment_step_id
                        AND assignment_step.company_id=config.company_id
                    WHERE assignment.company_id=$1
                        AND assignment.delegation_document_id=$2
                        AND assignment.status='active'
                        AND parent_link.step_instance=config.assignment_step_id
                    ORDER BY assignment.id
                    FOR UPDATE OF assignment, parent
                `,[data.company_id,data.delegation_document_id])).rows;
                if(!assignments.length) fail('No se encontró una asignación activa para este documento.',404);
                const parent = assignments[0];
                if(String(parent.parent_instance_id) !== data.instance_id) fail('El documento no pertenece al proceso indicado.',409);
                if(parent.parent_status !== 'active' || String(parent.step_id) !== String(parent.assignment_step_id)) fail('La asignación solo puede editarse en el paso de asignación a proveedores.',409);
                if(!parent.required_roll.map(String).includes(String(auth.roleId))) fail('Tu rol no puede editar proveedores en este paso.',403);
                const savedByItem = new Map(assignments.map(assignment => [String(assignment.item_id),assignment]));
                const sourceDocumentIds = new Set(assignments.map(assignment => String(assignment.doc_id)));
                if([...savedByItem.keys()].some(itemId => !data.relations.some(relation => relation.item_id === itemId))) {
                    fail('No puedes retirar ítems ya incluidos en este documento de asignación.',409);
                }
                if(data.relations.some(relation => !sourceDocumentIds.has(relation.doc_id))) {
                    fail('Los ítems nuevos deben pertenecer a la orden de cliente de esta asignación.',409);
                }
                const selectedItems = (await client.query(`
                    SELECT movement.id, movement.doc_id
                    FROM "Inventory".services_movement movement
                    JOIN "Ecosystem".documents source_document
                        ON source_document.id=movement.doc_id AND source_document.company_id=movement.company_id
                    WHERE movement.company_id=$1
                        AND movement.id=ANY($2::bigint[])
                        AND source_document.document_type='Client Order'
                        AND source_document.status='active'
                        AND (source_document.instance_id=$3 OR EXISTS (
                            SELECT 1 FROM "Ecosystem".docs_instances link
                            WHERE link.doc_id=source_document.id AND link.instance_id=$3
                        ))
                    FOR UPDATE OF movement, source_document
                `,[data.company_id,data.relations.map(relation=>relation.item_id),parent.parent_instance_id])).rows;
                if(selectedItems.length !== data.relations.length || data.relations.some(relation => {
                    const item=selectedItems.find(selected=>String(selected.id)===relation.item_id);
                    return !item || String(item.doc_id)!==relation.doc_id;
                })) fail('Hay ítems que no pertenecen a órdenes activas de este proceso.',409);
                const conflictingAssignment = await client.query(`
                    SELECT service_movement_id FROM "Process"."ordersDelegation"
                    WHERE company_id=$1 AND service_movement_id=ANY($2::bigint[])
                        AND status='active' AND delegation_document_id <> $3
                    LIMIT 1
                `,[data.company_id,data.relations.map(relation=>relation.item_id),data.delegation_document_id]);
                if(conflictingAssignment.rowCount) fail('Uno o más ítems ya están asignados en otro documento. Recarga el formulario.',409);
                const supplierId = data.relations[0].thirdParty_id;
                const supplier = await client.query(`
                    SELECT id FROM "Ecosystem".thirdparties
                    WHERE company_id=$1 AND id=$2 AND type IN ('supplier','both') FOR SHARE
                `,[data.company_id,supplierId]);
                if(!supplier.rowCount) fail('Selecciona un proveedor válido de la compañía.');
                await client.query(`
                    UPDATE "Process"."ordersDelegation" assignment
                    SET "thirdParty_id"=$3, asignation_note=item.note,
                        updated_at=CURRENT_TIMESTAMP
                    FROM jsonb_to_recordset($4::jsonb) AS item(item_id bigint,note text)
                    WHERE assignment.company_id=$1
                        AND assignment.delegation_document_id=$2
                        AND assignment.service_movement_id=item.item_id
                        AND assignment.status='active'
                `,[data.company_id,data.delegation_document_id,supplierId,
                    JSON.stringify(data.relations.map(relation => ({item_id:relation.item_id,note:relation.asignationNote})))]);
                const newRelations=data.relations.filter(relation=>!savedByItem.has(relation.item_id));
                if(newRelations.length) await client.query(`
                    INSERT INTO "Process"."ordersDelegation" (
                        company_id, service_movement_id, delegation_document_id,
                        "thirdParty_id", asignation_note, created_by
                    )
                    SELECT $1, item.item_id, $2, $3, item.note, $4
                    FROM jsonb_to_recordset($5::jsonb) AS item(item_id bigint,note text)
                `,[data.company_id,data.delegation_document_id,supplierId,data.user_id,
                    JSON.stringify(newRelations.map(relation=>({item_id:relation.item_id,note:relation.asignationNote})))]);
                await client.query(`
                    UPDATE "Ecosystem".documents
                    SET "thirdParty_id"=$3, updated_at=CURRENT_TIMESTAMP
                    WHERE id=$2 AND company_id=$1 AND document_type='ThirdParty Delegation'
                `,[data.company_id,data.delegation_document_id,supplierId]);
                await client.query(`
                    UPDATE "Process".process_instance child
                    SET "thirdParty_id"=$3, updated_at=CURRENT_TIMESTAMP
                    WHERE child.company_id=$1 AND child.id IN (
                        SELECT link.instance_id FROM "Ecosystem".docs_instances link
                        WHERE link.doc_id=$2 AND link.instance_id <> $4
                    )
                `,[data.company_id,data.delegation_document_id,supplierId,parent.parent_instance_id]);
                return {ok:true,message:'Asignación actualizada correctamente.'};
            });
        },

        async list(instanceId, auth, delegationDocumentId) {
            return withTransaction(async client => {
                const companyId=id(auth.companyId,'Compañía');
                const documentId=delegationDocumentId == null ? null : id(delegationDocumentId,'Documento de asignación');
                const parent=(await client.query(`SELECT process_id,step_id,status FROM "Process".process_instance WHERE id=$1 AND company_id=$2`,[id(instanceId,'Proceso'),companyId])).rows[0];
                if(!parent) fail('Proceso no encontrado.',404);
                const configuration=(await client.query(`SELECT config.assignment_step_id, step.required_roll FROM "Process".orders_delegation_config config JOIN "Process".process_steps step ON step.id=config.assignment_step_id AND step.company_id=config.company_id WHERE config.company_id=$1 AND config.parent_process_id=$2`,[companyId,parent.process_id])).rows[0];
                const relations=(await client.query(`
                    SELECT assignment.id, movement.doc_id, assignment.service_movement_id AS item_id,
                        assignment.delegation_document_id, assignment."thirdParty_id", supplier.names AS "thirdParty_name",
                        assignment.asignation_note AS "asignationNote", true AS asigned,
                        ($3::bigint IS NULL) AS disabled,
                        assignment.created_at,
                        assignment.created_at AT TIME ZONE (${companyTimeZoneSql('$1')}) AS created_at_local,
                        (assignment.created_at AT TIME ZONE (${companyTimeZoneSql('$1')}))::date AS business_date,
                        ${companyTimeZoneSql('$1')} AS business_time_zone
                    FROM "Process"."ordersDelegation" assignment
                    JOIN "Inventory".services_movement movement ON movement.id=assignment.service_movement_id AND movement.company_id=assignment.company_id
                    JOIN "Ecosystem".thirdparties supplier ON supplier.id=assignment."thirdParty_id" AND supplier.company_id=assignment.company_id
                    WHERE assignment.company_id=$1 AND assignment.status='active'
                        AND EXISTS (SELECT 1 FROM "Ecosystem".docs_instances link WHERE link.doc_id=assignment.delegation_document_id AND link.instance_id=$2)
                        AND ($3::bigint IS NULL OR assignment.delegation_document_id=$3)
                    ORDER BY assignment.id
                `,[companyId,instanceId,documentId])).rows;
                return {ok:true,relations,configured:!!configuration,can_assign:parent.status==='active' && String(parent.step_id)===String(configuration?.assignment_step_id) && configuration.required_roll.map(String).includes(String(auth.roleId))};
            });
        }
    };
}
