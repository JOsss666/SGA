import test from 'node:test';
import assert from 'node:assert/strict';
import getThirdPartiesTool from '../../../systemAI/tools/definitions/getThirdParties.tool.js';
import { buildThirdPartiesPayload } from '../../../systemAI/tools/executors/getThirdParties.executor.js';

test('define una función única y operaciones válidas para terceros', () => {
    assert.equal(getThirdPartiesTool.id, 'get_thirdparties_tool');
    assert.equal(getThirdPartiesTool.definition.function.name, 'get_third_parties');
    assert.deepEqual(
        getThirdPartiesTool.definition.function.parameters.required,
        ['operation']
    );
    assert.ok(
        getThirdPartiesTool.definition.function.parameters.properties.operation.enum.includes('list')
    );
});

test('construye el payload con la empresa autenticada y filtros soportados', () => {
    const payload = buildThirdPartiesPayload({
        operation:'summary',
        identification_number:' 900123456 '
    }, { companyId:4 });

    assert.equal(payload.company_id, 4);
    assert.equal(payload.identificationNumber, '900123456');
    assert.equal(payload.comercialInfo, true);
    assert.equal(payload.id, undefined);
});

test('solo permite by_id con un ID interno válido', () => {
    assert.throws(
        () => buildThirdPartiesPayload({ operation:'by_id' }, { companyId:4 }),
        /ID de tercero válido/
    );
});
