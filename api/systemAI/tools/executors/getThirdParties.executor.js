import executeControllerRead from './executeControllerRead.js';
import normalizeControllerRows from './normalizeControllerRows.js';

const positiveInteger = value => Number.isSafeInteger(value) && value > 0 ? value : undefined;

export const buildThirdPartiesPayload = (args = {}, context = {}) => {
    const operation = args.operation || 'list';
    const requestedId = positiveInteger(args.id);
    if (operation === 'by_id' && requestedId === undefined) {
        throw new Error('La operación by_id requiere un ID de tercero válido.');
    }

    return {
        company_id: context.companyId,
        // Nunca se confía en un ID sugerido por el modelo para operaciones
        // generales. Solo by_id habilita intencionalmente este filtro.
        identificationNumber:args.identification_number?.trim() || undefined,
        comercialInfo:['summary', 'by_id'].includes(operation),
        id: operation === 'by_id' ? requestedId : undefined,
    };
};

const executeGetThirdParties = async ({ arguments: args = {}, context }) => {
    const { default: controller } = await import('../../../controllers/index.controller.js');
    const result = await executeControllerRead(
        controller.getThirdParties,
        buildThirdPartiesPayload(args, context)
    );
    const normalized = normalizeControllerRows(result, args.limit);
    if (args.operation === 'count') {
        return {
            infoType:'third_parties_count',
            total_count:normalized.total_count,
            returned_count:0,
            records:[]
        };
    }
    return {infoType:'third_parties', ...normalized};
};

export default executeGetThirdParties;
