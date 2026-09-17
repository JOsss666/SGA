import test from 'node:test';
import assert from 'node:assert/strict';
import { createNexo360Service } from '../../../services/costumeServices/nexo360service.js';

const payload = () => ({
    company_id: 7, store_id: 23, thirdParty_id: 212, created_by: 83,
    items: [{ id: 1, units: 2 }, { id: 2, units: 0.5 }],
    componentValues: { 10: 5, 11: 2 }, instance_id: 1000
});

function fixture({ components, scope, instance, failure } = {}) {
    const events = [];
    const writes = [];
    const client = {
        async query(sql, values) {
            assert.equal(values[0], '7', 'Cada lectura debe delimitar la compañía');
            if (sql.includes('AS store_ok')) return { rows: [scope ?? { store_ok: true, third_party_ok: true, user_ok: true }] };
            if (sql.includes('process_instance')) return { rows: [instance ?? { id: 1000, thirdParty_id: 212, step_id: 70 }] };
            assert.ok(sql.includes('preset.company_id = $1'));
            return { rows: components ?? [
                { preset_id: 1, product_id: 10, units: '3', available_product_id: 10 },
                { preset_id: 1, product_id: 11, units: '0.5', available_product_id: 11 },
                { preset_id: 2, product_id: 10, units: '4', available_product_id: 10 }
            ] };
        }
    };
    const service = createNexo360Service({
        async withTransaction(callback) {
            events.push('BEGIN');
            try {
                const result = await callback(client);
                events.push('COMMIT');
                return result;
            } catch (error) {
                events.push('ROLLBACK');
                throw error;
            }
        },
        async registerDocument(info, options) {
            assert.equal(options.client, client);
            assert.equal(options.includeProcessFields, true);
            writes.push(['document', structuredClone(info)]);
            if (failure === 'document') return {};
            return { id: 100, ownSerial: 25 };
        },
        async registerPurchaseItems(info, docId, options) {
            assert.equal(options.client, client);
            assert.equal(docId, 100);
            writes.push(['items', structuredClone(info.items)]);
            return { status: failure === 'items' ? 'Error' : 'OK' };
        },
        async linkDocumentInstances(docId, info, options) {
            assert.equal(options.client, client);
            assert.equal(docId, 100);
            writes.push(['instances', structuredClone(info.instances)]);
            if (failure === 'instances') throw new Error('Fallo al vincular');
            return { status: info.instances.length ? 'OK' : 'skipped' };
        }
    });
    return { service, events, writes };
}

test('expande presets, conserva fracciones y registra la orden con el mismo cliente transaccional', async () => {
    const { service, events, writes } = fixture();
    const input = payload();
    const before = structuredClone(input);
    const order = await service.generateClientOrder(input);
    assert.deepEqual(input, before);
    assert.deepEqual(order.items.map(item => item.units), [6, 1, 2]);
    assert.deepEqual(order.items.map(item => item.total), [30, 2, 10]);
    assert.equal(order.total, 42);
    assert.equal(order.id, 100);
    assert.equal(writes[0][1].doc_type, 'Client Order');
    assert.deepEqual(writes[2][1], [{ instance_id: '1000', step_id: 70 }]);
    assert.deepEqual(events, ['BEGIN', 'COMMIT']);
});

test('transformPresets conserva líneas repetidas sin perder sus cantidades', async () => {
    const { service } = fixture();
    const items = await service.transformPresets([{ id: 2, units: 1 }, { id: 2, units: 2 }], { company_id: 7 });
    assert.deepEqual(items.map(item => item.units), [4, 8]);
});

test('rechaza cantidades e identificadores inválidos antes de abrir la transacción', async () => {
    for (const input of [
        { ...payload(), items: [] },
        { ...payload(), items: [{ id: 1, units: 0 }] },
        { ...payload(), items: [{ id: 1, units: Infinity }] },
        { ...payload(), company_id: '7;SELECT' },
        { ...payload(), created_by: true },
        { ...payload(), componentValues: undefined }
    ]) {
        const { service, events } = fixture();
        await assert.rejects(service.generateClientOrder(input));
        assert.deepEqual(events, []);
    }
});

test('rechaza presets inexistentes, vacíos o con productos de otra compañía antes de escribir', async () => {
    for (const components of [[], [{ preset_id: 1, product_id: 10, units: 3, available_product_id: null }]]) {
        const { service, writes, events } = fixture({ components });
        await assert.rejects(service.generateClientOrder(payload()), /preset/);
        assert.deepEqual(writes, []);
        assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
    }
});

test('rechaza referencias ajenas a la compañía y procesos de otro cliente', async () => {
    for (const options of [
        { scope: { store_ok: false, third_party_ok: true, user_ok: true } },
        { instance: { id: 1000, thirdParty_id: 999, step_id: 70 } }
    ]) {
        const { service, writes } = fixture(options);
        await assert.rejects(service.generateClientOrder(payload()), { statusCode: 422 });
        assert.deepEqual(writes, []);
    }
});

test('no inventa precios ni descarta diferencias en el total de origen', async () => {
    for (const input of [
        { ...payload(), componentValues: { 10: 5 } },
        { ...payload(), componentValues: { 10: -1, 11: 2 } },
        { ...payload(), total: 43 }
    ]) {
        const { service, writes } = fixture();
        await assert.rejects(service.generateClientOrder(input));
        assert.deepEqual(writes, []);
    }
});

test('propaga fallos de cada escritura para que withTransaction revierta la operación', async () => {
    for (const failure of ['document', 'items', 'instances']) {
        const { service, events, writes } = fixture({ failure });
        await assert.rejects(service.generateClientOrder(payload()));
        assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
        assert.equal(writes.length, ['document', 'items', 'instances'].indexOf(failure) + 1);
    }
});

test('permite importes cero explícitos y órdenes sin instancia', async () => {
    const { service, writes } = fixture();
    const result = await service.generateClientOrder({ ...payload(), instance_id: undefined, componentValues: { 10: 0, 11: 0 }, total: 0 });
    assert.equal(result.total, 0);
    assert.deepEqual(writes[2][1], []);
});
