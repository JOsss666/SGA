import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSalesInvoiceControllerPayload } from '../../tools/executors/getFacturationSellInvoices.executor.js';

test('ignora ids inventados para consultas generales de facturas', () => {
    for (const operation of ['list', 'latest', 'summary']) {
        const payload = buildSalesInvoiceControllerPayload(
            { operation, id: 1, status: 'all' },
            { companyId: 4 }
        );
        assert.equal(payload.company_id, 4);
        assert.equal(payload.id, undefined);
        assert.equal(payload.status, undefined);
    }
});

test('solo envía id al controller con la operación by_id', () => {
    const payload = buildSalesInvoiceControllerPayload(
        { operation: 'by_id', id: 25 },
        { companyId: 1 }
    );
    assert.equal(payload.id, 25);
});
