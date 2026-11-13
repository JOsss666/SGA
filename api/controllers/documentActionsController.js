import { withTransaction, queryDataBase } from '../app.js';
import { documentActionsService } from '../services/documentActionsService.js';

// Controlador delgado: resuelve compañía/usuario/documento de la solicitud, ejecuta la
// acción en una transacción y traduce errores. NO contiene reglas de negocio; esas viven
// en services/documentPolicy.js y se aplican dentro del servicio.

const resolveCompanyId = req => req.get('X-SGA-Company-Id') ?? req.body?.company_id;
const resolveUserId = req => req.body?.user_id ?? req.get('X-SGA-User-Id');

const respondError = (error, res, next) => {
    const status = Number(error?.statusCode);
    if (Number.isInteger(status) && status >= 400 && status < 500) return res.status(status).json({ message: error.message });
    return next(error);
};

function createHandler(run) {
    return async (req, res, next) => {
        try {
            const input = {
                companyId: resolveCompanyId(req),
                userId: resolveUserId(req),
                docId: req.body?.doc_id,
                changes: req.body?.changes
            };
            const result = await withTransaction(client => run(client, input));
            const { ledgerChanged, ...body } = result;
            let ledgerRefreshPending = false;
            if (ledgerChanged) {
                try {
                    await queryDataBase('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_movements');
                } catch {
                    // El cambio ya quedó confirmado; la próxima actualización de la vista lo refleja.
                    ledgerRefreshPending = true;
                }
            }
            return res.status(200).json({ ...body, ledgerRefreshPending });
        } catch (error) {
            return respondError(error, res, next);
        }
    };
}

export const activateDocument = createHandler((client, input) => documentActionsService.activate(client, input));
export const cancelDocument = createHandler((client, input) => documentActionsService.cancel(client, input));
export const editDocument = createHandler((client, input) => documentActionsService.edit(client, input));
