import { buildAuxiliaryLedgerQuery, canReadAuxiliaryLedger, ledgerOptionsQuery, MAX_LEDGER_ROWS, validateLedgerFilters } from '../services/auxiliaryLedgerService.js';

export const createAuxiliaryLedgerHandler = ({ query }) => async (req, res, next) => {
    try {
        const companyId = req.auth?.companyId;
        if (!req.auth?.userId || !companyId) return res.status(401).json({ message: 'Se requiere una sesión y compañía activa.' });
        if (req.body?.company_id != null && String(req.body.company_id) !== String(companyId)) {
            return res.status(403).json({ message: 'La compañía no coincide con la sesión.' });
        }
        // Mismos roles y membresías que el control de compañía existente; nunca un permiso enviado por el cliente.
        const membership = await query(`SELECT r.config, c.legal_name, c.identification_number
            FROM "Ecosystem".user_company_memberships m
            JOIN "Ecosystem".roles r ON r.id = m.role_id
            JOIN "Ecosystem".companies c ON c.company_id = m.company_id
            WHERE m.user_id = $1 AND m.company_id = $2 AND m.status = 'active'`, [req.auth.userId, companyId]);
        const company = membership.rows[0];
        if (!canReadAuxiliaryLedger(company?.config)) return res.status(403).json({ message: 'Requiere acceso a Administración y Contabilidad o Tesorería.' });
        if (req.body?.action === 'options') {
            const result = await query(ledgerOptionsQuery, [companyId]);
            return res.json({ ...result.rows[0], company: { name: company.legal_name, number: company.identification_number } });
        }
        const filters = validateLedgerFilters(req.body);
        const sql = buildAuxiliaryLedgerQuery(companyId, filters);
        const result = await query(sql.text, sql.values);
        if (result.rows.length > MAX_LEDGER_ROWS) return res.status(422).json({ message: 'El resultado supera 20.000 filas. Reduce el período o selecciona cuentas o terceros; no se exportará un resultado incompleto.' });
        if (result.rows.some(row => row.invalid_nature)) return res.status(422).json({ message: 'Hay movimientos o cuentas sin naturaleza DB/CR válida. Revisa su configuración antes de generar el auxiliar.' });
        return res.json({ rows: result.rows, filters, company: { name: company.legal_name, number: company.identification_number }, generated_at: new Date().toISOString(), generated_by: req.auth.userName });
    } catch (error) {
        if (error.statusCode === 400) return res.status(400).json({ message: error.message });
        next(error);
    }
};

export default createAuxiliaryLedgerHandler({ query: async (...args) => {
    const { queryDataBase } = await import('../app.js');
    return queryDataBase(...args);
} });
