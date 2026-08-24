import executeControllerRead from './executeControllerRead.js';
import normalizeControllerRows from './normalizeControllerRows.js';
import normalizeDocumentStatus from './normalizeDocumentStatus.js';

// getBalance solo acepta company_id, rango de fechas y allAccounts: no admite
// filtro por id ni límite, así que el payload se mantiene en esos campos.
export const buildAccountabilityPayload = (args = {}, context = {}) => ({
    company_id: context.companyId,
    start_date: args.initial_date,
    end_date: args.final_date,
    allAccounts: args.balance,
    status: normalizeDocumentStatus(args.status),
    typePlanAccount: 'PUC'
});

const executeGetAccountability = async ({ arguments: args = {}, context }) => {
    const { default: contabiltyController } = await import('../../../controllers/contabilityController.js');
    const result = await executeControllerRead(
        contabiltyController.getBalance,
        buildAccountabilityPayload(args, context)
    );
    return {infoType: 'raw data', ...normalizeControllerRows(result, args.limit) };
};

export default executeGetAccountability;
