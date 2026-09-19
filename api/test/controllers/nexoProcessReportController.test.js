import test from 'node:test';
import assert from 'node:assert/strict';
import { createNexoProcessReportHandler } from '../../controllers/custom-controllers/nexoProcessReportController.js';

const response = () => ({
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

for (const [name, req, expectedStatus] of [
    ['sin sesión', { body: { company_id: 7 } }, 401],
    ['otra compañía', { auth: { userId: 1, companyId: 8 }, body: { company_id: 8 } }, 403],
    ['suplantación por body', { auth: { userId: 1, companyId: 8 }, body: { company_id: 7 } }, 403],
    ['body de otra compañía', { auth: { userId: 1, companyId: 7 }, body: { company_id: 8 } }, 403],
    ['sin compañía verificada', { auth: { userId: 1 }, body: { company_id: 7 } }, 403]
]) {
    test(`rechaza ${name} antes de consultar datos`, async () => {
        let queries = 0;
        const handler = createNexoProcessReportHandler({ useDataBase: async () => { queries++; } });
        const res = response();
        await handler(req, res);
        assert.equal(res.statusCode, expectedStatus);
        assert.equal(queries, 0);
    });
}

for (const body of [undefined, { company_id: 7 }, { company_id: '7' }]) {
    test(`consulta únicamente la compañía autenticada 7 con body ${JSON.stringify(body)}`, async () => {
        const rows = [{ id: 42, doc_id: 42 }];
        const handler = createNexoProcessReportHandler({
            useDataBase: async (sql, values, mode) => {
                assert.deepEqual(values, [7]);
                assert.equal(mode, 1);
                assert.match(sql, /WHERE document.company_id = \$1/);
                assert.match(sql, /document.document_type = 'Client Order'/);
                return rows;
            }
        });
        const res = response();
        await handler({ auth: { userId: 1, companyId: 7 }, body }, res);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, rows);
    });
}
