import test from 'node:test';
import assert from 'node:assert/strict';
import getDocumentsTool from '../../tools/definitions/getDocumentsTool.js';
import { buildDocumentsPayload } from '../../tools/executors/getDocuments.tool.js';

test('define types como un arreglo JSON Schema válido', () => {
    const types = getDocumentsTool.definition.function.parameters.properties.types;
    assert.equal(types.type, 'array');
    assert.equal(types.items.type, 'string');
    assert.ok(types.items.enum.includes('Sell Invoice'));
    assert.ok(types.items.enum.includes('Purchase Document'));
});

test('construye el payload de documentos usando la empresa autenticada', () => {
    const payload = buildDocumentsPayload({
        operation: 'list',
        types: ['Sell Invoice'],
        status: 'all',
        initial_date: '2026-08-01',
        final_date: '2026-08-19'
    }, { companyId: 4 });

    assert.equal(payload.company_id, 4);
    assert.deepEqual(payload.allowedTypes, ['Sell Invoice']);
    assert.equal(payload.status, undefined);
    assert.equal(payload.start_date, '2026-08-01');
    assert.equal(payload.end_date, '2026-08-19');
});
