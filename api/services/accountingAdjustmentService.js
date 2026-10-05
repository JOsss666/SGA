const badRequest = message => Object.assign(new Error(message), { statusCode: 400 });

const money = value => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw badRequest('Los valores de débito y crédito deben ser números positivos.');
    return Math.round((parsed + Number.EPSILON) * 100) / 100;
};

const id = (value, label) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) throw badRequest(`${label} inválido.`);
    return parsed;
};

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

export function validateAccountingAdjustment(body = {}) {
    if (!validDate(body.doc_date)) throw badRequest('Selecciona una fecha de comprobante válida.');
    if (typeof body.description !== 'string' || body.description.length > 1000) {
        throw badRequest('La observación general debe tener máximo 1.000 caracteres.');
    }
    if (!Array.isArray(body.lines) || body.lines.length < 2 || body.lines.length > 500) {
        throw badRequest('El comprobante debe tener entre dos y 500 líneas.');
    }

    let debit = 0;
    let credit = 0;
    const lines = body.lines.map((line, index) => {
        const lineDebit = money(line.debit ?? 0);
        const lineCredit = money(line.credit ?? 0);
        if ((lineDebit === 0 && lineCredit === 0) || (lineDebit > 0 && lineCredit > 0)) {
            throw badRequest(`La línea ${index + 1} debe tener débito o crédito, pero no ambos.`);
        }
        const description = String(line.description ?? '').trim();
        if (description.length > 500) throw badRequest(`La descripción de la línea ${index + 1} supera 500 caracteres.`);
        debit += lineDebit;
        credit += lineCredit;
        return {
            account_id: id(line.account_id, `Cuenta de la línea ${index + 1}`),
            thirdParty_id: line.thirdParty_id == null || line.thirdParty_id === '' ? null : id(line.thirdParty_id, `Tercero de la línea ${index + 1}`),
            description,
            debit: lineDebit,
            credit: lineCredit
        };
    });
    debit = Math.round(debit * 100) / 100;
    credit = Math.round(credit * 100) / 100;
    if (debit !== credit) throw badRequest(`La partida doble no cuadra. Diferencia: ${(debit - credit).toFixed(2)}.`);

    return {
        doc_date: body.doc_date,
        description: body.description.trim(),
        attached: Array.isArray(body.attached) ? body.attached : [],
        lines,
        debit,
        credit
    };
}

export async function createAccountingAdjustment({ client, companyId, userId, voucher }) {
    const accountIds = [...new Set(voucher.lines.map(line => line.account_id))];
    const accounts = await client.query(`SELECT account.id FROM "Ecosystem".contable_accounts account
        WHERE account.company_id IN (0, $1) AND account.id = ANY($2::bigint[])
        AND NOT EXISTS (
            SELECT 1 FROM "Ecosystem".contable_accounts child
            WHERE child.company_id IN (0, $1)
            AND length(child.code) > length(account.code)
            AND child.code LIKE account.code || '%'
        )`, [companyId, accountIds]);
    if (accounts.rows.length !== accountIds.length) throw badRequest('Una o más cuentas no pertenecen al plan de cuentas de la compañía.');

    const thirdPartyIds = [...new Set(voucher.lines.map(line => line.thirdParty_id).filter(Boolean))];
    if (thirdPartyIds.length) {
        const thirdParties = await client.query(`SELECT id FROM "Ecosystem".thirdparties
            WHERE company_id = $1 AND id = ANY($2::bigint[])`, [companyId, thirdPartyIds]);
        if (thirdParties.rows.length !== thirdPartyIds.length) throw badRequest('Uno o más terceros no pertenecen a la compañía.');
    }
    const companySettings = await client.query(`SELECT COALESCE(time_zone, 'UTC') AS time_zone
        FROM "Ecosystem".company_settings WHERE company_id = $1`, [companyId]);
    const businessTimeZone = companySettings.rows[0]?.time_zone || 'UTC';

    const document = await client.query(`INSERT INTO "Ecosystem".documents
        (company_id, document_type, status, "subTotal", total, created_by, description, attached)
        VALUES ($1, 'Accounting Adjustment', 'active', $2, $2, $3, $4, $5::jsonb)
        RETURNING id, "ownSerial"`, [companyId, voucher.debit, userId, voucher.description, JSON.stringify(voucher.attached)]);
    const documentRow = document.rows[0];
    const transaction = await client.query(`INSERT INTO "Ecosystem".transactions
        (user_id, company_id, doc_date, doc_type, doc_id, "subTotal", total)
        VALUES ($1, $2, $3::date, 'Accounting Adjustment', $4, $5, $5) RETURNING id`,
    [userId, companyId, voucher.doc_date, documentRow.id, voucher.debit]);
    const transactionId = transaction.rows[0].id;

    for (const line of voucher.lines) {
        const total = line.debit || line.credit;
        await client.query(`INSERT INTO "Ecosystem".transaction_detail
            (company_id, transaction_id, "thirdParty_id", account_id, type, "subTotal", total, nature, voucher, status, created_at)
            VALUES ($1, $2, $3, $4, 'accountingAdjustment', $5, $5, $6, $7, 'posted', ($8::date::timestamp AT TIME ZONE $9))`,
        [companyId, transactionId, line.thirdParty_id, line.account_id, total, line.debit > 0 ? 'DB' : 'CR', line.description, voucher.doc_date, businessTimeZone]);
    }
    return { document_id: documentRow.id, transaction_id: transactionId, ownSerial: documentRow.ownSerial };
}
