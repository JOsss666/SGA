import { withTransaction, queryDataBase } from '../app.js';
import { createAccountingAdjustment, validateAccountingAdjustment } from '../services/accountingAdjustmentService.js';

// Compañía/usuario resueltos desde la solicitud (header X-SGA-Company-Id o body),
// sin cookie de sesión. La validación de pertenencia (usuario miembro activo de la
// compañía y con acceso a la tienda) la sigue haciendo el servicio.
const resolveCompanyId = (req) => {
    const raw = req.get('X-SGA-Company-Id') ?? req.body?.company_id;
    const companyId = Number(raw);
    return Number.isSafeInteger(companyId) && companyId > 0 ? companyId : null;
};
const resolveUserId = (req) => {
    const raw = req.body?.user_id ?? req.get('X-SGA-User-Id');
    const userId = Number(raw);
    return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
};
const missingCompany = res => res.status(400).json({ message: 'Se requiere una compañía válida (company_id).' });
const missingUser = res => res.status(400).json({ message: 'Se requiere un usuario válido (user_id).' });

export const createAdjustment = async (req, res, next) => {
    try {
        const companyId = resolveCompanyId(req);
        if (!companyId) return missingCompany(res);
        const userId = resolveUserId(req);
        if (!userId) return missingUser(res);
        const voucher = validateAccountingAdjustment(req.body);
        const result = await withTransaction(client => createAccountingAdjustment({ client, companyId, userId, voucher }));
        let balancesRefreshPending = false;
        try {
            await queryDataBase('REFRESH MATERIALIZED VIEW CONCURRENTLY "Ecosystem".mv_thirdparty_account_balances');
        } catch {
            // El asiento ya quedó confirmado. La próxima actualización de vistas
            // pondrá al día el saldo materializado sin revertir el registro contable.
            balancesRefreshPending = true;
        }
        return res.status(201).json({ ...result, balancesRefreshPending });
    } catch (error) {
        if (error.statusCode === 400) return res.status(400).json({ message: error.message });
        next(error);
    }
};

export const listTemplates = async (req, res, next) => {
    try {
        const companyId = resolveCompanyId(req);
        if (!companyId) return missingCompany(res);
        const result = await queryDataBase(`SELECT id, name, lines, description, created_at, updated_at
            FROM "Ecosystem".accounting_adjustment_templates WHERE company_id = $1 ORDER BY name`, [companyId]);
        res.json({ templates: result.rows });
    } catch (error) { next(error); }
};

export const saveTemplate = async (req, res, next) => {
    try {
        const companyId = resolveCompanyId(req);
        if (!companyId) return missingCompany(res);
        const userId = resolveUserId(req);
        if (!userId) return missingUser(res);
        const voucher = validateAccountingAdjustment(
            { ...req.body, doc_date: '2000-01-01' },
            { requireHeaderCostCenter: false, requireConcept: false },
        );
        const name = String(req.body.name ?? '').trim();
        if (!name || name.length > 120) return res.status(400).json({ message: 'El nombre de la plantilla es obligatorio y máximo de 120 caracteres.' });
        const result = await queryDataBase(`INSERT INTO "Ecosystem".accounting_adjustment_templates
            (company_id, name, lines, description, created_by) VALUES ($1, $2, $3::jsonb, $4, $5)
            ON CONFLICT (company_id, name) DO UPDATE SET lines = EXCLUDED.lines, description = EXCLUDED.description, updated_at = now()
            RETURNING id, name, lines, description, created_at, updated_at`, [companyId, name, JSON.stringify(voucher.lines), voucher.description, userId]);
        res.status(201).json({ template: result.rows[0] });
    } catch (error) {
        if (error.statusCode === 400) return res.status(400).json({ message: error.message });
        next(error);
    }
};

export const deleteTemplate = async (req, res, next) => {
    try {
        const companyId = resolveCompanyId(req);
        if (!companyId) return missingCompany(res);
        const templateId = Number(req.params.id);
        if (!Number.isSafeInteger(templateId) || templateId <= 0) return res.status(400).json({ message: 'Plantilla inválida.' });
        const result = await queryDataBase(`DELETE FROM "Ecosystem".accounting_adjustment_templates
            WHERE id = $1 AND company_id = $2 RETURNING id`, [templateId, companyId]);
        if (!result.rowCount) return res.status(404).json({ message: 'Plantilla no encontrada.' });
        res.status(204).end();
    } catch (error) { next(error); }
};
