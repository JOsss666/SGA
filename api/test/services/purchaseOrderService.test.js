import test from 'node:test';
import assert from 'node:assert/strict';
import { registerPurchaseOrder, createPurchaseOrderService } from '../../services/purchaseOrderService.js';

function fixture({ supplier = true, listAssigned = true, services, sources, instances } = {}) {
    const calls = [];
    const client = {
        async query(sql, values) {
            calls.push({ sql, values });
            if (sql.includes('FROM "Ecosystem".documents') && sql.includes('document_type = $2')) {
                return { rows: sources ?? [{ id: 11, status: 'active' }, { id: 12, status: 'active' }] };
            }
            if (sql.includes('FROM "Process".process_instance')) {
                return { rows: (instances ?? [{ id: 70, step_id: 3 }]).filter(row => values[1].includes(String(row.id))) };
            }
            if (sql.includes('FROM "Ecosystem".thirdparties')) return { rows: supplier ? [{ id: 5 }] : [] };
            if (sql.includes('"thirdparties_pricesList"')) return { rows: listAssigned ? [{ '?column?': 1 }] : [] };
            if (sql.includes('"products&services"')) return { rows: services ?? [{ id: 1, rate: '19' }, { id: 2, rate: null }] };
            if (sql.includes('INSERT INTO "Ecosystem".documents(')) return { rows: [{ id: 800, ownSerial: 3 }] };
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
    price_list_id: 25,
    description: ' Compra de prueba ',
    items: [
        { service_id: 1, units: 2, unit_value: 119, description: 'Con IVA' },
        { service_id: 2, units: 1, unit_value: 50.5 }
    ],
    ...overrides
});

test('crea la orden de compra en borrador con costos y totales calculados en el servidor', async () => {
    const { client, find } = fixture();
    const result = await registerPurchaseOrder(client, baseInfo());
    assert.equal(result.id, 800);
    assert.equal(result.total, '288.50');
    assert.equal(result.subTotal, '250.50'); // 238/1.19 = 200 + 50.5
    assert.equal(result.document_status, 'draft');
    const insert = find('INSERT INTO "Ecosystem".documents(')[0];
    assert.equal(insert.values[3], 'Purchase Order');
    assert.equal(insert.values[2], 5);
    assert.equal(insert.values[8], 'Compra de prueba');
    assert.equal(find('INSERT INTO "Inventory".services_movement(').length, 2);
});

test('permite costo cero digitado y rechaza costo vacío o negativo', async () => {
    const { client } = fixture({ services: [{ id: 1, rate: '19' }] });
    await registerPurchaseOrder(client, baseInfo({ items: [{ service_id: 1, units: 1, unit_value: 0 }] }));
    for (const unit_value of ['', null, -1, 'x']) {
        await assert.rejects(
            registerPurchaseOrder(fixture().client, baseInfo({ items: [{ service_id: 1, units: 1, unit_value }] })),
            /costo unitario/
        );
    }
});

test('valida proveedor, lista de precios asignada, ítems y productos', async () => {
    await assert.rejects(registerPurchaseOrder(fixture({ supplier: false }).client, baseInfo()), /proveedor no existe/);
    await assert.rejects(registerPurchaseOrder(fixture({ listAssigned: false }).client, baseInfo()), /no está asignada/);
    await assert.rejects(registerPurchaseOrder(fixture({ services: [{ id: 1, rate: 0 }] }).client, baseInfo()), /producto o servicio no existe/);
    const { client } = fixture();
    await assert.rejects(registerPurchaseOrder(client, baseInfo({ items: [] })), /al menos un ítem/);
    await assert.rejects(registerPurchaseOrder(client, baseInfo({ store_id: undefined })), /tienda/);
    await assert.rejects(registerPurchaseOrder(client, baseInfo({ thirdParty_id: 'x' })), /proveedor/);
    await assert.rejects(registerPurchaseOrder(client, baseInfo({ items: [{ service_id: 1, units: 1.5, unit_value: 1 }] })), /cantidad entera/);
});

test('sin lista de precios no consulta la asignación', async () => {
    const { client, find } = fixture();
    await registerPurchaseOrder(client, baseInfo({ price_list_id: undefined }));
    assert.equal(find('"thirdparties_pricesList"').length, 0);
});

test('el servicio ejecuta el registro dentro de la transacción recibida', async () => {
    const { client } = fixture();
    const service = createPurchaseOrderService({ withTransaction: callback => callback(client) });
    const result = await service.register(baseInfo());
    assert.equal(result.status, 'OK');
    assert.match(result.message, /#3/);
});

test('con órdenes de cliente y procesos las enlaza en documents_group y docs_instances', async () => {
    const { client, find } = fixture();
    const result = await registerPurchaseOrder(client, baseInfo({ source_doc_ids: [11, 12], instances: [{ id: 70 }] }));
    assert.deepEqual(result.source_doc_ids, ['11', '12']);
    assert.deepEqual(result.instance_ids, ['70']);
    assert.deepEqual(find('INSERT INTO "Ecosystem".documents_group')[0].values, [['11', '12'], 800]);
    assert.equal(find('INSERT INTO "Ecosystem".docs_instances').length, 1);
    const insert = find('INSERT INTO "Ecosystem".documents(')[0];
    assert.equal(insert.values[11], '70');
});

test('rechaza órdenes de cliente inexistentes o canceladas', async () => {
    await assert.rejects(
        registerPurchaseOrder(fixture({ sources: [{ id: 11, status: 'active' }] }).client, baseInfo({ source_doc_ids: [11, 12] })),
        /no existe o no pertenece/
    );
    await assert.rejects(
        registerPurchaseOrder(fixture({ sources: [{ id: 11, status: 'cancelled' }] }).client, baseInfo({ source_doc_ids: [11] })),
        /cancelled/
    );
});
