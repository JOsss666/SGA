import { documentPolicy } from './documentPolicy.js';

// Ejecuta las acciones sobre un documento (activar, cancelar, editar). NO decide si la
// acción está permitida: eso lo hace `policy.authorize` (ver documentPolicy.js), que se
// inyecta para poder reemplazarla o probarla. Este servicio solo valida integridad
// (compañía, usuario activo, documento existente, datos bien formados) y aplica el cambio.
// Todas las funciones esperan un `client` dentro de una transacción abierta por el llamador.

function fail(message, statusCode = 400) {
    throw Object.assign(new Error(message), { statusCode });
}

function id(value, field) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) fail(`${field} no es válido.`);
    if (!/^[1-9]\d*$/.test(String(value)) || BigInt(value) > 9223372036854775807n) fail(`${field} no es válido.`);
    return String(value);
}

// Estados contables (transactions / transaction_detail) que acompañan cada acción.
const LEDGER_SYNC = {
    activate: { to: 'posted', from: ['draft'] },
    cancel: { to: 'cancelled', from: ['draft', 'posted', 'pendingPayment'] }
};
const DOCUMENT_STATUS = { activate: 'active', cancel: 'cancelled' };
const MAX_DESCRIPTION = 2000;

export function createDocumentActionsService({ policy = documentPolicy } = {}) {
    async function lockDocument(client, companyId, docId) {
        const result = await client.query(`
            SELECT id, company_id, document_type, status::text AS status, description, attached,
                   "thirdParty_id", instance_id
            FROM "Ecosystem".documents
            WHERE company_id = $1 AND id = $2
            FOR UPDATE;
        `, [companyId, docId]);
        if (!result.rows[0]) fail('El documento no existe en la compañía.', 404);
        return result.rows[0];
    }

    async function assertActor(client, companyId, userId) {
        const result = await client.query(`
            SELECT user_id FROM "Ecosystem".users
            WHERE company_id = $1 AND user_id = $2 AND status = 'active';
        `, [companyId, userId]);
        if (!result.rows[0]) fail('Usuario no válido para la compañía.', 401);
    }

    // Lleva las transacciones del documento (y su detalle) al estado contable de la acción.
    async function syncLedger(client, companyId, docId, { to, from }) {
        const transactions = await client.query(`
            UPDATE "Ecosystem".transactions
            SET status = $3::transactions_status, updated_at = CURRENT_TIMESTAMP
            WHERE company_id = $1 AND doc_id = $2 AND status = ANY($4::transactions_status[])
            RETURNING id;
        `, [companyId, docId, to, from]);
        const transactionIds = transactions.rows.map(row => String(row.id));
        if (transactionIds.length) {
            await client.query(`
                UPDATE "Ecosystem".transaction_detail
                SET status = $3::transactions_status
                WHERE company_id = $1 AND transaction_id = ANY($2::bigint[])
                  AND status = ANY($4::transactions_status[]);
            `, [companyId, transactionIds, to, from]);
        }
        return transactionIds;
    }

    async function changeStatus(action, client, input) {
        const companyId = id(input?.companyId, 'company_id');
        const userId = id(input?.userId, 'user_id');
        const docId = id(input?.docId, 'doc_id');
        await assertActor(client, companyId, userId);
        const document = await lockDocument(client, companyId, docId);
        await policy.authorize({ action, client, companyId, userId, document, payload: input.payload ?? {} });

        const target = DOCUMENT_STATUS[action];
        const previousStatus = document.status;
        if (previousStatus !== target) {
            await client.query(`
                UPDATE "Ecosystem".documents
                SET status = $3::comercial_state, updated_at = CURRENT_TIMESTAMP
                WHERE company_id = $1 AND id = $2;
            `, [companyId, docId, target]);
        }
        const transactionIds = await syncLedger(client, companyId, docId, LEDGER_SYNC[action]);
        return {
            status: 'OK', action, doc_id: docId, document_type: document.document_type,
            previous_status: previousStatus, current_status: target,
            changed: previousStatus !== target || transactionIds.length > 0,
            transactions_updated: transactionIds,
            ledgerChanged: transactionIds.length > 0
        };
    }

    // Edición limitada a campos descriptivos. Los importes y las líneas no se editan aquí.
    async function edit(client, input) {
        const companyId = id(input?.companyId, 'company_id');
        const userId = id(input?.userId, 'user_id');
        const docId = id(input?.docId, 'doc_id');
        const changes = input?.changes ?? {};
        const fields = [];
        const values = [companyId, docId];
        if (changes.description !== undefined) {
            if (changes.description !== null && typeof changes.description !== 'string') fail('description debe ser texto.');
            if ((changes.description ?? '').length > MAX_DESCRIPTION) fail(`description admite máximo ${MAX_DESCRIPTION} caracteres.`);
            values.push(changes.description ?? '');
            fields.push(`description = $${values.length}`);
        }
        if (changes.attached !== undefined) {
            if (!Array.isArray(changes.attached)) fail('attached debe ser un arreglo.');
            values.push(JSON.stringify(changes.attached));
            fields.push(`attached = $${values.length}`);
        }
        if (!fields.length) fail('No hay campos para actualizar (description, attached).');

        await assertActor(client, companyId, userId);
        const document = await lockDocument(client, companyId, docId);
        await policy.authorize({ action: 'edit', client, companyId, userId, document, payload: changes });

        const result = await client.query(`
            UPDATE "Ecosystem".documents
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE company_id = $1 AND id = $2
            RETURNING id, description, attached, status::text AS status;
        `, values);
        return { status: 'OK', action: 'edit', doc_id: docId, document: result.rows[0], ledgerChanged: false };
    }

    return {
        activate: (client, input) => changeStatus('activate', client, input),
        cancel: (client, input) => changeStatus('cancel', client, input),
        edit
    };
}

export const documentActionsService = createDocumentActionsService();
