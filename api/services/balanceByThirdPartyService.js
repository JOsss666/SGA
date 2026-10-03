import { companyTimeZoneSql } from './businessTimeZoneService.js';

const invalid = message => Object.assign(new Error(message), { statusCode: 400 });
const validDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
};

export function validateBalanceByThirdPartyFilters(info = {}) {
    if (!validDate(info.start_date) || !validDate(info.end_date) || info.start_date > info.end_date) {
        throw invalid('Selecciona un rango de fechas válido.');
    }
    if (info.third_party_ids !== undefined && (!Array.isArray(info.third_party_ids) || info.third_party_ids.length > 200)) {
        throw invalid('El filtro de terceros es inválido.');
    }
    const thirdPartyIds = [...new Set((info.third_party_ids ?? []).map(value => String(value)))];
    if (thirdPartyIds.some(value => !/^\d{1,20}$/.test(value))) throw invalid('El filtro de terceros es inválido.');
    return { thirdPartyIds, includeZero: info.allAccounts === true };
}

// Las filas de cuenta conservan la jerarquía materializada actual. Las filas de
// tercero se agregan solamente contra la cuenta realmente usada por el movimiento.
export function buildBalanceByThirdPartyQuery(companyId, info) {
    const dates = {
        ...info,
        start_date: info.start_date || '1900-01-01',
        end_date: info.end_date || new Date().toISOString().slice(0, 10)
    };
    const filters = validateBalanceByThirdPartyFilters(dates);
    const values = [companyId, dates.start_date, dates.end_date, filters.includeZero];
    const bind = value => { values.push(value); return `$${values.length}`; };
    const thirdPartyFilter = filters.thirdPartyIds.length
        ? `AND t."thirdParty_id" = ANY(${bind(filters.thirdPartyIds)}::bigint[])`
        : '';
    const zone = companyTimeZoneSql('$1');
    const periodStart = `($2::date::timestamp AT TIME ZONE (${zone}))`;
    const periodEnd = `((($3::date + 1)::timestamp) AT TIME ZONE (${zone}))`;

    return { values, text: `
WITH movements_by_account AS (
    SELECT t.account_id, t."thirdParty_id" AS third_party_id,
        COALESCE(SUM(CASE WHEN t.created_at < ${periodStart}
            THEN CASE WHEN t.nature = 'DB' THEN t.total WHEN t.nature = 'CR' THEN -t.total ELSE 0 END
            ELSE 0 END), 0) AS opening_balance,
        COALESCE(SUM(CASE WHEN t.created_at >= ${periodStart} AND t.created_at < ${periodEnd}
            AND t.nature = 'DB' THEN t.total ELSE 0 END), 0) AS total_debit,
        COALESCE(SUM(CASE WHEN t.created_at >= ${periodStart} AND t.created_at < ${periodEnd}
            AND t.nature = 'CR' THEN t.total ELSE 0 END), 0) AS total_credit
    FROM "Ecosystem".transaction_detail t
    WHERE t.company_id = $1 AND t.status = 'posted' ${thirdPartyFilter}
    GROUP BY t.account_id, t."thirdParty_id"
), account_rows AS (
    SELECT p.id, p.code AS account_code, p.name AS concept_name, p.level,
        COALESCE(SUM(m.opening_balance), 0) AS opening_balance,
        COALESCE(SUM(m.total_debit), 0) AS total_debit,
        COALESCE(SUM(m.total_credit), 0) AS total_credit,
        COALESCE(CASE WHEN p.type = 'DB' THEN SUM(m.opening_balance + m.total_debit - m.total_credit)
            WHEN p.type = 'CR' THEN SUM(m.opening_balance + m.total_credit - m.total_debit) ELSE 0 END, 0) AS final_balance
    FROM "Ecosystem".contable_accounts p
    LEFT JOIN mv_account_hierarchy h ON h.parent_id = p.id
    LEFT JOIN movements_by_account m ON m.account_id = h.child_id
    WHERE p.company_id IN (0, $1)
    GROUP BY p.id, p.code, p.name, p.level, p.type
    HAVING $4::boolean OR COALESCE(SUM(m.opening_balance), 0) <> 0
        OR COALESCE(SUM(m.total_debit), 0) <> 0 OR COALESCE(SUM(m.total_credit), 0) <> 0
), third_party_rows AS (
    SELECT a.id, a.code AS account_code,
        COALESCE(NULLIF(tp.names, ''), 'Sin tercero asociado') AS concept_name,
        a.level, m.third_party_id, COALESCE(tp.indentification_number, '') AS identity,
        COALESCE(tax.dv::text, '') AS dv, m.opening_balance, m.total_debit, m.total_credit,
        CASE WHEN a.type = 'DB' THEN m.opening_balance + m.total_debit - m.total_credit
            WHEN a.type = 'CR' THEN m.opening_balance + m.total_credit - m.total_debit ELSE 0 END AS final_balance
    FROM movements_by_account m
    JOIN "Ecosystem".contable_accounts a ON a.id = m.account_id AND a.company_id IN (0, $1)
    LEFT JOIN "Ecosystem".thirdparties tp ON tp.id = m.third_party_id AND tp.company_id = $1
    LEFT JOIN "Fiscal".v_third_party_current_tax_info tax
        ON tax."thirdParty_id" = tp.id AND tax.company_id = $1
    WHERE $4::boolean OR m.opening_balance <> 0 OR m.total_debit <> 0 OR m.total_credit <> 0
)
SELECT id, account_code, concept_name, level, NULL::bigint AS third_party_id,
    ''::text AS identity, ''::text AS dv, opening_balance, total_debit, total_credit, final_balance,
    'account'::text AS row_type
FROM account_rows
UNION ALL
SELECT id, account_code, concept_name, level, third_party_id, identity, dv,
    opening_balance, total_debit, total_credit, final_balance, 'third_party'::text AS row_type
FROM third_party_rows
ORDER BY account_code, row_type, concept_name;` };
}
