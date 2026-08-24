import test from 'node:test';
import assert from 'node:assert/strict';
import { appendBusinessDateRange } from './businessTimeZoneService.js';

test('crea un rango comercial inclusivo/exclusivo alrededor de medianoche', () => {
    const whereClauses = ['documents.company_id = $1'];
    const values = [4];

    appendBusinessDateRange({
        whereClauses,
        values,
        column: 'documents.created_at',
        start: '2026-08-18',
        end: '2026-08-18',
        companyPlaceholder: '$1'
    });

    assert.deepEqual(values, [4, '2026-08-18', '2026-08-18']);
    assert.match(whereClauses[1], /created_at >= \(\$2::date::timestamp AT TIME ZONE/);
    assert.match(whereClauses[2], /created_at < \(\(\(\$3::date \+ 1\)::timestamp\) AT TIME ZONE/);
    assert.ok(whereClauses.every(clause => !clause.includes('created_at::date')));
});

test('delega a PostgreSQL la conversión IANA para fechas con cambio DST', () => {
    const whereClauses = [];
    const values = [9];

    appendBusinessDateRange({
        whereClauses,
        values,
        column: 'documents.created_at',
        start: '2026-03-08',
        end: '2026-11-01',
        companyPlaceholder: '$1'
    });

    assert.match(whereClauses.join(' '), /company_settings/);
    assert.match(whereClauses.join(' '), /cs\.time_zone/);
    assert.deepEqual(values, [9, '2026-03-08', '2026-11-01']);
});
