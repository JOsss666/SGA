import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

// node --experimental-test-module-mocks --test api/test/controllers/registerDocument.test.js
test('registerDocument agrega specialConfig solo cuando se proporciona', { skip: !mock.module }, async () => {
    mock.module('../../app.js', { namedExports: { useDataBase: () => { throw new Error('No acceder a la base real'); }, withTransaction: () => {} } });
    mock.module('../../controllers/processController.js', { defaultExport: {} });
    try {
        const { default: utils } = await import('../../controllers/utilsController.js');
        const calls = [];
        const client = { query: async (sql, values) => { calls.push({ sql, values }); return { rows: [{ id: 1 }] }; } };
        await utils.registerDocument({ company_id: 7 }, { client });
        assert.ok(!calls[0].sql.includes('"specialConfig"'));
        assert.equal(calls[0].values.length, 12);
        const payload = { schemaVersion: 1, values: { description: "O'Hara", items: [{ id: 1, units: 2 }] } };
        await utils.registerDocument({ specialConfig: payload }, { client });
        assert.match(calls[1].sql, /"specialConfig"/);
        assert.match(calls[1].sql, /\$13::jsonb/);
        assert.deepEqual(JSON.parse(calls[1].values[12]), payload);
        assert.ok(!calls[1].sql.includes("O'Hara"));
        await utils.registerDocument({ specialConfig: null }, { client });
        assert.equal(calls[2].values[12], 'null');
    } finally {
        mock.restoreAll();
    }
});
