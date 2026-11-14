import test from 'node:test';
import assert from 'node:assert/strict';
import {
    registerFacturationOrder,
    createFacturationOrderService,
    normalizeAttached
} from '../../services/facturationOrderService.js';

// Cliente simulado: responde según la tabla que toca cada consulta.
function fixture({ sources, services, instances, inherited = [] } = {}) {
    const calls = [];
    const client = {
        async query(sql, values) {
            calls.push({ sql, values });
            if (sql.includes('FROM "Ecosystem".documents') && sql.includes('document_type = $2')) {
                return { rows: sources ?? [{ id: 11, thirdParty_id: 5, status: 'active' }, { id: 12, thirdParty_id: 5, status: 'active' }] };
            }
            if (sql.includes('"products&services"')) {
                return { rows: services ?? [{ id: 1, rate: '19' }, { id: 2, rate: null }] };
            }
            if (sql.includes('FROM "Ecosystem".docs_instances')) return { rows: inherited };
            if (sql.includes('FROM "Process".process_instance')) {
                const known = instances ?? [{ id: 70, step_id: 3 }, { id: 71, step_id: 8 }];
                return { rows: known.filter(row => values[1].includes(String(row.id))) };
            }
            if (sql.includes('INSERT INTO "Ecosystem".documents(')) return { rows: [{ id: 900, ownSerial: 4 }] };
            return { rows: [] };
        }
    };
    const find = text => calls.filter(({ sql }) => sql.includes(text));
    return { client, calls, find };
}

const baseInfo = (overrides = {}) => ({
    company_id: 7,
    store_id: 2,
    thirdParty_id: 5,
    created_by: 9,
    description: ' Prefactura de prueba ',
    source_doc_ids: [11, 12],
    instances: [{ id: 70 }],
    items: [
        { service_id: 1, units: 2, unit_value: 119, facturation_description: 'Servicio ajustado' },
        { service_id: 2, units: 1, unit_value: 50.5, description: 'Sin impuesto' }
    ],
    ...overrides
});

test('crea la orden en borrador con el tipo Facturation Order y totales calculados en el servidor', async () => {
    const { client, find } = fixture();
    const result = await registerFacturationOrder(client, baseInfo({ total: 1, subTotal: 1 }));

    const [insert] = find('INSERT INTO "Ecosystem".documents(');
    assert.equal(insert.values[3], 'Facturation Order');
    assert.equal(insert.values[4], 'draft');
    // 2 x 119 con IVA 19% => base 200; 1 x 50.50 exento => base 50.50.
    assert.equal(insert.values[5], '250.50');
    assert.equal(insert.values[6], '288.50');
    assert.equal(insert.values[8], 'Prefactura de prueba');
    assert.deepEqual(JSON.parse(insert.values[12]), { source_documents: ['11', '12'] });
    assert.equal(result.id, 900);
    assert.equal(result.total, '288.50');
});

test('guarda cada ítem en services_movement ligado al documento nuevo', async () => {
    const { client, find } = fixture();
    await registerFacturationOrder(client, baseInfo());

    const movements = find('INSERT INTO "Inventory".services_movement');
    assert.equal(movements.length, 2);
    assert.deepEqual(movements[0].values, [7, 2, 5, '1', 2, 119, '238.00', 'Servicio ajustado', '70', 900]);
    assert.equal(movements[1].values[7], 'Sin impuesto');
    assert.equal(movements[1].values[9], 900);
});

test('relaciona la orden con cada orden de cliente en documents_group (principal = orden de cliente)', async () => {
    const { client, find } = fixture();
    await registerFacturationOrder(client, baseInfo());

    const [group] = find('INSERT INTO "Ecosystem".documents_group');
    assert.deepEqual(group.values, [['11', '12'], 900]);
    assert.match(group.sql, /ON CONFLICT \(main_doc_id, doc_id\) DO NOTHING/);
});

test('une los procesos elegidos con los de las órdenes de cliente y toma el paso del servidor', async () => {
    const { client, find } = fixture({ inherited: [{ instance_id: 70 }, { instance_id: 71 }] });
    const result = await registerFacturationOrder(client, baseInfo({
        instances: [{ id: 70, step_id: 999 }]
    }));

    const [lookup] = find('FROM "Process".process_instance');
    assert.deepEqual(lookup.values, [7, ['70', '71']]);
    const [link] = find('INSERT INTO "Ecosystem".docs_instances');
    assert.deepEqual(link.values, [900, ['70', '71'], [3, 8]]);
    assert.deepEqual(result.instance_ids, ['70', '71']);
    // El documento queda ligado al primer proceso elegido.
    const [insert] = find('INSERT INTO "Ecosystem".documents(');
    assert.equal(insert.values[10], '70');
    assert.equal(insert.values[11], 3);
});

test('sin procesos no escribe docs_instances', async () => {
    const { client, find } = fixture();
    await registerFacturationOrder(client, baseInfo({ instances: [] }));
    assert.equal(find('INSERT INTO "Ecosystem".docs_instances').length, 0);
});

test('rechaza órdenes de cliente de otro cliente o canceladas antes de escribir', async () => {
    for (const [row, message] of [
        [{ id: 11, thirdParty_id: 99, status: 'active' }, /pertenece a otro cliente/],
        [{ id: 11, thirdParty_id: 5, status: 'cancelled' }, /cancelled/]
    ]) {
        const { client, find } = fixture({ sources: [row, { id: 12, thirdParty_id: 5, status: 'active' }] });
        await assert.rejects(registerFacturationOrder(client, baseInfo()), message);
        assert.equal(find('INSERT').length, 0);
    }
});

test('rechaza si alguna orden de cliente no existe en la empresa', async () => {
    const { client, find } = fixture({ sources: [{ id: 11, thirdParty_id: 5, status: 'active' }] });
    await assert.rejects(registerFacturationOrder(client, baseInfo()), /no existe o no pertenece/);
    assert.equal(find('INSERT').length, 0);
});

test('valida la solicitud: ítems, cantidades enteras y órdenes de origen', async () => {
    const { client } = fixture();
    await assert.rejects(registerFacturationOrder(client, baseInfo({ items: [] })), /al menos un ítem/);
    await assert.rejects(registerFacturationOrder(client, baseInfo({ source_doc_ids: [] })), /al menos una orden de cliente/);
    await assert.rejects(registerFacturationOrder(client, baseInfo({ items: [{ service_id: 1, units: 1.5, unit_value: 10 }] })), /cantidad entera/);
    await assert.rejects(registerFacturationOrder(client, baseInfo({ items: [{ service_id: 1, units: 1, unit_value: -1 }] })), /valor unitario/);
    await assert.rejects(registerFacturationOrder(client, baseInfo({ store_id: undefined })), /tienda/);
    await assert.rejects(registerFacturationOrder(client, baseInfo({ source_doc_ids: ['x'] })), /no son válidos/);
});

test('rechaza productos que no existen en la empresa', async () => {
    const { client, find } = fixture({ services: [{ id: 1, rate: '19' }] });
    await assert.rejects(registerFacturationOrder(client, baseInfo()), /producto o servicio no existe/);
    assert.equal(find('INSERT').length, 0);
});

test('el servicio ejecuta todo dentro de una transacción y devuelve el resultado', async () => {
    const { client } = fixture();
    let used = 0;
    const service = createFacturationOrderService({
        withTransaction: async callback => { used += 1; return callback(client); }
    });
    const result = await service.register(baseInfo());
    assert.equal(used, 1);
    assert.equal(result.status, 'OK');
    assert.match(result.message, /#4/);
});

test('normaliza los adjuntos a una lista', () => {
    assert.deepEqual(normalizeAttached(undefined), []);
    assert.deepEqual(normalizeAttached(''), []);
    assert.deepEqual(normalizeAttached('["a.pdf"]'), ['a.pdf']);
    assert.deepEqual(normalizeAttached('a.pdf'), ['a.pdf']);
    assert.deepEqual(normalizeAttached(['a.pdf']), ['a.pdf']);
});
