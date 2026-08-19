import executeControllerRead from './executeControllerRead.js';
import normalizeControllerRows from './normalizeControllerRows.js';
import normalizeDocumentStatus from './normalizeDocumentStatus.js';

const positiveInteger = value => Number.isSafeInteger(value) && value > 0 ? value : undefined;

export const buildDocumentsPayload = (args = {}, context = {}) => {
    const operation = args.operation || 'list';
    const requestedId = positiveInteger(args.id);
    if (operation === 'by_id' && requestedId === undefined) {
        throw new Error('La operación by_id requiere un ID de factura válido.');
    }

    return {
        company_id: context.companyId,
        // Nunca se confía en un ID sugerido por el modelo para operaciones
        // generales. Solo by_id habilita intencionalmente este filtro.
        start_date:args.initial_date,
        end_date:args.final_date,
        allowedTypes:args.types,
        id: operation === 'by_id' ? requestedId : undefined,
        status: normalizeDocumentStatus(args.status),
        limint: operation === 'latest' ? 1 : undefined,
    };
};

const executeGetDocuments = async ({ arguments: args = {}, context }) => {
    const { default: controller } = await import('../../../controllers/index.controller.js');
    const result = await executeControllerRead(
        controller.getDocuments,
        buildDocumentsPayload(args, context)
    );
    return {infoType: 'raw data', ...normalizeControllerRows(result, args.limit) };
};

export default executeGetDocuments;
