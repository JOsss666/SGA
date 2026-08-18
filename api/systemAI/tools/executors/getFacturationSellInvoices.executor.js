import executeControllerRead from './executeControllerRead.js';
import normalizeControllerRows from './normalizeControllerRows.js';
import normalizeDocumentStatus from './normalizeDocumentStatus.js';

const positiveInteger = value => Number.isSafeInteger(value) && value > 0 ? value : undefined;

export const buildSalesInvoiceControllerPayload = (args = {}, context = {}) => {
    const operation = args.operation || 'list';
    const requestedId = positiveInteger(args.id);
    if (operation === 'by_id' && requestedId === undefined) {
        throw new Error('La operación by_id requiere un ID de factura válido.');
    }

    return {
        company_id: context.companyId,
        type: 'Sell Invoice',
        // Nunca se confía en un ID sugerido por el modelo para operaciones
        // generales. Solo by_id habilita intencionalmente este filtro.
        id: operation === 'by_id' ? requestedId : undefined,
        status: normalizeDocumentStatus(args.status),
        limint: operation === 'latest' ? 1 : undefined
    };
};

const executeGetFacturationSellInvoices = async ({ arguments: args = {}, context }) => {
    const { default: processController } = await import('../../../controllers/processController.js');
    const result = await executeControllerRead(
        processController.getDocuments,
        buildSalesInvoiceControllerPayload(args, context)
    );
    return { document_type: 'Sell Invoice', ...normalizeControllerRows(result, args.limit) };
};

export default executeGetFacturationSellInvoices;
