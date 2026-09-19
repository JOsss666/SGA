import utilsController from './utilsController.js';
import sessionRepository from '../repositories/sessionRepository.js';
import { createSupplierDelegationService } from '../services/supplierDelegationService.js';

const service = createSupplierDelegationService({
    withTransaction:utilsController.withTransaction,
    registerDocument:utilsController.registerDocument,
    linkDocumentInstances:utilsController.linkDocumentInstances
});

// La identidad se toma del body (company_id/user_id), no de la cookie de sesión.
// El rol se resuelve desde user_company_memberships para conservar la autorización
// por required_roll tal como funcionaba con la sesión.
const buildAuth = async (body) => {
    const companyId = Number(body?.company_id);
    if(!Number.isInteger(companyId) || companyId <= 0){
        const error = new Error('company_id es obligatorio.'); error.statusCode = 400; throw error;
    }
    const userId = Number(body?.user_id);
    if(!Number.isInteger(userId) || userId <= 0){
        const error = new Error('user_id es obligatorio.'); error.statusCode = 400; throw error;
    }
    const membership = await sessionRepository.findMembership(userId, companyId);
    return { companyId, userId, roleId: membership?.role_id != null ? Number(membership.role_id) : null };
};

const handle = operation => async (req,res) => {
    try {
        res.json(await operation(req));
    } catch(error) {
        const status = error.statusCode || (error.code === '23505' ? 409 : 500);
        if(status >= 500) console.error('Error de delegación:',error);
        res.status(status).json({ok:false,error:status < 500 ? error.message : 'No se pudo completar la delegación. Verifica la migración y vuelve a intentar.'});
    }
};

export default {
    register:handle(async req=>service.register(req.body, await buildAuth(req.body))),
    update:handle(async req=>service.update(req.body, await buildAuth(req.body))),
    list:handle(async req=>service.list(req.body.instance_id, await buildAuth(req.body), req.body.delegation_document_id))
};
