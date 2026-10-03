import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuxiliaryLedgerQuery, canReadAuxiliaryLedger, validateLedgerFilters } from '../../services/auxiliaryLedgerService.js';

test('valida el período y los filtros delimitados del Libro Auxiliar', () => {
    assert.throws(() => validateLedgerFilters({ start_date: '2026-02-30', end_date: '2026-03-01' }), /rango de fechas/);
    assert.throws(() => validateLedgerFilters({ start_date: '2026-03-02', end_date: '2026-03-01' }), /rango de fechas/);
    assert.deepEqual(validateLedgerFilters({ start_date: '2026-03-01', end_date: '2026-03-31', account_codes: ['1305'], third_party_ids: [7], document_types: ['Sell Invoice'] }), {
        start_date: '2026-03-01', end_date: '2026-03-31', grouping: 'account', include_zero: false,
        account_codes: ['1305'], third_party_ids: ['7'], cost_center_ids: [], document_types: ['Sell Invoice'], account_from: '', account_to: ''
    });
});

test('consulta saldo inicial y período en una lectura, con fecha comercial y límite inclusivo-exclusivo', () => {
    const filters = validateLedgerFilters({ start_date: '2026-03-01', end_date: '2026-03-31', include_zero: true });
    const { text, values } = buildAuxiliaryLedgerQuery(11, filters);
    assert.equal(values[0], 11);
    assert.match(text, /td\.created_at < \(\(\(\$2::date \+ 1\)::timestamp\) AT TIME ZONE/);
    assert.match(text, /td\.created_at < \(\$3::date::timestamp AT TIME ZONE/);
    assert.match(text, /PARTITION BY s\.account_id, s\.third_party_id/);
    assert.match(text, /ORDER BY s\.document_date_sort, s\.created_at, s\.transaction_id, s\.id/);
    assert.match(text, /CASE WHEN s\.account_nature = 'CR' THEN -1 ELSE 1 END/);
    assert.match(text, /LIMIT 20001/);
});

test('conserva todos los filtros acumulados de cuentas y terceros en la consulta', () => {
    const filters = validateLedgerFilters({
        start_date: '2026-03-01', end_date: '2026-03-31',
        account_codes: ['1105', '1305', '1105'], third_party_ids: ['7', 12, '7']
    });
    assert.deepEqual(filters.account_codes, ['1105', '1305']);
    assert.deepEqual(filters.third_party_ids, ['7', '12']);

    const { text, values } = buildAuxiliaryLedgerQuery(11, filters);
    assert.match(text, /a\.code LIKE code \|\| '%'/);
    assert.match(text, /td\."thirdParty_id" = ANY/);
    assert.ok(values.some(value => Array.isArray(value) && value.join(',') === '1105,1305'));
    assert.ok(values.some(value => Array.isArray(value) && value.join(',') === '7,12'));
});

test('exige Administración y un módulo contable en la configuración del servidor', () => {
    assert.equal(canReadAuxiliaryLedger({ access: { modules: { management: { use: true }, contability: { use: true } } } }), true);
    assert.equal(canReadAuxiliaryLedger({ access: { modules: { management: { use: true } } } }), false);
    assert.equal(canReadAuxiliaryLedger({ access: { suspended: true, modules: { management: { use: true }, treasury: { use: true } } } }), false);
});
