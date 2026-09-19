import test from 'node:test';
import assert from 'node:assert/strict';
import { createNexoProcessReportHandler } from '../../controllers/custom-controllers/nexoProcessReportController.js';

const response = () => ({
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

// La compañía se toma del header X-SGA-Company-Id (con fallback a body.company_id).
const request = ({ header, body } = {}) => ({
    get(name) { return name === 'X-SGA-Company-Id' ? header : undefined; },
    body
});

for (const [name, req, expectedStatus] of [
    ['sin compañía', request({}), 400],
    ['compañía no numérica', request({ header: 'abc' }), 400],
    ['otra compañía por header', request({ header: '8' }), 403],
    ['otra compañía por body', request({ body: { company_id: 8 } }), 403]
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

for (const req of [
    request({ header: '7' }),
    request({ header: '7', body: { company_id: 7 } }),
    request({ body: { company_id: 7 } }),
    request({ body: { company_id: '7' } })
]) {
    test(`consulta únicamente la compañía 7 con ${JSON.stringify(req.body)} / header ${req.get('X-SGA-Company-Id')}`, async () => {
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
        await handler(req, res);
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, rows);
    });
}
