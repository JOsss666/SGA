import { useDataBase } from '../../../app.js';
import sessionRepository from '../../../repositories/sessionRepository.js';
import { companyTimeZoneSql } from '../../../services/businessTimeZoneService.js';
import SystemAIError from '../../core/errors/SystemAIError.js';

/**
 * Construye, en el servidor, los payloads que hoy arma el frontend para la
 * factura de venta y el recibo de caja. El agente solo aporta datos de negocio
 * (tercero, ítems, medios de pago); cuentas, impuestos y plazos se resuelven
 * desde la BD de la compañía del token, y el cuadre contable se verifica antes
 * de llamar a los servicios existentes. Todas las lecturas son de solo lectura.
 */

const invalid = (message, code = 'INVALID_DOCUMENT_REQUEST', statusCode = 422) =>
    new SystemAIError(message, { statusCode, code });

const query = async (sql, params) => {
    const result = await useDataBase(sql, params, 1);
    return result[0] ? result[1] : [];
};

const REQUEST_ID = /^[a-zA-Z0-9-]{16,100}$/;
const MAX_LINES = 100;

// ---- Dinero en centavos enteros (evita errores de coma flotante) -----------
const toCents = (value, field, { allowZero = false } = {}) => {
    const text = typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : String(value ?? '').trim();
    if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) {
        throw invalid(`${field} debe ser un valor positivo con máximo dos decimales.`, 'INVALID_AMOUNT');
    }
    const [integer, fraction = ''] = text.split('.');
    const cents = Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
    if (cents === 0 && !allowZero) throw invalid(`${field} debe ser mayor que cero.`, 'INVALID_AMOUNT');
    return cents;
};
const fromCents = cents => (cents / 100).toFixed(2);

const requireId = (value, field) => {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw invalid(`${field} debe ser un entero positivo.`, 'INVALID_ID');
    return id;
};

const requireRequestId = (value) => {
    if (typeof value !== 'string' || !REQUEST_ID.test(value)) {
        throw invalid('request_id es obligatorio: 16 a 100 caracteres alfanuméricos o guiones (por ejemplo un UUID). Reutilízalo solo para reintentar la misma solicitud.', 'INVALID_REQUEST_ID', 400);
    }
    return value;
};

const cleanText = (value, field, max) => {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    if (text.length > max) throw invalid(`${field} no puede superar ${max} caracteres.`, 'INVALID_TEXT', 400);
    return text || undefined;
};

// ---- Actor y accesos del rol del usuario de servicio -----------------------
const parseConfig = (config) => {
    if (!config) return null;
    try { return typeof config === 'string' ? JSON.parse(config) : config; } catch { return null; }
};

const loadActor = async (companyId, userId) => {
    if (!Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) {
        throw invalid('La credencial MCP no tiene un usuario de servicio asignado; no puede crear documentos.', 'MCP_SERVICE_USER_REQUIRED', 403);
    }
    const membership = await sessionRepository.findMembership(Number(userId), companyId);
    if (!membership) {
        throw invalid('El usuario de servicio no pertenece a la compañía.', 'MCP_SERVICE_USER_FORBIDDEN', 403);
    }
    return { userId: Number(userId), roleConfig: parseConfig(membership.role_config) };
};

// El rol limita tiendas, centros de costo, negocios y cajas. overAll = sin límite.
const assertRoleAccess = (roleConfig, path, id, label) => {
    const rule = path.reduce((node, key) => node?.[key], roleConfig?.access);
    if (rule?.overAll === true) return;
    const enabled = Array.isArray(rule?.enabled) ? rule.enabled.map(String) : [];
    if (!enabled.includes(String(id))) {
        throw invalid(`El rol del usuario de servicio no tiene acceso a ${label} ${id}.`, 'ROLE_ACCESS_DENIED', 403);
    }
};

const loadCommon = async ({ companyId, args, actor }) => {
    const storeId = requireId(args.store_id, 'store_id');
    const costCenterId = requireId(args.cost_center_id, 'cost_center_id');
    const thirdPartyId = requireId(args.third_party_id, 'third_party_id');
    const businessId = args.business_id === undefined ? undefined : requireId(args.business_id, 'business_id');

    const [store] = await query(`SELECT id FROM "Ecosystem".stores WHERE company_id = $1 AND id = $2`, [companyId, storeId]);
    if (!store) throw invalid('La tienda no existe en la compañía.', 'STORE_NOT_FOUND');
    const [costCenter] = await query(`SELECT id FROM "Ecosystem"."costCenters" WHERE company_id = $1 AND id = $2`, [companyId, costCenterId]);
    if (!costCenter) throw invalid('El centro de costo no existe en la compañía.', 'COST_CENTER_NOT_FOUND');
    if (businessId !== undefined) {
        const [business] = await query(`SELECT id FROM "Ecosystem".bussines WHERE company_id = $1 AND id = $2`, [companyId, businessId]);
        if (!business) throw invalid('El negocio no existe en la compañía.', 'BUSINESS_NOT_FOUND');
    }
    const [thirdParty] = await query(`
        SELECT tp.id, COALESCE(ci.credit_term, 0) AS credit_term
        FROM "Ecosystem".thirdparties tp
        LEFT JOIN LATERAL (
            SELECT credit_term FROM "Ecosystem"."thirdPartyComercialInfo"
            WHERE "thirdParty_id" = tp.id AND company_id = tp.company_id LIMIT 1
        ) ci ON TRUE
        WHERE tp.company_id = $1 AND tp.id = $2
    `, [companyId, thirdPartyId]);
    if (!thirdParty) throw invalid('El tercero no existe en la compañía.', 'THIRD_PARTY_NOT_FOUND');

    assertRoleAccess(actor.roleConfig, ['stores'], storeId, 'la tienda');
    assertRoleAccess(actor.roleConfig, ['costCenters'], costCenterId, 'el centro de costo');
    if (businessId !== undefined) assertRoleAccess(actor.roleConfig, ['bussines'], businessId, 'el negocio');

    return { storeId, costCenterId, businessId, thirdPartyId, creditTerm: Number(thirdParty.credit_term) || 0 };
};

// ---- Medios de pago y caja -------------------------------------------------
const loadPayments = async ({ companyId, args, actor, totalCents, allowCredit }) => {
    const payments = args.payments;
    if (!Array.isArray(payments) || payments.length === 0 || payments.length > 10) {
        throw invalid('payments debe tener entre 1 y 10 medios de pago.', 'INVALID_PAYMENTS', 400);
    }
    const ids = [...new Set(payments.map((p, i) => requireId(p?.payment_method_id, `payments[${i}].payment_method_id`)))];
    const methods = await query(`
        SELECT id, account_id, for_wallet, for_balance
        FROM "Ecosystem".payment_methods
        WHERE company_id = $1 AND id = ANY($2::bigint[]) AND status = 'active'
    `, [companyId, ids]);
    const byId = new Map(methods.map(m => [String(m.id), m]));

    let sum = 0;
    let needsCashBox = false;
    const rows = payments.map((payment, index) => {
        const method = byId.get(String(payment.payment_method_id));
        if (!method) throw invalid(`payments[${index}]: medio de pago inexistente o inactivo.`, 'PAYMENT_METHOD_NOT_FOUND');
        if (method.for_balance) throw invalid('Los medios de saldo a favor no están disponibles por MCP.', 'PAYMENT_METHOD_NOT_ALLOWED');
        if (method.for_wallet && !allowCredit) throw invalid('Un recibo de caja no admite medios de crédito.', 'PAYMENT_METHOD_NOT_ALLOWED');
        if (!method.for_wallet) needsCashBox = true;
        const cents = toCents(payment.value, `payments[${index}].value`);
        sum += cents;
        return { method, cents, voucher: cleanText(payment.voucher, `payments[${index}].voucher`, 100) };
    });
    if (sum !== totalCents) {
        throw invalid(`La suma de los pagos (${fromCents(sum)}) debe ser igual al total del documento (${fromCents(totalCents)}).`, 'PAYMENTS_TOTAL_MISMATCH');
    }

    let cashBoxId;
    let shiftId;
    if (needsCashBox) {
        cashBoxId = requireId(args.cash_box_id, 'cash_box_id');
        shiftId = requireId(args.shift_id, 'shift_id');
        const [shift] = await query(`
            SELECT s.id FROM "Facturation".register_shifts s
            JOIN "Treasury".cash_boxes b ON b.id = s."cashBox_id" AND b.company_id = s.company_id
            WHERE s.company_id = $1 AND s.id = $2 AND s."cashBox_id" = $3 AND s.status = 'open'
        `, [companyId, shiftId, cashBoxId]);
        if (!shift) throw invalid('El turno no existe, no está abierto o no pertenece a la caja indicada.', 'SHIFT_NOT_AVAILABLE');
        assertRoleAccess(actor.roleConfig, ['sections', 'cashBoxes'], cashBoxId, 'la caja');
    }
    return { rows, cashBoxId, shiftId };
};

const dueDateFor = async (companyId, days) => {
    const [row] = await query(`
        SELECT to_char((now() AT TIME ZONE (${companyTimeZoneSql('$1')}))::date + $2::int, 'YYYY-MM-DD') AS due
    `, [companyId, days]);
    return row.due;
};

// ---- Factura de venta ------------------------------------------------------
export const buildSellInvoiceInfo = async ({ args, context }) => {
    const companyId = Number(context.companyId);
    const requestId = requireRequestId(args.request_id);
    const actor = await loadActor(companyId, context.userId);
    const common = await loadCommon({ companyId, args, actor });
    const conceptId = requireId(args.concept_id, 'concept_id');
    const [concept] = await query(`
        SELECT id, for_balance FROM "Ecosystem".concepts WHERE id = $1 AND company_id = $2 AND status = 'active'
    `, [conceptId, companyId]);
    if (!concept || concept.for_balance) throw invalid('El concepto no existe, no está activo o es de saldo a favor.', 'CONCEPT_NOT_AVAILABLE');

    const items = args.items;
    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINES) {
        throw invalid(`items debe tener entre 1 y ${MAX_LINES} líneas.`, 'INVALID_ITEMS', 400);
    }
    const productIds = [...new Set(items.map((item, i) => requireId(item?.product_id, `items[${i}].product_id`)))];
    const products = await query(`
        SELECT ps.id, ps.type, t.id AS tax_id, COALESCE(t.rate, 0) AS tax_rate,
               t.account_id AS tax_account, c_exit.account_id AS exit_account
        FROM "Inventory"."products&services" ps
        LEFT JOIN "Ecosystem".taxes t ON t.id = ps.tax_id
        LEFT JOIN "Ecosystem".concepts c_exit ON c_exit.id = ps.exit_concept
        WHERE ps.company_id = $1 AND ps.id = ANY($2::bigint[]) AND ps.status = 'active'
    `, [companyId, productIds]);
    const productById = new Map(products.map(p => [String(p.id), p]));

    // unit_value INCLUYE impuestos (igual que el formulario). Cada línea:
    // base = bruto / (1 + tarifa); impuesto = bruto - base. Así Σ(base+impuesto) = Σ bruto.
    const details = [];
    const taxes = new Map();
    let totalCents = 0;
    let netCents = 0;
    items.forEach((item, index) => {
        const product = productById.get(String(item.product_id));
        if (!product) throw invalid(`items[${index}]: producto o servicio inexistente o inactivo.`, 'PRODUCT_NOT_FOUND');
        if (!product.exit_account) throw invalid(`items[${index}]: el producto no tiene cuenta contable de salida configurada.`, 'PRODUCT_WITHOUT_ACCOUNT');
        const units = Number(item.units);
        if (!Number.isFinite(units) || units <= 0 || units > 1_000_000) {
            throw invalid(`items[${index}].units debe estar entre 0 y 1000000.`, 'INVALID_UNITS', 400);
        }
        const unitCents = toCents(item.unit_value, `items[${index}].unit_value`);
        const grossCents = Math.round(units * unitCents);
        if (grossCents <= 0) throw invalid(`items[${index}]: el valor de la línea debe ser mayor que cero.`, 'INVALID_AMOUNT');
        const rate = Number(product.tax_rate);
        const baseCents = product.tax_id ? Math.round(grossCents / (1 + rate / 100)) : grossCents;
        const taxCents = grossCents - baseCents;

        details.push({
            account_id: product.exit_account,
            subtotal: fromCents(baseCents),
            total: fromCents(baseCents),
            type: product.type === 'service' ? 'serviceMovement' : 'inventoryMovement',
            nature: 'CR'
        });
        if (product.tax_id && taxCents > 0) {
            if (!product.tax_account) throw invalid(`items[${index}]: el impuesto no tiene cuenta contable.`, 'TAX_WITHOUT_ACCOUNT');
            const current = taxes.get(String(product.tax_id)) ?? { account: product.tax_account, cents: 0 };
            current.cents += taxCents;
            taxes.set(String(product.tax_id), current);
        }
        totalCents += grossCents;
        netCents += baseCents;
    });

    const payment = await loadPayments({ companyId, args, actor, totalCents, allowCredit: true });

    for (const tax of taxes.values()) {
        details.push({
            account_id: tax.account,
            subtotal: fromCents(tax.cents),
            total: fromCents(tax.cents),
            type: 'tax',
            nature: 'CR'
        });
    }
    let credit = 0;
    for (const { method, cents, voucher } of payment.rows) {
        const dueDate = await dueDateFor(companyId, method.for_wallet ? common.creditTerm : 0);
        details.push({
            account_id: method.account_id,
            subtotal: fromCents(cents),
            total: fromCents(cents),
            type: 'payment',
            paymentMethod_id: method.id,
            nature: 'DB',
            due_date: dueDate,
            for_wallet: method.for_wallet === true,
            for_balance: false,
            voucher,
            cashBox_id: method.for_wallet ? undefined : payment.cashBoxId,
            shift_id: method.for_wallet ? undefined : payment.shiftId
        });
        credit += cents;
    }

    // Verificación final del cuadre: DB (pagos) = CR (bases + impuestos).
    const crTotal = details.filter(d => d.nature === 'CR').reduce((s, d) => s + toCents(d.total, 'detalle'), 0);
    if (crTotal !== credit || credit !== totalCents) {
        throw invalid('Los asientos contables no cuadran; el documento no se creó.', 'LEDGER_NOT_BALANCED', 500);
    }

    return {
        info: {
            request_id: requestId,
            store_id: common.storeId,
            costCenter_id: common.costCenterId,
            bussines_id: common.businessId,
            concept_id: conceptId,
            company_id: companyId,
            created_by: actor.userId,
            user_id: actor.userId,
            thirdParty_id: common.thirdPartyId,
            description: cleanText(args.description, 'description', 1000),
            doc_type: 'Sell Invoice',
            status: 'active',
            subTotal: fromCents(netCents),
            total: fromCents(totalCents),
            attached: '-',
            instances: [],
            payedBills: [],
            cashBox_id: payment.cashBoxId,
            transactionDetails: details
        },
        summary: { subtotal: fromCents(netCents), total: fromCents(totalCents), lines: items.length }
    };
};

// ---- Recibo de caja --------------------------------------------------------
export const buildCashReceiptInfo = async ({ args, context }) => {
    const companyId = Number(context.companyId);
    const requestId = requireRequestId(args.request_id);
    const actor = await loadActor(companyId, context.userId);
    const common = await loadCommon({ companyId, args, actor });
    const conceptId = requireId(args.concept_id, 'concept_id');
    const [concept] = await query(`
        SELECT id, account_id, for_balance, for_wallet, "for_cashExit"
        FROM "Ecosystem".concepts WHERE id = $1 AND company_id = $2 AND status = 'active'
    `, [conceptId, companyId]);
    if (!concept || concept.for_balance || concept.for_cashExit) {
        throw invalid('El concepto no existe, no está activo o no corresponde a un recaudo.', 'CONCEPT_NOT_AVAILABLE');
    }
    if (!concept.account_id) throw invalid('El concepto no tiene cuenta contable.', 'CONCEPT_WITHOUT_ACCOUNT');

    const bills = args.bills;
    if (!Array.isArray(bills) || bills.length === 0 || bills.length > MAX_LINES) {
        throw invalid(`bills debe tener entre 1 y ${MAX_LINES} carteras a abonar.`, 'INVALID_BILLS', 400);
    }
    const billIds = bills.map((b, i) => requireId(b?.receivable_id, `bills[${i}].receivable_id`));
    if (new Set(billIds).size !== billIds.length) throw invalid('bills no puede repetir una cartera.', 'DUPLICATED_BILL', 400);
    const receivables = await query(`
        SELECT id, document_id, total, paid_amount
        FROM "Treasury".accounts_receivable
        WHERE company_id = $1 AND "thirdParty_id" = $2 AND id = ANY($3::bigint[])
    `, [companyId, common.thirdPartyId, billIds]);
    const receivableById = new Map(receivables.map(r => [String(r.id), r]));

    let totalCents = 0;
    const payedBills = bills.map((bill, index) => {
        const receivable = receivableById.get(String(bill.receivable_id));
        if (!receivable) throw invalid(`bills[${index}]: la cartera no existe para ese tercero.`, 'RECEIVABLE_NOT_FOUND');
        const cents = toCents(bill.paid_value, `bills[${index}].paid_value`);
        const pending = Math.round((Number(receivable.total) - Number(receivable.paid_amount)) * 100);
        if (cents > pending) {
            throw invalid(`bills[${index}]: el abono ${fromCents(cents)} supera el saldo pendiente ${fromCents(pending)}.`, 'PAYMENT_EXCEEDS_BALANCE');
        }
        totalCents += cents;
        return { id: receivable.id, document_id: receivable.document_id, paid_value: fromCents(cents) };
    });

    const payment = await loadPayments({ companyId, args, actor, totalCents, allowCredit: false });
    const details = [];
    for (const { method, cents, voucher } of payment.rows) {
        details.push({
            account_id: method.account_id,
            subtotal: fromCents(cents),
            total: fromCents(cents),
            type: 'payment',
            paymentMethod_id: method.id,
            nature: 'DB',
            due_date: await dueDateFor(companyId, 0),
            for_wallet: false,
            for_balance: false,
            voucher,
            cashBox_id: payment.cashBoxId,
            shift_id: payment.shiftId
        });
    }
    details.push({
        account_id: concept.account_id,
        subtotal: fromCents(totalCents),
        total: fromCents(totalCents),
        type: 'operation',
        nature: 'CR'
    });

    return {
        info: {
            request_id: requestId,
            store_id: common.storeId,
            costCenter_id: common.costCenterId,
            bussines_id: common.businessId,
            concept_id: conceptId,
            company_id: companyId,
            created_by: actor.userId,
            user_id: actor.userId,
            thirdParty_id: common.thirdPartyId,
            description: cleanText(args.description, 'description', 1000),
            doc_type: 'Cash Recipt',
            status: 'active',
            subTotal: fromCents(totalCents),
            total: fromCents(totalCents),
            attached: '-',
            instances: [],
            payedBills,
            cashBox_id: payment.cashBoxId,
            transactionDetails: details
        },
        summary: { total: fromCents(totalCents), bills: payedBills.length }
    };
};
