import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceProcessStep } from '../../services/processStepService.js';

function fixture({ role = 3, next = true, end = false, current = 70, pending = false } = {}) {
    const writes = [];
    const client = { async query(sql, values) {
        if (sql.includes('SELECT config.role')) return { rows: [{ role }] };
        if (sql.includes('SELECT pi.*')) {
            assert.match(sql, /FOR UPDATE OF pi/);
            return { rows: [{ id:1000, company_id:7, process_id:9, step_id:current, current_order:1, status:'active' }] };
        }
        if (sql.includes('SELECT id,name')) return { rows: next ? [{ id:71, name:'Orden de cliente', required_roll:[3], end_process:end }] : [] };
        if (sql.includes('orders_delegation_config')) return { rows: pending ? [{ assignment_step_id:70 }] : [] };
        if (sql.includes('SELECT movement.id')) return { rows:[{id:1}], rowCount:1 };
        writes.push({sql,values});
        return { rowCount:1 };
    } };
    return { client, writes };
}
const info = { company_id:7, instance_id:1000, previous_step:70, user_id:83 };

test('obtiene el rol interno, avanza y registra historial con la etapa anterior', async () => {
    const { client, writes } = fixture();
    const result = await advanceProcessStep(client, info, async () => ({success:true}));
    assert.equal(result.nextStepId,71);
    assert.deepEqual(writes[0].values,[71,1000,83]);
    assert.deepEqual(writes[1].values.slice(0,5),[7,1000,70,71,83]);
});

test('sin siguiente etapa no modifica instancia ni historial', async () => {
    const { client, writes } = fixture({next:false});
    const result = await advanceProcessStep(client, info);
    assert.equal(result.success,false);
    assert.deepEqual(writes,[]);
});

test('rechaza rol no autorizado, cambio de etapa y delegaciones pendientes', async () => {
    for (const options of [{role:8},{current:72},{pending:true}]) {
        const {client,writes}=fixture(options);
        await assert.rejects(advanceProcessStep(client,info));
        assert.deepEqual(writes,[]);
    }
});

test('conserva la validación de requisitos al entrar en una etapa final', async () => {
    const {client,writes}=fixture({end:true});
    await assert.rejects(advanceProcessStep(client,info,async(instanceId,processId,connection)=>{
        assert.equal(instanceId,1000);
        assert.equal(processId,9);
        assert.equal(connection,client);
        return {success:false,error:'Falta documento requerido'};
    }),/Falta documento/);
    assert.deepEqual(writes,[]);
});
