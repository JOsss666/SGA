import utilsController from '../utilsController.js';
import nexo360Controller from './nexo360Controller.js';
import { createParameterDocumentService } from '../../services/parameterDocumentService.js';

// Registro interno de documentos parametrizados (app Facturation). Mismo motor que el
// flujo externo, pero con identidad interna (company_id + user_id) en vez del acceso
// externo (accesKey). El diccionario `actions` mapea el `destiny` de la plantilla a su
// servicio personalizado (p. ej. nexo360 -> Client Order).
const parameterDocumentService = createParameterDocumentService({
    withTransaction: utilsController.withTransaction,
    registerDocument: utilsController.registerDocument,
    linkDocumentInstances: utilsController.linkDocumentInstances,
    actions: { createCaralNexo360Order: nexo360Controller.createCaralNexo360Order }
});

const sendResponse = (res, statusCode, status, data = null, message = '') => {
    res.status(statusCode).json({ status, data, message });
};

const readBody = (req) => new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); }
        catch { reject(Object.assign(new Error('El cuerpo de la solicitud no es un JSON válido.'), { statusCode: 400 })); }
    });
    req.on('error', reject);
});

const paramDocInternalController = {};

paramDocInternalController.registerParamDoc = async (req, res) => {
    try {
        const result = await parameterDocumentService.registerInternal(await readBody(req));
        sendResponse(res, 201, 'OK', result, 'Documento y flujo personalizado registrados correctamente.');
    } catch (error) {
        console.error('registerParamDoc (interno) falló:', error?.message, error?.stack);
        const status = error.statusCode || 500;
        if (error.primaryDocument) {
            sendResponse(res, status, 'ERROR', error.primaryDocument,
                `El documento principal #${error.primaryDocument.doc_id} quedó guardado. No se creó el documento secundario. ${status < 500 ? error.message : 'Falló el registro secundario.'}`);
            return;
        }
        sendResponse(res, status, 'ERROR', null, status < 500 ? error.message : 'No fue posible registrar el documento. La operación fue revertida.');
    }
};

export default paramDocInternalController;
