import test from 'node:test';
import assert from 'node:assert/strict';
import { createProcessEvidenceService } from '../../services/processInstanceService.js';

const input = () => ({ company_key: 'company', access_key: 'access', instance_id: '100', step_id: '76', store_id: '23',
    description: ' Evidencia de avance ', attached: [{ id: '5', url: 'https://untrusted.invalid/file' }],
    company_id: 999, created_by: 999, thirdParty_id: 999 });

function fixture(failure) {
    const documents = [], links = [], events = [];
    const client = { async query(sql, params) {
        if (sql.includes('externalThirdPatiesAccess')) {
            assert.deepEqual(params, ['company', 'access']);
            assert.match(sql, /u.status = 'active'/);
            assert.match(sql, /a.expires_at > CURRENT_TIMESTAMP/);
            return { rows: failure === 'access' ? [] : [{ company_id: 7, thirdParty_id: 212, responsable: 83 }] };
        }
        if (sql.includes('process_instance')) {
            assert.equal(params[0], 7);
            assert.match(sql, /"thirdParty_id" = \$/);
            assert.match(sql, /status = 'active'/);
            if (sql.includes('FOR UPDATE')) {
                assert.deepEqual(params, [7, '100', 212]);
                return { rows: failure === 'instance' ? [] : [{ id: '100', step_id: failure === 'stage' ? '77' : '76' }] };
            }
            assert.deepEqual(params, [7, 212]);
            return { rows: [{ id: '100', step_id: '76', process_name: 'Producción' }] };
        }
        if (sql.includes('stores')) {
            assert.equal(params[0], 7);
            return { rows: failure === 'store' ? [] : [{ id: '23', name: 'Principal' }] };
        }
        if (sql.includes('.attached')) {
            assert.deepEqual(params, [7, 83, ['5']]);
            return { rows: failure === 'file' ? [] : [{ id: '5', url: 'https://storage.example/verified' }] };
        }
        throw new Error('Unexpected query');
    } };
    const service = createProcessEvidenceService({
        async withTransaction(callback) {
            events.push('BEGIN');
            try { const result = await callback(client); events.push('COMMIT'); return result; }
            catch (error) { documents.length = 0; links.length = 0; events.push('ROLLBACK'); throw error; }
        },
        async registerDocument(info, options) {
            assert.equal(options.client, client);
            assert.equal(options.includeProcessFields, true);
            documents.push(info);
            return failure === 'document' ? {} : { id: '900', ownSerial: 1 };
        },
        async linkDocumentInstances(docId, info, options) {
            assert.equal(options.client, client);
            links.push({ docId, info });
            return { status: failure === 'link' ? 'Error' : 'OK' };
        }
    });
    return { service, documents, links, events };
}

test('registra evidencia con responsable interno, adjuntos verificados y vínculo a la etapa bloqueada', async () => {
    const { service, documents, links, events } = fixture();
    const result = await service.register(input());
    assert.deepEqual(result, { id: '900', ownSerial: 1, instance_id: '100', step_instance: '76' });
    assert.deepEqual(documents[0], {
        company_id: 7, store_id: '23', thirdParty_id: 212, created_by: 83,
        doc_type: 'Process Voucher', status: 'active', subTotal: 0, total: 0,
        description: 'Evidencia de avance', attached: [{ id: '5', url: 'https://storage.example/verified' }],
        instance_id: '100', step_id: '76'
    });
    assert.equal(links[0].docId, '900');
    assert.deepEqual(events, ['BEGIN', 'COMMIT']);
});

test('rechaza acceso, instancia, tienda o archivos ajenos y cambio de etapa sin conservar escrituras', async () => {
    for (const [failure, statusCode] of [['access', 401], ['instance', 403], ['store', 403], ['file', 403], ['stage', 409]]) {
        const { service, documents, events } = fixture(failure);
        await assert.rejects(service.register(input()), { statusCode });
        assert.deepEqual(documents, []);
        assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
    }
});

test('revierte el documento si falla su registro o el vínculo', async () => {
    for (const failure of ['document', 'link']) {
        const { service, documents, links, events } = fixture(failure);
        await assert.rejects(service.register(input()));
        assert.deepEqual(documents, []);
        assert.deepEqual(links, []);
        assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
    }
});

test('valida campos obligatorios y acepta observación sin adjuntos o adjuntos sin descripción', async () => {
    for (const change of [{ instance_id: '' }, { step_id: null }, { store_id: 'abc' }, { attached: ['url'] },
        { description: ' ', attached: [] }, { attached: [{ id: Number.MAX_SAFE_INTEGER + 1 }] }]) {
        const { service, events } = fixture();
        await assert.rejects(service.register({ ...input(), ...change }), { statusCode: 400 });
        assert.deepEqual(events, []);
    }
    for (const change of [{ attached: [] }, { description: '' }]) {
        await fixture().service.register({ ...input(), ...change });
    }
});

test('las opciones solo enumeran las instancias del tercero autenticado y tiendas de su compañía', async () => {
    const { service, events } = fixture();
    const result = await service.options(input());
    assert.equal(result.instances.length, 1);
    assert.equal(result.stores[0].id, '23');
    assert.deepEqual(events, ['BEGIN', 'COMMIT']);
    await assert.rejects(fixture('access').service.options(input()), { statusCode: 401 });
});
