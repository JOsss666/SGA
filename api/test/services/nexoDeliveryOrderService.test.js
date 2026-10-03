import test from 'node:test';
import assert from 'node:assert/strict';
import { createNexoDeliveryOrderService } from '../../services/nexoDeliveryOrderService.js';

const validInput = {
    service_movement_ids: [12], scheduled_at: '2026-09-24T09:00',
    pickup_location: 'Proveedor', authorized_name: 'Ana', authorized_identification: '123'
};

test('restringe las órdenes de entrega al contexto de 4K 360 antes de abrir transacción', async () => {
    let opened = false;
    const service = createNexoDeliveryOrderService({ withTransaction: async () => { opened = true; } });
    await assert.rejects(service.create(validInput, { companyId: 8, userId: 10 }), /únicamente para 4K 360/);
    assert.equal(opened, false);
});

test('valida destinatario y productos antes de abrir transacción', async () => {
    let opened = false;
    const service = createNexoDeliveryOrderService({ withTransaction: async () => { opened = true; } });
    await assert.rejects(service.create({ ...validInput, authorized_name: '' }, { companyId: 7, userId: 10 }), /persona autorizada/);
    await assert.rejects(service.create({ ...validInput, service_movement_ids: [12, 12] }, { companyId: 7, userId: 10 }), /no puede repetirse/);
    assert.equal(opened, false);
});
