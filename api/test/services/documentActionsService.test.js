import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocumentActionsService } from '../../services/documentActionsService.js';

function fixture({ document, actor = true, transactions = [{ id: 501 }] } = {}) {
    const queries = [];
    const client = {
        async query(sql, values) {
            queries.push({ sql, values });
            if (sql.includes('FROM "Ecosystem".users')) return { rows: actor ? [{ user_id: 5 }] : [] };
            if (sql.includes('FOR UPDATE')) {
                return { rows: document === null ? [] : [{ id: 90, document_type: 'Sell Invoice', status: 'pending', ...document }] };
            }
            if (sql.includes('UPDATE "Ecosystem".transactions')) return { rows: transactions };
            if (sql.includes('RETURNING id, description')) return { rows: [{ id: 90, description: 'nota', attached: '[]', status: 'active' }] };
            return { rows: [] };
        }
    };
    const writes = () => queries.filter(({ sql }) => /UPDATE/.test(sql) && !sql.includes('FOR UPDATE'));
    return { client, queries, writes };
}

const input = { companyId: 7, userId: 5, docId: 90 };

test('activar pasa el documento a active y sus transacciones draft a posted', async () => {
    const { client, queries } = fixture();
    const service = createDocumentActionsService();
    const result = await service.activate(client, input);
    assert.equal(result.previous_status, 'pending');
    assert.equal(result.current_status, 'active');
    assert.deepEqual(result.transactions_updated, ['501']);
    assert.equal(result.ledgerChanged, true);
    const docUpdate = queries.find(({ sql }) => sql.includes('UPDATE "Ecosystem".documents'));
    assert.deepEqual(docUpdate.values, ['7', '90', 'active']);
    const txUpdate = queries.find(({ sql }) => sql.includes('UPDATE "Ecosystem".transactions'));
    assert.deepEqual(txUpdate.values, ['7', '90', 'posted', ['draft']]);
    const detailUpdate = queries.find(({ sql }) => sql.includes('UPDATE "Ecosystem".transaction_detail'));
    assert.deepEqual(detailUpdate.values.slice(0, 3), ['7', ['501'], 'posted']);
});

test('cancelar pasa documento y transacciones vivas a cancelled', async () => {
    const { client, queries } = fixture({ document: { status: 'active' } });
    const result = await createDocumentActionsService().cancel(client, input);
    assert.equal(result.current_status, 'cancelled');
    assert.deepEqual(queries.find(({ sql }) => sql.includes('UPDATE "Ecosystem".transactions')).values,
        ['7', '90', 'cancelled', ['draft', 'posted', 'pendingPayment']]);
});

test('es idempotente: si ya está en el estado final no reescribe el documento', async () => {
    const { client, queries } = fixture({ document: { status: 'cancelled' }, transactions: [] });
    const result = await createDocumentActionsService().cancel(client, input);
    assert.equal(result.changed, false);
    assert.equal(result.ledgerChanged, false);
    assert.equal(queries.some(({ sql }) => sql.includes('UPDATE "Ecosystem".documents')), false);
});

test('la política puede vetar la acción antes de cualquier escritura y recibe el contexto', async () => {
    const seen = [];
    const policy = { async authorize(context) { seen.push(context); throw Object.assign(new Error('No permitido'), { statusCode: 409 }); } };
    const { client, writes } = fixture({ document: { status: 'active' } });
    await assert.rejects(createDocumentActionsService({ policy }).cancel(client, input), { statusCode: 409 });
    assert.deepEqual(writes(), []);
    assert.equal(seen[0].action, 'cancel');
    assert.equal(seen[0].companyId, '7');
    assert.equal(seen[0].document.status, 'active');
});

test('rechaza documento ajeno a la compañía, usuario inactivo e identificadores inválidos', async () => {
    const service = createDocumentActionsService();
    await assert.rejects(service.activate(fixture({ document: null }).client, input), { statusCode: 404 });
    await assert.rejects(service.activate(fixture({ actor: false }).client, input), { statusCode: 401 });
    for (const bad of [{ ...input, docId: '9;DROP' }, { ...input, companyId: 0 }, { ...input, userId: -1 }]) {
        const { client, queries } = fixture();
        await assert.rejects(service.cancel(client, bad), { statusCode: 400 });
        assert.deepEqual(queries, []);
    }
});

test('editar solo cambia descripción y adjuntos y valida su forma', async () => {
    const service = createDocumentActionsService();
    const { client, queries } = fixture();
    const result = await service.edit(client, { ...input, changes: { description: 'nota', attached: [{ id: 1, url: 'u' }] } });
    assert.equal(result.ledgerChanged, false);
    const update = queries.find(({ sql }) => sql.includes('RETURNING id, description'));
    assert.deepEqual(update.values, ['7', '90', 'nota', '[{"id":1,"url":"u"}]']);
    for (const changes of [{}, { amount: 5 }, { description: 5 }, { attached: 'x' }, { description: 'x'.repeat(2001) }]) {
        const f = fixture();
        await assert.rejects(service.edit(f.client, { ...input, changes }), { statusCode: 400 });
        assert.deepEqual(f.queries, []);
    }
});
