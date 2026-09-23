import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

// Sin conexiones reales: valida el contrato HTTP y la consulta de lectura.
test('historial de clicks filtra fechas comerciales y conserva filtros existentes', async (t) => {
    const queries = [];
    let fail = false;
    mock.module('../../app.js', {
        namedExports: { useDataBase: async (sql, values) => {
            if (fail) throw new Error('Database unavailable');
            queries.push({ sql, values });
            return [true, []];
        } }
    });
    mock.module('../../controllers/processController.js', { defaultExport: {} });
    try {
        const { default: controller } = await import('../../controllers/custom-controllers/zjController.js');
        const invoke = payload => new Promise(resolve => {
            const req = new EventEmitter();
            let status;
            controller.getHistorialClicksControl(req, {
                writeHead: code => { status = code; },
                end: body => resolve({ status, body: JSON.parse(body) })
            });
            req.emit('data', JSON.stringify(payload));
            req.emit('end');
        });

        await t.test('incluye medianoche inicial y excluye medianoche del día posterior', async () => {
            assert.equal((await invoke({ company_id: 7, asset_id: 42, start_date: '2026-09-23', end_date: '2026-09-23' })).status, 200);
            const { sql, values } = queries.at(-1);
            assert.deepEqual(values, [42, 7, '2026-09-23', '2026-09-23']);
            assert.match(sql, /asset_id = \$1/);
            assert.match(sql, /company_id = \$2/);
            assert.match(sql, /created_at >= \(\$3::date::timestamp AT TIME ZONE/);
            assert.match(sql, /created_at < \(\(\(\$4::date \+ 1\)::timestamp\) AT TIME ZONE/);
            assert.match(sql, /cs.company_id = "Custom"\."z&j_clickControl".company_id/);
            assert.match(sql, /AS created_at_local/);
            assert.match(sql, /AS business_date/);
            assert.match(sql, /AS business_time_zone/);
        });
        for (const day of ['2026-03-08', '2026-11-01']) {
            await t.test(`usa zona IANA configurada para cambio DST ${day}`, async () => {
                await invoke({ company_id: 7, start_date: day, end_date: day });
                const { sql, values } = queries.at(-1);
                assert.deepEqual(values, [7, day, day]);
                assert.match(sql, /SELECT cs.time_zone/);
                assert.match(sql, /"Ecosystem".company_settings/);
                assert.ok(!sql.includes("INTERVAL '24 hours'"));
            });
        }
        for (const [dates, bounds, values] of [
            [{}, [false, false], [7]],
            [{ start_date: '', end_date: '' }, [false, false], [7]],
            [{ start_date: '2026-09-23' }, [true, false], [7, '2026-09-23']],
            [{ end_date: '2026-09-23' }, [false, true], [7, '2026-09-23']]
        ]) {
            await t.test(`rango opcional ${JSON.stringify(dates)}`, async () => {
                await invoke({ company_id: 7, ...dates });
                const query = queries.at(-1);
                assert.deepEqual(query.values, values);
                assert.equal(query.sql.includes('created_at >='), bounds[0]);
                assert.equal(query.sql.includes('created_at <'), bounds[1]);
            });
        }
        for (const dates of [
            { start_date: '2026-09-24', end_date: '2026-09-23' },
            { start_date: '2026-02-30' },
            { end_date: 'invalid' }
        ]) {
            await t.test(`rechaza rango inválido ${JSON.stringify(dates)}`, async () => {
                const before = queries.length;
                assert.equal((await invoke({ company_id: 7, ...dates })).status, 400);
                assert.equal(queries.length, before);
            });
        }
        await t.test('mantiene consultas existentes por activo sin fechas', async () => {
            assert.equal((await invoke({ asset_id: 42 })).status, 200);
            assert.deepEqual(queries.at(-1).values, [42]);
        });
        await t.test('responde ante fallos de consulta', async () => {
            fail = true;
            const response = await invoke({ company_id: 7 });
            assert.equal(response.status, 500);
            assert.equal(response.body[0], false);
        });
    } finally {
        mock.restoreAll();
    }
});
