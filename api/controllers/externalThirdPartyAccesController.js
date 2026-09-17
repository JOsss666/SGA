import externalThirdPartyAccesService from '../services/externalThirdPartyAccesService.js';

const externalAccesThirdPartyController = {};

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

export default externalAccesThirdPartyController;
