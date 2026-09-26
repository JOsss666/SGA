import { createHash } from 'node:crypto';
import { companyTimeZoneSql } from './businessTimeZoneService.js';

const fail = message => { const error = new Error(message); error.statusCode = 422; throw error; };
// Exact arithmetic for numeric(18,6); never round away an excess application.
export const moneyUnits = value => {
    const text = typeof value === 'number' && Number.isFinite(value) ? value.toFixed(6) : String(value ?? '');
    if (!/^\d{1,12}(\.\d{1,6})?$/.test(text)) fail('Importe inválido: use un valor positivo con máximo seis decimales.');
    const [integer, fraction = ''] = text.split('.');
    return BigInt(integer) * 1000000n + BigInt(fraction.padEnd(6, '0'));
};
export const moneyText = units => `${units / 1000000n}.${String(units % 1000000n).padStart(6, '0')}`;
const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const scope = info => [info.company_id, info.thirdParty_id];

export async function prepareAdvanceDocument(client, info) {
    let concept;
    if (info.doc_type === 'Cash Recipt' && info.concept_id != null) {
        const result = await client.query(`SELECT id, account_id, for_balance, for_wallet, "for_cashExit"
            FROM "Ecosystem".concepts WHERE id = $1 AND company_id = $2 AND status = 'active'`,
        [info.concept_id, info.company_id]);
        concept = result.rows[0];
        if (!concept) fail('El concepto no está activo o no pertenece a la compañía.');
    }
    const paymentIds = (info.transactionDetails ?? []).filter(d => d.type === 'payment').map(d => d.paymentMethod_id).filter(id => id != null);
    const methods = paymentIds.length ? (await client.query(`SELECT id, account_id, for_balance, for_wallet, currency
        FROM "Ecosystem".payment_methods WHERE company_id = $1 AND id = ANY($2::bigint[]) AND status = 'active'`,
    [info.company_id, paymentIds])).rows : [];
    const details = (info.transactionDetails ?? []).map(detail => {
        if (detail.type !== 'payment') return { ...detail, for_balance: false };
        const method = methods.find(m => sameId(m.id, detail.paymentMethod_id));
        if (!method) fail('Seleccione un medio de pago activo de la compañía.');
        if (method.for_balance && method.for_wallet) fail('Un medio no puede ser de crédito y de saldo a favor simultáneamente.');
        return { ...detail, account_id: method.account_id, for_balance: method.for_balance === true,
            for_wallet: method.for_wallet === true, currency: method.currency };
    });
    const createsAdvance = concept?.for_balance === true;
    const usesAdvance = details.some(d => d.for_balance);
    const prepared = { ...info, transactionDetails: details, advanceConcept: concept, createsAdvance, usesAdvance };
    if (!createsAdvance && !usesAdvance) return prepared;
    if (!['Cash Recipt', 'Sell Invoice'].includes(info.doc_type)) fail('Este documento no admite anticipos de clientes.');
    const party = await client.query(`SELECT id FROM "Ecosystem".thirdparties WHERE company_id = $1 AND id = $2`, scope(info));
    if (!party.rows.length) fail('Seleccione un tercero de la compañía.');
    if (info.status === 'draft' || details.some(d => d.status === 'draft')) fail('Los anticipos solo se registran o aplican en documentos definitivos.');
    if (info.status != null && info.status !== 'active' && info.status !== 'posted') fail('El documento no está habilitado para aplicar anticipos.');
    const total = moneyUnits(info.total);
    if (total <= 0n) fail('El total debe ser mayor que cero.');
    let debit = 0n, credit = 0n, payments = 0n;
    for (const detail of details) {
        const value = moneyUnits(detail.total);
        if (detail.type === 'payment') {
            if (value <= 0n) fail('Los medios de pago deben tener un importe mayor que cero.');
            payments += value;
            if (detail.nature !== 'DB') fail('La aplicación de anticipos requiere un documento de ingreso.');
        }
        if (detail.nature === 'DB') debit += value;
        else if (detail.nature === 'CR') credit += value;
        else fail('Naturaleza contable inválida.');
    }
    if (debit !== credit || payments !== total) fail('Los pagos y la contabilización deben coincidir con el total del documento.');
    if (usesAdvance && !createsAdvance && info.doc_type === 'Cash Recipt') {
        const applied = (info.payedBills ?? []).reduce((sum, bill) => sum + moneyUnits(bill.paid_value || 0), 0n);
        if (!concept?.for_wallet || applied !== total) fail('Para aplicar saldo a cartera seleccione un concepto de cartera y distribuya el total entre sus documentos.');
    }
    if (createsAdvance) {
        if (concept.for_wallet || concept.for_cashExit) fail('El concepto de anticipo no puede ser de cartera o egreso.');
        if (usesAdvance || details.some(d => d.for_wallet)) fail('El anticipo debe recibirse con medios reales de recaudo, sin crédito ni saldo a favor.');
        if ((info.payedBills ?? []).some(b => Number(b.paid_value) > 0)) fail('Un recibo de anticipo no puede pagar cartera simultáneamente.');
        const operations = details.filter(d => d.type !== 'payment');
        if (operations.length !== 1 || operations[0].nature !== 'CR' || !sameId(operations[0].account_id, concept.account_id)
            || moneyUnits(operations[0].total) !== total) fail('La contrapartida debe ser la cuenta del concepto de anticipo.');
        const currencies = new Set(details.filter(d => d.type === 'payment').map(d => d.currency));
        if (currencies.size !== 1 || currencies.has(null) || currencies.has(undefined)) fail('Los medios del anticipo deben usar una misma moneda configurada.');
        prepared.advanceCurrency = [...currencies][0];
    }
    return prepared;
}

export async function getCustomerAdvances(client, info) {
    if (!info.company_id || !info.thirdParty_id) fail('Se requieren compañía y tercero.');
    const zone = companyTimeZoneSql('$1');
    const result = await client.query(`SELECT a.id, a.document_id, d."ownSerial", a.account_id, a.currency,
        a.total, COALESCE(p.used, 0) AS used_amount, a.total - COALESCE(p.used, 0) AS available_amount,
        a.created_at, to_char(a.created_at AT TIME ZONE (${zone}), 'YYYY-MM-DD HH24:MI:SS') AS created_at_local,
        to_char(a.created_at AT TIME ZONE (${zone}), 'YYYY-MM-DD') AS business_date, (${zone}) AS business_time_zone
        FROM "Treasury".customer_advances a
        JOIN "Ecosystem".documents d ON d.id = a.document_id AND d.company_id = a.company_id
        LEFT JOIN LATERAL (SELECT SUM(amount) AS used FROM "Treasury".advance_applications
            WHERE advance_id = a.id AND company_id = a.company_id AND "thirdParty_id" = a."thirdParty_id") p ON true
        WHERE a.company_id = $1 AND a."thirdParty_id" = $2
          AND d.status::text IN ('active', 'posted') AND a.total > COALESCE(p.used, 0)
        ORDER BY a.id`, scope(info));
    return { status: 'OK', advances: result.rows };
}

// Resumen de saldo a favor (anticipos) por tercero para toda la compañía.
// Solo lectura y aditivo: replica el cálculo de disponible de getCustomerAdvances
// (total - aplicado) pero agrupado por tercero, para alimentar la lista del
// "Informe Saldos a favor". No agrega por moneda: en compañías multimoneda el
// disponible mostrado combina monedas (el detalle por tercero sí las separa).
export async function getCompanyAdvances(client, info) {
    if (!info.company_id) fail('Se requiere compañía.');
    const result = await client.query(`SELECT a."thirdParty_id",
        t.names AS names,
        t.indentification_number AS identification_number,
        COUNT(*) AS advances_count,
        SUM(a.total) AS total_amount,
        SUM(COALESCE(p.used, 0)) AS used_amount,
        SUM(a.total - COALESCE(p.used, 0)) AS available_amount
        FROM "Treasury".customer_advances a
        JOIN "Ecosystem".documents d ON d.id = a.document_id AND d.company_id = a.company_id
        JOIN "Ecosystem".thirdparties t ON t.id = a."thirdParty_id" AND t.company_id = a.company_id
        LEFT JOIN LATERAL (SELECT SUM(amount) AS used FROM "Treasury".advance_applications
            WHERE advance_id = a.id AND company_id = a.company_id AND "thirdParty_id" = a."thirdParty_id") p ON true
        WHERE a.company_id = $1
          AND d.status::text IN ('active', 'posted') AND a.total > COALESCE(p.used, 0)
        GROUP BY a."thirdParty_id", t.names, t.indentification_number
        HAVING SUM(a.total - COALESCE(p.used, 0)) > 0
        ORDER BY t.names ASC`, [info.company_id]);
    return { status: 'OK', summary: result.rows };
}

export async function applyCustomerAdvances(client, info, transactionId, savedDetails) {
    if (info.createsAdvance) {
        const result = await client.query(`INSERT INTO "Treasury".customer_advances
            (company_id, "thirdParty_id", document_id, transaction_id, concept_id, account_id, currency, total)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [...scope(info), info.doc_id, transactionId, info.advanceConcept.id, info.advanceConcept.account_id, info.advanceCurrency, info.total]);
        return { status: 'OK', advance_id: result.rows[0].id };
    }
    if (!info.usesAdvance) return { status: 'skipped' };
    // Lock all advances in a stable order before reading applications. A second
    // payment sees the committed remainder after waiting for the first payment.
    const locked = await client.query(`SELECT a.id, a.account_id, a.currency, a.total
        FROM "Treasury".customer_advances a
        JOIN "Ecosystem".documents d ON d.id = a.document_id AND d.company_id = a.company_id
        WHERE a.company_id = $1 AND a."thirdParty_id" = $2 AND d.status::text IN ('active','posted')
        ORDER BY a.id FOR UPDATE OF a`, scope(info));
    const applications = [];
    for (const [index, detail] of info.transactionDetails.entries()) {
        if (!detail.for_balance) continue;
        let remaining = moneyUnits(detail.total);
        for (const advance of locked.rows) {
            if (!sameId(advance.account_id, detail.account_id) || advance.currency !== detail.currency) continue;
            const used = await client.query(`SELECT COALESCE(SUM(amount),0) AS amount FROM "Treasury".advance_applications
                WHERE company_id = $1 AND "thirdParty_id" = $2 AND advance_id = $3`, [...scope(info), advance.id]);
            const available = moneyUnits(advance.total) - moneyUnits(used.rows[0].amount);
            if (available <= 0n) continue;
            const amount = remaining < available ? remaining : available;
            const result = await client.query(`INSERT INTO "Treasury".advance_applications
                (company_id, "thirdParty_id", advance_id, document_id, transaction_detail_id, amount)
                VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [...scope(info), advance.id, info.doc_id, savedDetails[index].id, moneyText(amount)]);
            applications.push({ id: result.rows[0].id, advance_id: advance.id, amount: moneyText(amount) });
            remaining -= amount;
            if (remaining === 0n) break;
        }
        if (remaining > 0n) fail('Saldo a favor insuficiente para la cuenta y moneda del medio de pago. Actualice el disponible.');
    }
    return { status: 'OK', applications };
}


const requestHash = info => createHash('sha256').update(JSON.stringify(info)).digest('hex');
export async function findDocumentRetry(client, info) {
    if (!/^[a-zA-Z0-9-]{16,100}$/.test(info.request_id)) fail('Identificador de solicitud inválido.');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`document:${info.company_id}:${info.doc_type}:${info.request_id}`]);
    const result = await client.query(`SELECT id, "ownSerial", treasury_request_hash
        FROM "Ecosystem".documents WHERE company_id = $1 AND document_type = $2 AND treasury_request_key = $3`,
    [info.company_id, info.doc_type, info.request_id]);
    if (!result.rows.length) return null;
    if (result.rows[0].treasury_request_hash !== requestHash(info)) fail('Esta solicitud ya se registró con otro contenido. Abra un nuevo formulario.');
    return { ...result.rows[0], replayed: true };
}
export async function saveDocumentRequest(client, info, documentId) {
    if (!info.request_id) return;
    await client.query(`UPDATE "Ecosystem".documents SET treasury_request_key = $1, treasury_request_hash = $2
        WHERE id = $3 AND company_id = $4`, [info.request_id, requestHash(info), documentId, info.company_id]);
}
