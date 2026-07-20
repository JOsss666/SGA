import utilsController from "./utilsController.js";
import electronicProviderCredentialsService from "../services/electronicProviderCredentialsService.js";
import factusService from "../services/factusService.js";

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

electronicProviderCredentialsController.testConnection = async (req, res) => {
    try {
        const info = await utilsController.readJsonBody(req);
        const companyId = info.company_id ?? 0;
        const environment = info.environment ?? 'sandbox';

        const auth = await factusService.getAuthToken({
            company_id: companyId,
            environment,
            bypassCache: true
        });

        const ranges = await factusService.getNumberingRanges({
            company_id: companyId,
            environment,
            bypassCache: true
        });

        sendJson(res, 200, {
            status: "OK",
            company_id: companyId,
            credential_company_id: auth.credential?.company_id,
            provider: auth.credential?.provider,
            environment: auth.credential?.environment,
            token_type: auth.token_type,
            expires_at: auth.expires_at,
            numbering_ranges_count: ranges.length
        });
    } catch (error) {
        console.error('Error en electronicProviderCredentialsController.testConnection:', error);
        sendJson(res, 400, {
            status: "Error",
            message: error.message
        });
    }
};

export default electronicProviderCredentialsController;
