import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBalanceByThirdPartyQuery, validateBalanceByThirdPartyFilters } from '../../services/balanceByThirdPartyService.js';

test('valida el periodo y los terceros del balance por tercero', () => {
    assert.throws(() => validateBalanceByThirdPartyFilters({ start_date: '2026-02-30', end_date: '2026-03-01' }), /rango de fechas/);
    assert.throws(() => validateBalanceByThirdPartyFilters({ start_date: '2026-03-02', end_date: '2026-03-01' }), /rango de fechas/);
    assert.throws(() => validateBalanceByThirdPartyFilters({ start_date: '2026-03-01', end_date: '2026-03-31', third_party_ids: ['x'] }), /terceros/);
    assert.deepEqual(validateBalanceByThirdPartyFilters({ start_date: '2026-03-01', end_date: '2026-03-31', third_party_ids: [7, '7', 8], allAccounts: true }), {
        thirdPartyIds: ['7', '8'], includeZero: true
    });
});

test('agrupa por tercero, conserva sin tercero y filtra con parámetros', () => {
    const query = buildBalanceByThirdPartyQuery(11, {
        start_date: '2026-03-01', end_date: '2026-03-31', allAccounts: false, third_party_ids: [7]
    });
    assert.deepEqual(query.values, [11, '2026-03-01', '2026-03-31', false, ['7']]);
    assert.match(query.text, /t\."thirdParty_id" = ANY\(\$5::bigint\[\]\)/);
    assert.match(query.text, /COALESCE\(NULLIF\(tp\.names, ''\), 'Sin tercero asociado'\)/);
    assert.match(query.text, /m\.opening_balance <> 0 OR m\.total_debit <> 0 OR m\.total_credit <> 0/);
    assert.match(query.text, /t\.created_at < \(\$2::date::timestamp AT TIME ZONE/);
    assert.match(query.text, /t\.created_at < \(\(\(\$3::date \+ 1\)::timestamp\) AT TIME ZONE/);
});

test('conserva el período abierto del balance actual cuando no llegan fechas', () => {
    const query = buildBalanceByThirdPartyQuery(11, { allAccounts: false });
    assert.equal(query.values[1], '1900-01-01');
    assert.match(query.values[2], /^\d{4}-\d{2}-\d{2}$/);
});
