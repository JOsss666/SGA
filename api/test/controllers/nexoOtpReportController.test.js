import test from 'node:test';
import assert from 'node:assert/strict';
import { createNexoOtpReportHandler } from '../../controllers/custom-controllers/nexoOtpReportController.js';
import { otpColumns, getOtpColumns, exportOtpRows, filterOtpRows, normalizeOtpResponse } from '../../../costume-modules/nexo360/src/data/otpReport.mjs';

const response = () => ({ status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const request = (body = {}, header) => ({ body, get: () => header });

for (const [name, req, status] of [
    ['compañía ausente', request(), 400],
    ['showClient no booleano', request({ company_id: 7, showClient: 'false' }), 400],
    ['compañía inválida', request({ company_id: 'abc' }), 400],
    ['otra compañía', request({ company_id: 8 }), 403],
    ['header tiene prioridad', request({ company_id: 7 }, '8'), 403],
    ['fecha inexistente', request({ company_id: 7, minDate: '2026-02-30' }), 400],
    ['fecha no ISO', request({ company_id: 7, minDate: '24/09/2026' }), 400],
    ['rango invertido', request({ company_id: 7, minDate: '2026-09-25', maxDate: '2026-09-24' }), 400]
]) test(`rechaza ${name} antes de consultar`, async () => {
    let calls = 0;
    const handler = createNexoOtpReportHandler({ useDataBase: async () => { calls++; } });
    const res = response();
    await handler(req, res);
    assert.equal(res.statusCode, status);
    assert.equal(calls, 0);
});

test('filtra creación de OTP con límites UTC desde la zona de la compañía', async () => {
    const expected = [true, [{ id: '10:20', height: '0', width: '1.50' }]];
    const handler = createNexoOtpReportHandler({ useDataBase: async (sql, values, mode) => {
        assert.deepEqual(values, [7, '2026-09-24', '2026-09-24']);
        assert.equal(mode, 1);
        assert.match(sql, /otp\.created_at AT TIME ZONE 'UTC'\) >=/);
        assert.match(sql, /otp\.created_at AT TIME ZONE 'UTC'\) </);
        assert.match(sql, /\$3::date \+ 1/);
        assert.match(sql, /cs\.time_zone/);
        assert.match(sql, /SELECT DISTINCT movement\.doc_id/);
        assert.match(sql, /parameter\.company_id = otp\.company_id/);
        return expected;
    } });
    const res = response();
    await handler(request({ minDate: '2026-09-24', maxDate: '2026-09-24' }, '7'), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, expected);
});

for (const failed of [async () => [false, 'private error'], async () => { throw new Error('private error'); }]) {
    test('reporta fallo de consulta sin entregar detalles internos', async () => {
        const res = response();
        await createNexoOtpReportHandler({ useDataBase: failed })(request({ company_id: 7 }), res);
        assert.equal(res.statusCode, 500);
        assert.doesNotMatch(JSON.stringify(res.body), /private/);
    });
}

test('exporta ALTO y ANCHO después de Cliente, preserva cero, decimales y ausencias', () => {
    const rows = exportOtpRows([{ clientName: 'Cliente', height: 0, width: '1.50' }, { height: null }]);
    assert.deepEqual(Object.keys(rows[0]).slice(0, 6), ['OTP', 'OP padre', 'Orden de cliente', 'Cliente', 'ALTO', 'ANCHO']);
    assert.equal(rows[0].ALTO, 0);
    assert.equal(rows[0].ANCHO, '1.50');
    assert.equal(rows[1].ALTO, '');
    assert.deepEqual(otpColumns.slice(4, 6).map(column => column.key), ['height', 'width']);
});

test('busca por OTP, orden y medidas conservando las asociaciones de una OTP consolidada', () => {
    const rows = [{ id: '1:20', otpIdentifier: 'OTP#1', clientOrder: 'Orden #20', height: 0 }, { id: '1:21', otpIdentifier: 'OTP#1', clientOrder: 'Orden #21', height: 250 }];
    assert.equal(filterOtpRows(rows, 'otp#1').length, 2);
    assert.deepEqual(filterOtpRows(rows, 'Orden #21'), [rows[1]]);
    assert.deepEqual(filterOtpRows(rows, '250'), [rows[1]]);
    assert.deepEqual(filterOtpRows(rows, ''), rows);
});

test('normaliza las respuestas válidas y no disfraza errores como informes vacíos', () => {
    const rows = [{ id: '1:20' }];
    for (const payload of [rows, [true, rows], { data: rows }]) assert.deepEqual(normalizeOtpResponse(payload), rows);
    assert.throws(() => normalizeOtpResponse([false, 'error']));
    assert.throws(() => normalizeOtpResponse({ error: 'error' }));
});

test('oculta Cliente en columnas, búsqueda y exportación, manteniendo las medidas', () => {
    const columns = getOtpColumns(false);
    const rows = [{ clientName: 'Cliente privado', clientOrder: 'Orden #20', height: 0, width: '1.50' }];
    assert.equal(columns.some(column => column.key === 'clientName'), false);
    assert.deepEqual(columns.slice(0, 5).map(column => column.label), ['OTP', 'OP padre', 'Orden de cliente', 'ALTO', 'ANCHO']);
    assert.deepEqual(filterOtpRows(rows, 'Cliente privado', columns), []);
    assert.equal(filterOtpRows(rows, 'Orden #20', columns).length, 1);
    const exported = exportOtpRows(rows, columns);
    assert.equal(Object.hasOwn(exported[0], 'Cliente'), false);
    assert.equal(exported[0].ALTO, 0);
    assert.equal(exported[0].ANCHO, '1.50');
    assert.equal(getOtpColumns(), otpColumns);
    assert.equal(getOtpColumns(true), otpColumns);
});

for (const showClient of [undefined, true, false]) {
    test(`la consulta incluye Cliente únicamente si showClient lo permite: ${showClient}`, async () => {
        const handler = createNexoOtpReportHandler({ useDataBase: async sql => {
            assert.equal(sql.includes('AS "clientName"'), showClient !== false);
            return [true, []];
        } });
        const res = response();
        await handler(request({ company_id: 7, showClient }), res);
        assert.equal(res.statusCode, 200);
    });
}

for (const showParentStage of [undefined, false, true]) {
    test(`Etapa OP usa la etapa del padre solo cuando se solicita: ${showParentStage}`, async () => {
        const handler = createNexoOtpReportHandler({ useDataBase: async sql => {
            assert.equal(sql.includes('parent_step.name AS "parentStage"'), showParentStage === true);
            assert.equal(sql.includes('parent_step.id = parent.step_id'), showParentStage === true);
            if (showParentStage) {
                assert.match(sql, /parent_step.company_id = parent.company_id/);
                assert.match(sql, /parent_step.process_id = parent.process_id/);
            }
            return [true, []];
        } });
        const res = response();
        await handler(request({ company_id: 7, showParentStage }), res);
        assert.equal(res.statusCode, 200);
    });
}

test('rechaza parámetros de Etapa OP que no sean booleanos', async () => {
    let called = false;
    const handler = createNexoOtpReportHandler({ useDataBase: async () => { called = true; } });
    const res = response();
    await handler(request({ company_id: 7, showParentStage: 'true' }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(called, false);
});

test('Etapa OP es opcional e independiente de Cliente en tabla, búsqueda y exportación', () => {
    const rows = [{ parentIdentifier: 'OP#20', parentStage: 'Asignación proveedores', processStage: 'Impresión', height: 0 }];
    for (const showClient of [false, true]) {
        for (const showParentStage of [false, true]) {
            const columns = getOtpColumns(showClient, showParentStage);
            assert.equal(columns.some(c => c.key === 'clientName'), showClient);
            assert.equal(columns.some(c => c.key === 'parentStage'), showParentStage);
            assert.equal(filterOtpRows(rows, 'Asignación proveedores', columns).length, showParentStage ? 1 : 0);
            const exported = exportOtpRows(rows, columns)[0];
            assert.equal(Object.hasOwn(exported, 'Etapa OP'), showParentStage);
            assert.equal(exported['Etapa proceso'], 'Impresión');
            if (showParentStage) {
                assert.equal(columns[2].label, 'Etapa OP');
                assert.equal(exported['Etapa OP'], 'Asignación proveedores');
            }
        }
    }
    assert.equal(getOtpColumns().some(c => c.key === 'parentStage'), false);
});

test('el portal usa la identidad autenticada e ignora compañía, proveedor y columnas enviados por el cliente', async () => {
    const handler = createNexoOtpReportHandler({
        resolveSupplierAccess: async credentials => {
            assert.deepEqual(credentials, { company_key: 'company', access_key: 'access' });
            return { company_id: 7, user_id: 212 };
        },
        useDataBase: async (sql, values) => {
            assert.deepEqual(values, [7, '212', '2026-09-24', '2026-09-24']);
            assert.match(sql, /otp\."thirdParty_id" = \$2/);
            assert.match(sql, /\$3::date/);
            assert.match(sql, /\$4::date/);
            assert.equal(sql.includes('AS "clientName"'), false);
            assert.equal(sql.includes('AS "parentStage"'), false);
            return [true, [{ id: '10:20' }]];
        }
    });
    const res = response();
    await handler(request({ company_key: 'company', access_key: 'access', company_id: 8, thirdParty_id: 999,
        showClient: true, showParentStage: true, minDate: '2026-09-24', maxDate: '2026-09-24' }, '8'), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [true, [{ id: '10:20' }]]);
});

for (const [access, expected] of [[null, 401], [{ company_id: 7 }, 401], [{ company_id: 7, user_id: 0 }, 401], [{ company_id: 8, user_id: 212 }, 403]]) {
    test(`portal rechaza acceso inválido o ajeno: ${JSON.stringify(access)}`, async () => {
        let called = false;
        const handler = createNexoOtpReportHandler({ resolveSupplierAccess: async () => access, useDataBase: async () => { called = true; } });
        const res = response();
        await handler(request({ company_id: 7, thirdParty_id: 212 }), res);
        assert.equal(res.statusCode, expected);
        assert.equal(called, false);
    });
}

test('el portal no consulta OTP si falla la validación de acceso', async () => {
    let called = false;
    const handler = createNexoOtpReportHandler({
        resolveSupplierAccess: async () => { throw Object.assign(new Error('Credenciales ausentes'), { statusCode: 400 }); },
        useDataBase: async () => { called = true; }
    });
    const res = response();
    await handler(request(), res);
    assert.equal(res.statusCode, 401);
    assert.equal(called, false);
});
