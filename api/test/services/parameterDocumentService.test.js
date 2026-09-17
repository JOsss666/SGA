import test from 'node:test';
import assert from 'node:assert/strict';
import { createParameterDocumentService } from '../../services/parameterDocumentService.js';
import { createNexo360Service } from '../../services/costumeServices/nexo360service.js';

const request = () => ({
    company_key: 'company-test', access_key: 'access-test',
    payload: { schemaVersion: 1, paramdoc_id: 5, destiny: 'createCaralNexo360Order', values: {
        clientId: 212, thirdParty_id: 212, description: 'Aviso', width: 50, items: [{ id: 1, units: 2 }], artworkFiles: []
    } }
});

function fixture(failure) {
    const events = [], documents = [], groups = [], links = [], children = [];
    let currentStep = '70';
    const config = {
        destiny: 'createCaralNexo360Order', fieldDefaults: { required: true },
        fields: [{ key: 'clientId', type: 'string' }, { key: 'width', type: 'number', props: { min: 1 } }, { key: 'items', type: 'array' }],
        execution: { store_id: 23, created_by: 83, componentValues: { 10: 5 }, allowedClientIds: [212] }
    };
    const client = { async query(sql, params) {
        if (sql.includes('externalThirdPatiesAccess')) return { rows: failure === 'access' ? [] : [{ company_id: 7, thirdParty_id: 212 }] };
        if (sql.includes('externalDocParameters')) {
            assert.deepEqual(params, ['5', 7, 212]);
            return { rows: failure === 'template' ? [] : [{ config }] };
        }
        if (sql.includes('AS store_ok')) return { rows: [{ store_ok: failure !== 'scope', user_ok: true, client_ok: true, third_party_ok: true }] };
        if (sql.includes('orders_delegation_config')) {
            assert.deepEqual(params, ['7', '1000', '71']);
            assert.match(sql, /child.company_id = parent.company_id/);
            assert.match(sql, /initial.id = config.child_initial_step_id/);
            assert.match(sql, /ORDER BY step."order", step.id LIMIT 1/);
            return { rows: failure === 'subprocessConfig' ? [] : [{ process_id: '10', step_id: '76' }] };
        }
        if (sql.includes('"Process".process_instance')) {
            assert.match(sql, /company_id = \$1/);
            assert.match(sql, /status = 'active'/);
            assert.match(sql, /FOR (SHARE|UPDATE)/);
            assert.equal(params[0], '7');
            return { rows: failure === 'instance' ? [] : [{ id: '1000', step_id: failure === 'stageChanged' && events.filter(event => event === 'BEGIN').length === 2 ? '71' : currentStep, thirdParty_id: failure === 'instanceClient' ? 999 : 212 }] };
        }
        if (sql.includes('Inventory".presets')) return { rows: [{ preset_id: 1, product_id: 10, units: 3, available_product_id: 10 }] };
        if (sql.includes('documents_group')) {
            if (failure === 'group') throw new Error('group failed');
            groups.push(params);
            return { rowCount: 1 };
        }
        throw new Error('Unexpected query');
    } };
    const withTransaction = async callback => {
        const before = [documents.length, groups.length, links.length, currentStep, children.length];
        events.push('BEGIN');
        try { const result = await callback(client); events.push('COMMIT'); return result; }
        catch (error) { events.push('ROLLBACK'); documents.length = before[0]; groups.length = before[1]; links.length = before[2]; currentStep = before[3]; children.length = before[4]; throw error; }
    };
    const registerDocument = async (info, options) => {
        assert.equal(options.client, client);
        assert.equal(options.includeProcessFields, true);
        if (failure === 'primary' && !documents.length) throw new Error('primary failed');
        if (documents.length) assert.deepEqual(events, ['BEGIN', 'COMMIT', 'BEGIN']);
        documents.push(structuredClone(info));
        return { id: 100 + documents.length, ownSerial: documents.length };
    };
    const linkDocumentInstances = async (docId, info, options) => {
        assert.equal(options.client, client);
        if (!info.instances.length) return { status: 'skipped' };
        if (failure === 'primaryLink' && docId === 101) return { status: 'Error' };
        if (failure === 'secondaryLink' && docId === 102) throw new Error('secondary link failed');
        if (failure === 'subprocessLink' && info.instances[0].instance_id === '2000') return { status: 'Error' };
        links.push({ doc_id: docId, instances: structuredClone(info.instances) });
        return { status: 'OK' };
    };
    const nexo = createNexo360Service({ withTransaction, registerDocument,
        createProcessInstance: async (connection, info) => {
            assert.equal(connection, client);
            assert.equal(currentStep, '71');
            assert.deepEqual(events, ['BEGIN', 'COMMIT', 'BEGIN']);
            if (failure === 'subprocessCreate') throw new Error('subprocess failed');
            if (failure === 'subprocessEmpty') return {};
            children.push(structuredClone(info));
            return { id: '2000' };
        },
        advanceProcessInstance: async (connection, info) => {
            assert.equal(connection, client);
            assert.equal(info.previous_step, currentStep);
            assert.equal(documents.length, 1);
            assert.deepEqual(events, ['BEGIN', 'COMMIT', 'BEGIN']);
            if (failure === 'advance') throw new Error('No puede avanzar');
            if (failure === 'noNext') return { success:false, message:'Sin siguiente etapa' };
            currentStep = '71';
            return { success:true, nextStepId:71 };
        },
        registerPurchaseItems: async (_info, _id, options) => {
            assert.equal(options.client, client);
            if (failure === 'items') throw new Error('items failed');
            return { status: 'OK' };
        },
        linkDocumentInstances
    });
    const service = createParameterDocumentService({ withTransaction, registerDocument, linkDocumentInstances,
        actions: { createCaralNexo360Order: nexo.createCaralNexo360Order }
    });
    return { service, events, documents, groups, config, links, children, getCurrentStep: () => currentStep };
}

test('guarda el payload diligenciado y enlaza JSON principal con Client Order en dos transacciones consecutivas', async () => {
    const { service, events, documents, groups } = fixture();
    const input = request();
    const before = structuredClone(input);
    const result = await service.register(input);
    assert.deepEqual(input, before);
    assert.deepEqual(documents[0].specialConfig, input.payload);
    assert.equal(documents[0].doc_type, 'JSON Parametrization');
    assert.equal(documents[0].thirdParty_id, '212');
    assert.equal(documents[1].doc_type, 'Client Order');
    assert.equal(documents[1].total, 30);
    assert.equal(documents[1].items[0].units, 6);
    assert.equal(result.doc_id, 101);
    assert.equal(result.secondary_doc_id, 102);
    assert.equal(result.paramDoc_id, '5');
    assert.deepEqual(groups, [[101, 102]]);
    assert.deepEqual(events, ['BEGIN', 'COMMIT', 'BEGIN', 'COMMIT']);
    assert.ok(!JSON.stringify(documents[0].specialConfig).includes('access-test'));
});

test('conserva el principal si fallan los movimientos o la relación secundaria', async () => {
    for (const failure of ['primary', 'items', 'group']) {
        const { service, events, documents, groups } = fixture(failure);
        await assert.rejects(service.register(request()));
        assert.deepEqual(events, failure === 'primary' ? ['BEGIN', 'ROLLBACK'] : ['BEGIN', 'COMMIT', 'BEGIN', 'ROLLBACK']);
        assert.equal(documents.length, failure === 'primary' ? 0 : 1);
        assert.deepEqual(groups, []);
    }
});

test('rechaza accesos vencidos, plantillas ajenas y referencias de otra compañía', async () => {
    for (const failure of ['access', 'template', 'scope']) {
        const { service, documents } = fixture(failure);
        await assert.rejects(service.register(request()));
        assert.deepEqual(documents, []);
    }
});

test('no permite elegir otro destino, cliente o introducir credenciales en el payload', async () => {
    for (const mutate of [
        input => { input.payload.destiny = 'constructor'; },
        input => { input.payload.values.clientId = 999; },
        input => { input.payload.values.thirdParty_id = 999; },
        input => { input.payload.access_key = 'secret'; },
        input => { input.payload.paramDoc_id = 999; },
        input => { input.payload.values.items = []; },
        input => { input.payload.values.width = -1; }
    ]) {
        const { service, documents } = fixture();
        const input = request(); mutate(input);
        await assert.rejects(service.register(input));
        assert.deepEqual(documents, []);
    }
});

test('conserva paramDoc_id en specialConfig y lo devuelve como referencia a la plantilla', async () => {
    const { service, documents } = fixture();
    const input = request();
    input.payload.paramDoc_id = 5;
    const result = await service.register(input);
    assert.equal(documents[0].specialConfig.paramDoc_id, 5);
    assert.equal(result.paramDoc_id, '5');
    assert.notEqual(result.paramDoc_id, String(result.doc_id));
});

test('el tercero remitente identifica la parametrización y clientId identifica la orden', async () => {
    const { service, config, documents } = fixture();
    config.execution.allowedClientIds = [300];
    const input = request();
    input.payload.values.clientId = 300;
    await service.register(input);
    assert.equal(documents[0].thirdParty_id, '212');
    assert.equal(documents[0].specialConfig.values.thirdParty_id, 212);
    assert.equal(documents[1].thirdParty_id, '300');
});

test('mantiene compatibilidad con envíos anteriores sin thirdParty_id', async () => {
    const { service, documents } = fixture();
    const input = request();
    delete input.payload.values.thirdParty_id;
    await service.register(input);
    assert.equal(documents[0].thirdParty_id, '212');
});

test('los IDs internos y precios proceden de la plantilla del servidor', async () => {
    const { service, documents } = fixture();
    const input = request();
    Object.assign(input.payload.values, { company_id: 999, created_by: 999, store_id: 999, componentValues: { 10: 999 } });
    await service.register(input);
    assert.equal(documents[1].company_id, '7');
    assert.equal(documents[1].created_by, '83');
    assert.equal(documents[1].store_id, '23');
    assert.equal(documents[1].total, 30);
});

test('sin usuario o tienda no crea el principal; sin precios conserva el principal', async () => {
    for (const key of ['created_by', 'store_id', 'componentValues']) {
        const { service, config, documents, events } = fixture();
        delete config.execution[key];
        await assert.rejects(service.register(request()));
        assert.equal(documents.length, key === 'componentValues' ? 1 : 0);
        assert.deepEqual(events, key === 'componentValues' ? ['BEGIN', 'COMMIT', 'BEGIN', 'ROLLBACK'] : ['BEGIN', 'ROLLBACK']);
    }
});

test('registra ParamDoc en la etapa original y Client Order en la siguiente, admitiendo step_id o step_instance', async () => {
    for (const stage of [{ step_id: 70 }, { step_instance: '70' }, {}, { step_id: 70, step_instance: '70' }]) {
        const { service, documents, links, events } = fixture();
        const result = await service.register({ ...request(), instance_id: 1000, ...stage });
        assert.equal(result.instance_id, '1000');
        assert.equal(result.step_instance, '70');
        assert.deepEqual(links, [
            ...[101, 102].map((doc_id, index) => ({ doc_id, instances: [{ instance_id: '1000', step_id: String(70 + index) }] })),
            { doc_id: 102, instances: [{ instance_id: '2000', step_id: '76' }] }
        ]);
        assert.equal(result.secondary.step_instance, '71');
        for (const document of documents) {
            assert.equal(document.instance_id, '1000');
            assert.equal(document.step_id, document.doc_type === 'Client Order' ? '71' : '70');
        }
        assert.deepEqual(events, ['BEGIN', 'COMMIT', 'BEGIN', 'COMMIT']);
    }
});

test('rechaza contexto incompleto, IDs inválidos y etapas incompatibles antes de escribir', async () => {
    for (const context of [
        { step_instance: 70 }, { instance_id: 'bad' },
        { instance_id: 1000, step_id: 70, step_instance: 71 },
        { instance_id: 1000, step_instance: 71 }
    ]) {
        const { service, documents, links } = fixture();
        await assert.rejects(service.register({ ...request(), ...context }));
        assert.deepEqual(documents, []);
        assert.deepEqual(links, []);
    }
    const { service } = fixture();
    await assert.rejects(service.register({ ...request(), instance_id: 1000, step_id: 71 }), { statusCode: 409 });
});

test('rechaza instancias inaccesibles o de otro cliente', async () => {
    for (const failure of ['instance', 'instanceClient']) {
        const { service, documents, events } = fixture(failure);
        await assert.rejects(service.register({ ...request(), instance_id: 1000 }), { statusCode: 422 });
        assert.deepEqual(documents, []);
        assert.deepEqual(events, ['BEGIN', 'ROLLBACK']);
    }
});

test('un fallo secundario conserva el principal y su vínculo; un fallo primario revierte su registro', async () => {
    for (const failure of ['primaryLink', 'secondaryLink', 'group', 'stageChanged', 'advance', 'noNext']) {
        const { service, documents, links, groups, events, getCurrentStep } = fixture(failure);
        await assert.rejects(service.register({ ...request(), instance_id: 1000, step_instance: 70 }), error => {
            if (failure === 'primaryLink') assert.equal(error.primaryDocument, undefined);
            else {
                assert.equal(error.primaryDocument.doc_id, 101);
                assert.equal(error.primaryDocument.secondary_doc_id, null);
                assert.equal(error.primaryDocument.step_instance, '70');
                if (failure === 'stageChanged') assert.equal(error.statusCode, 409);
            }
            return true;
        });
        assert.equal(documents.length, failure === 'primaryLink' ? 0 : 1);
        assert.equal(links.length, failure === 'primaryLink' ? 0 : 1);
        assert.equal(getCurrentStep(), '70');
        assert.deepEqual(groups, []);
        assert.deepEqual(events, failure === 'primaryLink' ? ['BEGIN', 'ROLLBACK'] : ['BEGIN', 'COMMIT', 'BEGIN', 'ROLLBACK']);
    }
});

test('los valores del formulario no pueden cambiar ni inyectar el contexto de proceso', async () => {
    for (const context of [{}, { instance_id: 1000, step_id: 70 }]) {
        const { service, documents, links } = fixture();
        const input = { ...request(), ...context };
        Object.assign(input.payload.values, { instance_id: 999, step_id: 888, instances: [{ instance_id: 999, step_id: 888 }] });
        await service.register(input);
        for (const document of documents) assert.equal(document.instance_id, context.instance_id ? '1000' : undefined);
        assert.equal(links.length, context.instance_id ? 3 : 0);
    }
});

test('crea el subproceso en su primera etapa y vincula la misma orden conservando el proceso principal', async () => {
    const { service, children, documents, links } = fixture();
    const input = { ...request(), instance_id: 1000, step_id: 70 };
    Object.assign(input.payload.values, { process_id: 999, child_process_id: 999, parent_step: 999 });
    const result = await service.register(input);
    assert.deepEqual(children, [{ company_id: '7', process_id: '10', step_id: '76', status: 'active',
        parent_id: '1000', parent_step: '71', thirdParty_id: '212', user_id: '83' }]);
    assert.equal(documents.length, 2, 'No duplica el documento ni sus ítems para el subproceso');
    assert.equal(documents[1].instance_id, '1000');
    assert.deepEqual(links.filter(link => link.doc_id === 102).map(link => link.instances[0]), [
        { instance_id: '1000', step_id: '71' }, { instance_id: '2000', step_id: '76' }
    ]);
    assert.deepEqual(result.secondary.subprocess, { instance_id: '2000', process_id: '10', step_instance: '76' });
});

test('revierte avance, orden y subproceso si falla la configuración, creación, vínculo o agrupación', async () => {
    for (const failure of ['subprocessConfig', 'subprocessCreate', 'subprocessEmpty', 'subprocessLink', 'group']) {
        const { service, children, documents, links, events, getCurrentStep } = fixture(failure);
        await assert.rejects(service.register({ ...request(), instance_id: 1000 }), error => {
            assert.equal(error.primaryDocument.doc_id, 101);
            assert.equal(error.primaryDocument.secondary_doc_id, null);
            return true;
        });
        assert.deepEqual(children, []);
        assert.equal(documents.length, 1);
        assert.equal(links.length, 1);
        assert.equal(getCurrentStep(), '70');
        assert.deepEqual(events, ['BEGIN', 'COMMIT', 'BEGIN', 'ROLLBACK']);
    }
});

test('la orden independiente no crea subprocesos ni requiere configuración de delegación', async () => {
    const { service, children } = fixture('subprocessConfig');
    const result = await service.register(request());
    assert.equal(result.secondary.subprocess, null);
    assert.deepEqual(children, []);
});
