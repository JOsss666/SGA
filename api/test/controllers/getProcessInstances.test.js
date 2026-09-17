import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

// Ejecutar con node --experimental-test-module-mocks --test.
test('getProcessInstances conserva el filtro de tercero para cualquier estado', async (t) => {
    const queries = [];
    const result = [true, [{ id: 100, thirdParty_id: 212 }]];
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
        const invoke = (payload) => new Promise((resolve, reject) => {
            const req = new EventEmitter();
            controller.getProcessInstances(req, {
                writeHead: (status) => assert.equal(status, 200),
                end: (body) => {
                    try { assert.deepEqual(JSON.parse(body), result); resolve(); }
                    catch (error) { reject(error); }
                }
            });
            req.emit('data', JSON.stringify(payload));
            req.emit('end');
        });
        for (const status of [['active', 'pending'], ['all'], undefined]) {
            await t.test(`tercero con estado ${JSON.stringify(status)}`, async () => {
                await invoke({ company_id: 7, thirdParty_id: 212, status });
                const { sql, values } = queries.at(-1);
                assert.match(sql, /process_instance.company_id = \$1/);
                assert.match(sql, /process_instance\."thirdParty_id" = \$\d+/);
                assert.equal(values[0], 7);
                assert.equal(values.at(-1), 212);
                assert.equal(sql.includes('status = ANY'), status?.[0] === 'active');
            });
        }
        await t.test('otros módulos pueden omitir el tercero', async () => {
            await invoke({ company_id: 7, status: ['all'] });
            const { sql, values } = queries.at(-1);
            const where = sql.slice(sql.indexOf('WHERE "Process".process_instance.company_id'));
            assert.ok(!where.includes('"thirdParty_id" ='));
            assert.deepEqual(values, [7]);
        });
    } finally {
        mock.restoreAll();
    }
});
