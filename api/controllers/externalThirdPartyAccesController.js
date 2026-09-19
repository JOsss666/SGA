import externalThirdPartyAccesService from '../services/externalThirdPartyAccesService.js';
import utilsController from './utilsController.js';
import sessionRepository from '../repositories/sessionRepository.js';
import { createSupplierDelegationService } from '../services/supplierDelegationService.js';

const externalAccesThirdPartyController = {};

// Servicio de delegación reutilizado para el acceso externo. El tercero del portal
// se autentica por company_key + access_key (no por cookie de sesión) y la delegación
// actúa con la identidad/rol del "responsable" interno del acceso, tal como documenta
// getUserInfo (el tercero no tiene rol propio).
const delegationService = createSupplierDelegationService({
    withTransaction: utilsController.withTransaction,
    registerDocument: utilsController.registerDocument,
    linkDocumentInstances: utilsController.linkDocumentInstances,
});

const resolveExternalDelegationAuth = async (info) => {
    const access = await externalThirdPartyAccesService.getUserInfo(info);
    if (!access) return null;
    const companyId = Number(access.company_id);
    const userId = Number(access.responsable);
    // El rol debe salir de la MISMA fuente que la auth interna (requireCompanyAccess):
    // user_company_memberships.role_id, no users_config.role. Así la delegación desde
    // el portal externo autoriza igual que cuando la hace el usuario interno.
    const membership = await sessionRepository.findMembership(userId, companyId);
    return {
        companyId,
        userId,
        roleId: membership?.role_id != null ? Number(membership.role_id) : null,
    };
};

const handleExternalDelegation = (operation) => async (req, res) => {
    try {
        const info = await readBody(req);
        const auth = await resolveExternalDelegationAuth(info);
        if (!auth) {
            res.status(401).json({ ok: false, error: 'Acceso externo no válido.' });
            return;
        }
        res.json(await operation(info, auth));
    } catch (error) {
        const status = error.statusCode || (error.code === '23505' ? 409 : 500);
        if (status >= 500) console.error('Error de delegación externa:', error);
        res.status(status).json({
            ok: false,
            error: status < 500 ? error.message : 'No se pudo completar la delegación. Intenta nuevamente.',
        });
    }
};

const sendResponse = (res, statusCode, status, data = null, message = '') => {
    res.status(statusCode).json({ status, data, message });
};

const readBody = (req) => new Promise((resolve, reject) => {
    if (req.body !== undefined) {
        resolve(req.body);
        return;
    }

    let data = '';

    req.on('data', (chunk) => {
        data += chunk;
    });
    req.on('end', () => {
        try {
            resolve(data ? JSON.parse(data) : {});
        } catch {
            const error = new Error('El cuerpo de la solicitud debe ser JSON válido.');
            error.statusCode = 400;
            reject(error);
        }
    });
    req.on('error', reject);
});

const handleExternalAccess = (req, res, serviceMethod, successMessage) => {
    readBody(req)
        .then((info) => serviceMethod(info))
        .then((data) => {
            if (!data) {
                sendResponse(res, 401, 'ERROR', null, 'Credenciales o acceso externo no válidos.');
                return;
            }

            sendResponse(res, 200, 'OK', data, successMessage);
        })
        .catch((error) => {
            console.error('Error en acceso externo:', error);
            sendResponse(res, error.statusCode || 500, 'ERROR', null, error.message || 'No fue posible procesar el acceso externo.');
        });
};

externalAccesThirdPartyController.create = (req, res) => {
    handleExternalAccess(req, res, externalThirdPartyAccesService.create, 'Acceso externo guardado correctamente.');
};

externalAccesThirdPartyController.logIn = (req, res) => {
    handleExternalAccess(req, res, externalThirdPartyAccesService.logIn, 'Inicio de sesión externo correcto.');
};

externalAccesThirdPartyController.getCompanyInfo = (req, res) => {
    handleExternalAccess(req, res, externalThirdPartyAccesService.getCompanyInfo, 'Información de compañía obtenida correctamente.');
};

externalAccesThirdPartyController.getUserInfo = (req, res) => {
    handleExternalAccess(req, res, externalThirdPartyAccesService.getUserInfo, 'Información de tercero obtenida correctamente.');
};

externalAccesThirdPartyController.logOut = (req, res) => {
    sendResponse(res, 200, 'OK', null, 'Sesión externa cerrada correctamente.');
};

externalAccesThirdPartyController.getParamsDocs = (req, res) => {
    readBody(req)
        .then(info => externalThirdPartyAccesService.getParamsDocs(info))
        .then(rows => {
            if (rows === null) {
                sendResponse(res, 401, 'ERROR', null, 'Acceso externo no válido o vencido.');
                return;
            }
            // Mantener el contrato de lista usado por los consumidores existentes.
            res.status(200).json([true, rows]);
        })
        .catch(error => {
            console.error('Error en getParamsDocs:', error.message);
            sendResponse(res, error.statusCode || 500, 'ERROR', null, error.message);
        });
};

externalAccesThirdPartyController.getParamDocTemplate = (req, res) => {
    readBody(req)
        .then(info => externalThirdPartyAccesService.getParamDocTemplate(info))
        .then(template => {
            if (!template) {
                sendResponse(res, 404, 'ERROR', null, 'No se encontró la plantilla del documento solicitado.');
                return;
            }
            sendResponse(res, 200, 'OK', template, 'Plantilla del documento obtenida correctamente.');
        })
        .catch(error => {
            console.error('Error en getParamDocTemplate:', error.message);
            sendResponse(res, error.statusCode || 500, 'ERROR', null, error.message);
        });
};

externalAccesThirdPartyController.registerParamDoc = async (req, res) => {
    try {
        const result = await externalThirdPartyAccesService.registerParamDoc(await readBody(req));
        sendResponse(res, 201, 'OK', result, 'Documento y flujo personalizado registrados correctamente.');
    } catch (error) {
        const status = error.statusCode || 500;
        if (error.primaryDocument) {
            sendResponse(res, status, 'ERROR', error.primaryDocument,
                `El documento principal #${error.primaryDocument.doc_id} quedó guardado. No se creó la Client Order. ${status < 500 ? error.message : 'Falló el registro secundario.'}`);
            return;
        }
        sendResponse(res, status, 'ERROR', null, status < 500 ? error.message : 'No fue posible registrar el documento. La operación fue revertida.');
    }
};

externalAccesThirdPartyController.delegationList = handleExternalDelegation(
    (info, auth) => delegationService.list(info.instance_id, auth, info.delegation_document_id)
);

externalAccesThirdPartyController.delegationRegister = handleExternalDelegation(
    (info, auth) => delegationService.register(info, auth)
);

externalAccesThirdPartyController.delegationUpdate = handleExternalDelegation(
    (info, auth) => delegationService.update(info, auth)
);

export default externalAccesThirdPartyController;
