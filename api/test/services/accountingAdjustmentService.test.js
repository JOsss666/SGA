import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAccountingAdjustment } from '../../services/accountingAdjustmentService.js';

const voucher = {
    doc_date: '2026-09-19', description: 'Reclasificación de saldos', attached: [],
    lines: [
        { account_id: 10, thirdParty_id: 20, description: 'Débito', debit: '100.25', credit: 0 },
        { account_id: 11, description: 'Crédito', debit: 0, credit: '100.25' }
    ]
};

test('acepta comprobante cuadrado y normaliza valores', () => {
    const result = validateAccountingAdjustment(voucher);
    assert.equal(result.debit, 100.25);
    assert.equal(result.credit, 100.25);
    assert.equal(result.lines[0].thirdParty_id, 20);
});

test('acepta observaciones opcionales', () => {
    const result = validateAccountingAdjustment({ ...voucher, description: '' });
    assert.equal(result.description, '');
});

test('rechaza una partida doble descuadrada', () => {
    assert.throws(() => validateAccountingAdjustment({ ...voucher, lines: [voucher.lines[0], { ...voucher.lines[1], credit: 90 }] }), /no cuadra/);
});

test('rechaza débito y crédito simultáneos en la misma línea', () => {
    assert.throws(() => validateAccountingAdjustment({ ...voucher, lines: [{ ...voucher.lines[0], credit: 1 }, voucher.lines[1]] }), /pero no ambos/);
});
