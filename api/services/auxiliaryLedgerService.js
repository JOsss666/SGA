import { appendBusinessDateRange, companyTimeZoneSql } from './businessTimeZoneService.js';

export const MAX_LEDGER_ROWS = 20000;
export const canReadAuxiliaryLedger = (config) => {
    if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch { return false; }
    }
    const access = config?.access;
    return access?.suspended !== true && access?.modules?.management?.use === true
        && (access?.modules?.contability?.use === true || access?.modules?.treasury?.use === true);
};

const invalid = (message) => Object.assign(new Error(message), { statusCode: 400 });
const dateIsValid = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
};
export function validateLedgerFilters(body = {}) {
    if (!dateIsValid(body.start_date) || !dateIsValid(body.end_date) || body.start_date > body.end_date) {
        throw invalid('Selecciona un rango de fechas válido.');
    }
    const grouping = body.grouping ?? 'account';
    if (!['account', 'third_party'].includes(grouping)) throw invalid('Agrupación inválida.');
    if (body.include_zero !== undefined && typeof body.include_zero !== 'boolean') throw invalid('Filtro de saldo inválido.');
    const result = { start_date: body.start_date, end_date: body.end_date, grouping, include_zero: body.include_zero === true };
    for (const field of ['account_codes', 'third_party_ids', 'cost_center_ids', 'document_types']) {
        const entries = body[field] ?? [];
        if (!Array.isArray(entries) || entries.length > 200) throw invalid(`Filtro inválido: ${field}.`);
        result[field] = [...new Set(entries.map(value => {
            const text = String(value);
            const pattern = field === 'document_types' ? /^[\p{L}\p{N} _().-]{1,80}$/u : /^\d{1,20}$/;
            if (!pattern.test(text)) throw invalid(`Valor inválido: ${field}.`);
            return text;
        }))];
    }
    for (const field of ['account_from', 'account_to']) {
        const value = body[field] || '';
        if (typeof value !== 'string' || (value && !/^\d{1,20}$/.test(value))) throw invalid('Código de cuenta inválido.');
        result[field] = value;
    }
    if (result.account_from && result.account_to && result.account_from > result.account_to) throw invalid('El rango de cuentas está invertido.');
    return result;
}

// Una sola lectura MVCC: saldo anterior y movimientos comparten el mismo snapshot.
// Los valores real históricos se convierten antes de sumar; nunca se reescriben.
export function buildAuxiliaryLedgerQuery(companyId, filters) {
    const values = [companyId];
    const whereClauses = ["td.company_id = $1", "td.status = 'posted'"];
    const bind = value => { values.push(value); return `$${values.length}`; };
    if (filters.account_codes.length) whereClauses.push(`EXISTS (SELECT 1 FROM unnest(${bind(filters.account_codes)}::text[]) code WHERE a.code LIKE code || '%')`);
    if (filters.account_from) whereClauses.push(`a.code >= ${bind(filters.account_from)}`);
    if (filters.account_to) whereClauses.push(`a.code <= ${bind(filters.account_to)}`);
    if (filters.third_party_ids.length) whereClauses.push(`td."thirdParty_id" = ANY(${bind(filters.third_party_ids)}::bigint[])`);
    if (filters.cost_center_ids.length) whereClauses.push(`tr."costCenter_id" = ANY(${bind(filters.cost_center_ids)}::bigint[])`);
    if (filters.document_types.length) whereClauses.push(`tr.doc_type::text = ANY(${bind(filters.document_types)}::text[])`);
    appendBusinessDateRange({ whereClauses, values, column: 'td.created_at', end: filters.end_date });
    const zone = companyTimeZoneSql('$1');
    const start = `(${bind(filters.start_date)}::date::timestamp AT TIME ZONE (${zone}))`;
    const includeZero = bind(filters.include_zero);
    return { values, text: `
WITH source AS (
    SELECT td.id, td.account_id, td."thirdParty_id" AS third_party_id, td.transaction_id,
        td.created_at, td.nature::text AS nature, a.type::text AS account_nature,
        a.code AS account_code, a.name AS account_name,
        COALESCE(tp.names, 'Sin tercero') AS third_party_name,
        COALESCE(tp.indentification_number, '') AS third_party_number,
        COALESCE(tp.address, '') AS third_party_address,
        (SELECT tax.dv FROM "Fiscal".v_third_party_current_tax_info tax
         WHERE tax.company_id = $1 AND tax."thirdParty_id" = tp.id LIMIT 1) AS third_party_dv,
        to_char(td.created_at AT TIME ZONE (${zone}), 'YYYY-MM-DD') AS business_date,
        to_char(td.created_at AT TIME ZONE (${zone}), 'YYYY-MM-DD HH24:MI:SS') AS created_at_local,
        ${zone} AS business_time_zone,
        COALESCE(tr.doc_date, d.created_at AT TIME ZONE (${zone}), td.created_at AT TIME ZONE (${zone})) AS document_date_sort,
        tr.doc_type::text AS document_type,
        COALESCE(d."ownSerial"::text, tr."ownSerial"::text, tr.id::text, '') AS document_serial,
        COALESCE(NULLIF(d.description, ''), c.name, '') AS concept,
        td.voucher,
        CASE WHEN td.nature = 'DB' THEN round(td.total::text::numeric, 5) ELSE 0 END AS debit,
        CASE WHEN td.nature = 'CR' THEN round(td.total::text::numeric, 5) ELSE 0 END AS credit,
        td.created_at < ${start} AS is_opening
    FROM "Ecosystem".transaction_detail td
    LEFT JOIN "Ecosystem".contable_accounts a ON a.id = td.account_id AND a.company_id IN (0, $1)
    LEFT JOIN "Ecosystem".thirdparties tp ON tp.id = td."thirdParty_id" AND tp.company_id = $1
    LEFT JOIN "Ecosystem".transactions tr ON tr.id = td.transaction_id AND tr.company_id = $1
    LEFT JOIN "Ecosystem".documents d ON d.id = tr.doc_id AND d.company_id = $1
    LEFT JOIN "Ecosystem".concepts c ON c.id = tr.concept_id AND c.company_id IN (0, $1)
    WHERE ${whereClauses.join(' AND ')}
), balances AS (
    SELECT account_id, third_party_id,
        min(account_code) AS account_code, min(account_name) AS account_name,
        min(account_nature) AS account_nature, min(third_party_name) AS third_party_name,
        min(third_party_number) AS third_party_number, min(third_party_dv) AS third_party_dv,
        min(third_party_address) AS third_party_address,
        COALESCE(sum(debit - credit) FILTER (WHERE is_opening), 0)
            * CASE WHEN min(account_nature) = 'CR' THEN -1 ELSE 1 END AS opening_balance,
        COALESCE(sum(debit) FILTER (WHERE NOT is_opening), 0) AS period_debit,
        COALESCE(sum(credit) FILTER (WHERE NOT is_opening), 0) AS period_credit,
        bool_or(account_nature IS NULL OR account_nature NOT IN ('DB', 'CR')
            OR nature IS NULL OR nature NOT IN ('DB', 'CR')) AS invalid_nature
    FROM source GROUP BY account_id, third_party_id
), selected AS (
    SELECT *, opening_balance + (period_debit - period_credit)
        * CASE WHEN account_nature = 'CR' THEN -1 ELSE 1 END AS closing_balance
    FROM balances
    -- “Incluir saldo en cero”: no excluir movimientos compensados cuando se activa.
    WHERE ${includeZero}::boolean OR invalid_nature OR opening_balance + (period_debit - period_credit)
        * CASE WHEN account_nature = 'CR' THEN -1 ELSE 1 END <> 0
), movements AS (
    SELECT s.*, b.opening_balance + sum(s.debit - s.credit) OVER (
        PARTITION BY s.account_id, s.third_party_id
        ORDER BY s.document_date_sort, s.created_at, s.transaction_id, s.id ROWS UNBOUNDED PRECEDING
    ) * CASE WHEN s.account_nature = 'CR' THEN -1 ELSE 1 END AS running_balance
    FROM source s JOIN selected b ON b.account_id IS NOT DISTINCT FROM s.account_id
        AND b.third_party_id IS NOT DISTINCT FROM s.third_party_id
    WHERE NOT s.is_opening
)
SELECT b.*, m.id AS movement_id, m.transaction_id, m.created_at,
    to_char(m.document_date_sort, 'YYYY-MM-DD') AS document_date,
    m.business_date, m.created_at_local, m.document_type, m.document_serial, m.concept, m.voucher,
    m.debit::text AS debit, m.credit::text AS credit, m.running_balance::text AS running_balance,
    b.opening_balance::text AS opening_balance, b.period_debit::text AS period_debit,
    b.period_credit::text AS period_credit, b.closing_balance::text AS closing_balance,
    ${zone} AS business_time_zone
FROM selected b LEFT JOIN movements m ON m.account_id IS NOT DISTINCT FROM b.account_id
    AND m.third_party_id IS NOT DISTINCT FROM b.third_party_id
ORDER BY b.account_code, b.account_id, b.third_party_number, b.third_party_id,
    m.document_date_sort, m.created_at, m.transaction_id, m.id
LIMIT ${MAX_LEDGER_ROWS + 1}` };
}

export const ledgerOptionsQuery = `SELECT
    (SELECT jsonb_agg(x ORDER BY x.code) FROM (SELECT id::text, code, name FROM "Ecosystem".contable_accounts WHERE company_id IN (0, $1)) x) AS accounts,
    (SELECT jsonb_agg(x ORDER BY x.names) FROM (SELECT id::text, names, indentification_number AS number FROM "Ecosystem".thirdparties WHERE company_id = $1) x) AS third_parties,
    (SELECT jsonb_agg(x ORDER BY x.code) FROM (SELECT id::text, code, name FROM "Ecosystem"."costCenters" WHERE company_id = $1) x) AS cost_centers,
    (SELECT jsonb_agg(x.document_type ORDER BY x.document_type) FROM (SELECT DISTINCT doc_type::text AS document_type FROM "Ecosystem".transactions WHERE company_id = $1 AND doc_type IS NOT NULL) x) AS document_types,
    ${companyTimeZoneSql('$1')} AS business_time_zone`;
