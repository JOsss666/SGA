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

export function validateAccountingAdjustment(body = {}, { requireHeaderCostCenter = true, requireConcept = true } = {}) {
    if (!validDate(body.doc_date)) throw badRequest('Selecciona una fecha de comprobante válida.');
    if (typeof body.description !== 'string' || body.description.length > 1000) {
        throw badRequest('La observación general debe tener máximo 1.000 caracteres.');
    }
    if (!Array.isArray(body.lines) || body.lines.length > 500) {
        throw badRequest('El comprobante no puede superar 500 líneas.');
    }

    // El formulario mantiene filas vacías para permitir agregar asientos; solo normalizamos las diligenciadas.
    const submittedLines = body.lines.filter(line => (
        ['account_id', 'thirdParty_id', 'costCenter_id', 'description', 'debit', 'credit']
            .some(field => line?.[field] !== undefined && line[field] !== null && String(line[field]).trim() !== '')
    ));
    if (submittedLines.length < 2) throw badRequest('El comprobante debe tener al menos dos líneas diligenciadas.');

    let debit = 0;
    let credit = 0;
    const lines = submittedLines.map((line, index) => {
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
            costCenter_id: line.costCenter_id == null || line.costCenter_id === '' ? null : id(line.costCenter_id, `Centro de costo de la línea ${index + 1}`),
            description,
            debit: lineDebit,
            credit: lineCredit
        };
    });
    debit = Math.round(debit * 100) / 100;
    credit = Math.round(credit * 100) / 100;
    if (debit !== credit) throw badRequest(`La partida doble no cuadra. Diferencia: ${(debit - credit).toFixed(2)}.`);

    const headerCostCenterId = lines.find(line => line.costCenter_id != null)?.costCenter_id ?? null;
    if (requireHeaderCostCenter && headerCostCenterId == null) {
        throw badRequest('Asigna un centro de costo al menos a una línea del comprobante.');
    }

    return {
        store_id: id(body.store_id, 'Tienda'),
        bussines_id: id(body.bussines_id, 'Negocio'),
        concept_id: requireConcept ? id(body.concept_id, 'Concepto') : null,
        costCenter_id: headerCostCenterId,
        doc_date: body.doc_date,
        description: body.description.trim(),
        attached: Array.isArray(body.attached) ? body.attached : [],
        lines,
        debit,
        credit
    };
}

export async function createAccountingAdjustment({ client, companyId, userId, voucher }) {
    const storeResult = await client.query(`SELECT s.id, r.config AS role_config
        FROM "Ecosystem".stores s
        JOIN "Ecosystem".user_company_memberships membership
          ON membership.company_id = s.company_id
         AND membership.user_id = $1
         AND membership.status = 'active'
        LEFT JOIN "Ecosystem".roles r ON r.id = membership.role_id
        WHERE s.company_id = $2 AND s.id = $3`, [userId, companyId, voucher.store_id]);
    if (storeResult.rowCount !== 1) {
        throw Object.assign(new Error('La tienda seleccionada no pertenece a la compañía activa.'), { statusCode: 403 });
    }

    let roleConfig = storeResult.rows[0].role_config;
    if (typeof roleConfig === 'string') {
        try {
            roleConfig = JSON.parse(roleConfig);
        } catch {
            roleConfig = null;
        }
    }
    const storeAccess = roleConfig?.access?.stores;
    if (storeAccess && storeAccess.overAll !== true) {
        const allowedStores = Array.isArray(storeAccess.enabled) ? storeAccess.enabled.map(String) : [];
        if (!allowedStores.includes(String(voucher.store_id))) {
            throw Object.assign(new Error('No tienes acceso a la tienda seleccionada.'), { statusCode: 403 });
        }
    }

    const costCenterIds = [...new Set(voucher.lines.map(line => line.costCenter_id).filter(id => id != null))];
    if (costCenterIds.length) {
        const costCenters = await client.query(`SELECT id FROM "Ecosystem"."costCenters"
            WHERE company_id = $1 AND id = ANY($2::bigint[])`, [companyId, costCenterIds]);
        if (costCenters.rows.length !== costCenterIds.length) {
            throw badRequest('Uno o más centros de costo no pertenecen a la compañía.');
        }

        const costCenterAccess = roleConfig?.access?.costCenters;
        if (costCenterAccess && costCenterAccess.overAll !== true) {
            const allowedCostCenters = Array.isArray(costCenterAccess.enabled) ? costCenterAccess.enabled.map(String) : [];
            if (costCenterIds.some(costCenterId => !allowedCostCenters.includes(String(costCenterId)))) {
                throw Object.assign(new Error('No tienes acceso a uno o más centros de costo seleccionados.'), { statusCode: 403 });
            }
        }
    }

    const businessResult = await client.query(`SELECT id FROM "Ecosystem".bussines
        WHERE company_id = $1 AND id = $2`, [companyId, voucher.bussines_id]);
    if (businessResult.rowCount !== 1) {
        throw Object.assign(new Error('El negocio seleccionado no pertenece a la compañía activa.'), { statusCode: 403 });
    }

    const businessAccess = roleConfig?.access?.bussines;
    if (businessAccess && businessAccess.overAll !== true) {
        const allowedBusinesses = Array.isArray(businessAccess.enabled) ? businessAccess.enabled.map(String) : [];
        if (!allowedBusinesses.includes(String(voucher.bussines_id))) {
            throw Object.assign(new Error('No tienes acceso al negocio seleccionado.'), { statusCode: 403 });
        }
    }

    const conceptResult = await client.query(`SELECT id FROM "Ecosystem".concepts
        WHERE company_id = $1 AND id = $2`, [companyId, voucher.concept_id]);
    if (conceptResult.rowCount !== 1) {
        throw badRequest('El concepto seleccionado no pertenece a la compañía activa.');
    }

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
        (company_id, store_id, document_type, status, "subTotal", total, created_by, description, attached)
        VALUES ($1, $2, 'Accounting Adjustment', 'active', $3, $3, $4, $5, $6::jsonb)
        RETURNING id, "ownSerial"`, [companyId, voucher.store_id, voucher.debit, userId, voucher.description, JSON.stringify(voucher.attached)]);
    const documentRow = document.rows[0];
    // La columna "thirdParty_id" del encabezado es NOT NULL con FK a thirdparties (y default 1,
    // que no existe en toda compañía). El tercero a nivel de transacción no es relevante para el
    // ajuste —lo relevante es el de cada transaction_detail—, así que reutilizamos el primer tercero
    // diligenciado en las líneas (ya validado contra la compañía) para satisfacer la restricción.
    // Si ninguna línea trae tercero, se omite la columna y se conserva el comportamiento anterior.
    const headerThirdPartyId = voucher.lines.find(line => line.thirdParty_id != null)?.thirdParty_id ?? null;
    // La columna heredada del encabezado (costCenter_id) es obligatoria; cada detalle conserva su propio centro.
    const transaction = headerThirdPartyId != null
        ? await client.query(`INSERT INTO "Ecosystem".transactions
            (user_id, company_id, store_id, "costCenter_id", bussines_id, concept_id, "thirdParty_id", doc_date, doc_type, doc_id, "subTotal", total)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, 'Accounting Adjustment', $9, $10, $10) RETURNING id`,
        [userId, companyId, voucher.store_id, voucher.costCenter_id, voucher.bussines_id, voucher.concept_id, headerThirdPartyId, voucher.doc_date, documentRow.id, voucher.debit])
        : await client.query(`INSERT INTO "Ecosystem".transactions
            (user_id, company_id, store_id, "costCenter_id", bussines_id, concept_id, doc_date, doc_type, doc_id, "subTotal", total)
            VALUES ($1, $2, $3, $4, $5, $6, $7::date, 'Accounting Adjustment', $8, $9, $9) RETURNING id`,
        [userId, companyId, voucher.store_id, voucher.costCenter_id, voucher.bussines_id, voucher.concept_id, voucher.doc_date, documentRow.id, voucher.debit]);
    const transactionId = transaction.rows[0].id;

    for (const line of voucher.lines) {
        const total = line.debit || line.credit;
        await client.query(`INSERT INTO "Ecosystem".transaction_detail
            (company_id, transaction_id, "thirdParty_id", account_id, "costCenter_id", type, "subTotal", total, nature, voucher, status, created_at)
            VALUES ($1, $2, $3, $4, $5, 'accountingAdjustment', $6, $6, $7, $8, 'posted', ($9::date::timestamp AT TIME ZONE $10))`,
        [companyId, transactionId, line.thirdParty_id, line.account_id, line.costCenter_id, total, line.debit > 0 ? 'DB' : 'CR', line.description, voucher.doc_date, businessTimeZone]);
    }
    return { document_id: documentRow.id, transaction_id: transactionId, ownSerial: documentRow.ownSerial };
}
