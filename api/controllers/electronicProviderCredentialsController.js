import utilsController from "./utilsController.js";
import electronicProviderCredentialsService from "../services/electronicProviderCredentialsService.js";

const electronicProviderCredentialsController = {};

const sendJson = (res, statusCode, payload) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
};

electronicProviderCredentialsController.upsert = async (req, res) => {
    try {
        const info = await utilsController.readJsonBody(req);
        const result = await electronicProviderCredentialsService.upsert(info);
        sendJson(res, 200, result);
    } catch (error) {
        console.error('Error en electronicProviderCredentialsController.upsert:', error);
        sendJson(res, 400, {
            status: "Error",
            message: error.message
        });
    }
};

electronicProviderCredentialsController.list = async (req, res) => {
    try {
        const info = await utilsController.readJsonBody(req);
        const result = await electronicProviderCredentialsService.list(info);
        sendJson(res, 200, [result.length > 0, result]);
    } catch (error) {
        console.error('Error en electronicProviderCredentialsController.list:', error);
        sendJson(res, 400, {
            status: "Error",
            message: error.message
        });
    }
};

electronicProviderCredentialsController.disable = async (req, res) => {
    try {
        const info = await utilsController.readJsonBody(req);
        const result = await electronicProviderCredentialsService.disable({
            ...info,
            id: req.params?.id ?? info.id
        });
        sendJson(res, result.status === "OK" ? 200 : 404, result);
    } catch (error) {
        console.error('Error en electronicProviderCredentialsController.disable:', error);
        sendJson(res, 400, {
            status: "Error",
            message: error.message
        });
    }
};

export default electronicProviderCredentialsController;
