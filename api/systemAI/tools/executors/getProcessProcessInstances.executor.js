import executeControllerRead from './executeControllerRead.js';
import normalizeControllerRows from './normalizeControllerRows.js';

const positiveInteger = value => Number.isSafeInteger(value) && value > 0 ? value : undefined;

const executeGetProcessProcessInstances = async ({ arguments: args = {}, context }) => {
    const { default: processController } = await import('../../../controllers/processController.js');
    const status = Array.isArray(args.status)
        ? args.status.filter(value => typeof value === 'string' && value.trim()).slice(0, 10)
        : ['all'];
    const result = await executeControllerRead(processController.getProcessInstances, {
        company_id: context.companyId,
        id: positiveInteger(args.id),
        process_id: positiveInteger(args.process_id),
        status: status.length ? status : ['all']
    });
    return normalizeControllerRows(result, args.limit);
};

export default executeGetProcessProcessInstances;
