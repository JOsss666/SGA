import executeControllerRead from './executeControllerRead.js';
import normalizeControllerRows from './normalizeControllerRows.js';
import normalizeDocumentStatus from './normalizeDocumentStatus.js';

const positiveInteger = value => Number.isSafeInteger(value) && value > 0 ? value : undefined;

const executeGetFacturationPurchases = async ({ arguments: args = {}, context }) => {
    const { default: processController } = await import('../../../controllers/processController.js');
    const result = await executeControllerRead(processController.getDocuments, {
        company_id: context.companyId,
        type: 'Purchase Document',
        id: positiveInteger(args.id),
        status: normalizeDocumentStatus(args.status)
    });
    return { document_type: 'Purchase Document', ...normalizeControllerRows(result, args.limit) };
};

export default executeGetFacturationPurchases;
