import utilsController from './utilsController.js';
import { createSupplierDelegationService } from '../services/supplierDelegationService.js';

const service = createSupplierDelegationService({
    withTransaction:utilsController.withTransaction,
    registerDocument:utilsController.registerDocument,
    linkDocumentInstances:utilsController.linkDocumentInstances
});

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
    register:handle(req=>service.register(req.body,req.auth)),
    update:handle(req=>service.update(req.body,req.auth)),
    list:handle(req=>service.list(req.body.instance_id,req.auth,req.body.delegation_document_id))
};
