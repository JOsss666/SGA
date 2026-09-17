import test from 'node:test';
import assert from 'node:assert/strict';
import { createProcessInstance } from '../../services/processInstanceService.js';

const input = () => ({ external_access:true, company_key:'company', access_key:'access', company_id:7,
    process_id:10, step_id:20, user_id:214, thirdParty_id:214, status:'pending' });

function fixture({ access = { company_id:7, responsable:83, internal_user_id:83 }, scope = true } = {}) {
    const writes = [];
    const client = { async query(sql, values) {
        if (sql.includes('externalThirdPatiesAccess')) {
            assert.deepEqual(values, ['company', 'access']);
            assert.match(sql, /u.company_id = a.company_id/);
            assert.match(sql, /a.expires_at > CURRENT_TIMESTAMP/);
            return { rows: access ? [access] : [] };
        }
        if (sql.includes('SELECT p.id')) return { rows: scope ? [{ id:10 }] : [] };
        writes.push({ sql, values });
        return { rows:[{ id:100, ownSerial:1, created_at:'2026-09-15T00:00:00.000Z' }] };
    } };
    return { client, writes };
}

test('usa el responsable del acceso para la instancia y el historial, preservando el tercero', async () => {
    const { client, writes } = fixture();
    const data = input();
    await createProcessInstance(client, data);
    assert.equal(writes[0].values[9], 83);
    assert.equal(writes[0].values[8], 214);
    assert.equal(writes[1].values[3], 83);
    assert.equal(data.user_id, 214);
});

test('ignora el usuario y la compañía manipulados del cuerpo para el acceso externo', async () => {
    const { client, writes } = fixture();
    await createProcessInstance(client, { ...input(), user_id:999, responsable:999, company_id:999 });
    assert.equal(writes[0].values[0], 7);
    assert.equal(writes[0].values[9], 83);
});

test('rechaza accesos vencidos, responsables no disponibles y referencias ajenas antes de insertar', async () => {
    for (const options of [{ access:null }, { access:{ company_id:7, responsable:83, internal_user_id:null } }, { scope:false }]) {
        const { client, writes } = fixture(options);
        await assert.rejects(createProcessInstance(client, input()), error => [401,422].includes(error.statusCode));
        assert.equal(writes.length, 0);
    }
});

test('no usa el ID de tercero como alternativa si faltan las credenciales externas', async () => {
    const { client, writes } = fixture();
    await assert.rejects(createProcessInstance(client, { ...input(), access_key:undefined }), { statusCode:401 });
    assert.equal(writes.length, 0);
});

test('conserva el contrato de creación de los módulos internos', async () => {
    const { client, writes } = fixture();
    await createProcessInstance(client, { company_id:7, process_id:10, step_id:20, user_id:83, status:'active' });
    assert.equal(writes.length, 2);
    assert.equal(writes[0].values[9], 83);
    assert.equal(writes[1].values[3], 83);
});
