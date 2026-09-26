import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

test('historial: fechas comerciales, compañía y compatibilidad', async (t) => {
    const queries = [];
    const result = [true, []];
    mock.module('../../app.js', {
        namedExports: {
            useDataBase: async (sql, values) => {
                queries.push({ sql, values });
                return result;
            },
            withTransaction: () => { throw new Error('No se permiten escrituras'); }
        }
    });
    try {
        const { default: controller } = await import('../../controllers/processController.js');
        const invoke = payload => new Promise((resolve, reject) => {
            const req = new EventEmitter();
            controller.getInstanceHistorial(req, {
                writeHead: status => assert.equal(status, 200),
                end: body => {
                    try {
                        assert.deepEqual(JSON.parse(body), result);
                        resolve(queries.at(-1));
                    } catch (error) { reject(error); }
                }
            });
            req.emit('data', JSON.stringify(payload));
            req.emit('end');
        });

        for (const day of ['2026-09-25', '2026-03-08', '2026-11-01']) {
            await t.test(`día completo ${day}: medianoche incluida y siguiente medianoche excluida`, async () => {
                const { sql, values } = await invoke({ company_id: 7, start_date: day, end_date: day });
                assert.deepEqual(values, [7, day, day]);
                assert.match(sql, /process_historial\.company_id = \$1/);
                assert.match(sql, /created_at AT TIME ZONE 'UTC'\) >= \(\$2::date::timestamp AT TIME ZONE/);
                assert.match(sql, /created_at AT TIME ZONE 'UTC'\) < \(\(\(\$3::date \+ 1\)::timestamp\) AT TIME ZONE/);
                // Cada medianoche se convierte con IANA: no se suman 24 horas UTC durante DST.
                assert.match(sql, /cs\.time_zone/);
                assert.match(sql, /cs\.company_id = \$1/);
                assert.doesNotMatch(sql, /created_at::date|INTERVAL '24 hours'/);
                for (const field of ['created_at_local', 'business_date', 'business_time_zone']) {
                    assert.ok(sql.includes(`AS ${field}`));
                }
            });
        }
        await t.test('solo inicio, solo fin y fechas borradas', async () => {
            const start = await invoke({ company_id: 7, start_date: '2026-09-25' });
            assert.deepEqual(start.values, [7, '2026-09-25']);
            assert.match(start.sql, />= \(\$2::date/);
            assert.doesNotMatch(start.sql, / < \(/);
            const end = await invoke({ company_id: 7, end_date: '2026-09-25' });
            assert.deepEqual(end.values, [7, '2026-09-25']);
            assert.match(end.sql, / < \(\(\(\$2::date/);
            assert.doesNotMatch(end.sql, / >= /);
            const cleared = await invoke({ company_id: 7, start_date: '', end_date: '' });
            assert.deepEqual(cleared.values, [7]);
            assert.doesNotMatch(cleared.sql, / >= | <= | < /);
        });
        await t.test('fecha y hora locales de otros módulos mantienen precisión', async () => {
            const { sql, values } = await invoke({ company_id: 7, start_date: '2026-09-25T09:30', end_date: '2026-09-25T16:45' });
            assert.deepEqual(values, [7, '2026-09-25T09:30', '2026-09-25T16:45']);
            assert.match(sql, />= \(\$2::timestamp AT TIME ZONE/);
            assert.match(sql, /<= \(\$3::timestamp AT TIME ZONE/);
        });
        await t.test('instantes con zona explícita no se reinterpretan como hora local', async () => {
            const { sql } = await invoke({ company_id: 7, start_date: '2026-09-25T09:30:00Z', end_date: '2026-09-25T16:45:00-05:00' });
            assert.match(sql, />= \$2::timestamptz/);
            assert.match(sql, /<= \$3::timestamptz/);
        });
        await t.test('consumidores sin company_id usan la compañía de cada registro', async () => {
            const { sql, values } = await invoke({ start_date: '2026-09-25' });
            assert.deepEqual(values, ['2026-09-25']);
            assert.match(sql, /cs\.company_id = "Process"\.process_historial\.company_id/);
        });
    } finally {
        mock.restoreAll();
    }
});
