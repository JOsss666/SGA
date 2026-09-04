import zjService from '../../services/costumeServices/z&jService.js';

const zjIntegrationController = {};

zjIntegrationController.handshake = async (req, res, next) => {
    try {
        const context = await zjService.handshake({
            companyId: req.integration.companyId,
            serviceUserId: req.integration.serviceUserId
        });

        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({
            success: true,
            status: 'available',
            service: 'sga360-integrations',
            version: 'v1',
            timestamp: new Date().toISOString(),
            checks: {
                api: 'available',
                authentication: 'valid',
                database: 'available',
                company: 'available',
                service_user: context.service_user_id ? 'available' : 'not_configured'
            },
            integration: {
                client_id: req.integration.clientId,
                company_id: req.integration.companyId,
                company_name: context.trade_name || context.legal_name,
                service_user_id: context.service_user_id,
                service_user_name: context.service_user_name,
                scopes: req.integration.scopes
            },
            database_time: context.database_time
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.getThirdParties = async (req, res, next) => {
    try {
        const result = await zjService.getThirdParties({
            companyId: req.integration.companyId,
            search: req.query.search,
            type: req.query.type,
            page: req.query.page,
            limit: req.query.limit
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.searchThirdParties = async (req, res, next) => {
    try {
        const result = await zjService.searchThirdParties({
            companyId: req.integration.companyId,
            names: req.query.names,
            lastNames: req.query.lastNames,
            corporativeName: req.query.corporative_name,
            email: req.query.email,
            nit: req.query.nit,
            type: req.query.type,
            page: req.query.page,
            limit: req.query.limit
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.getThirdPartyById = async (req, res, next) => {
    try {
        const thirdParty = await zjService.getThirdPartyById({
            companyId: req.integration.companyId,
            thirdPartyId: req.params.id
        });

        if (!thirdParty) {
            const error = new Error('El tercero solicitado no existe o no está disponible.');
            error.statusCode = 404;
            error.code = 'THIRD_PARTY_NOT_FOUND';
            throw error;
        }

        res.status(200).json({
            success: true,
            data: thirdParty
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.getProcessTypes = async (req, res, next) => {
    try {
        const processes = await zjService.getProcessTypes({
            companyId: req.integration.companyId
        });

        res.status(200).json({
            success: true,
            data: processes
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.getProcessInstanceById = async (req, res, next) => {
    try {
        const processInstance = await zjService.getProcessInstanceById({
            companyId: req.integration.companyId,
            processInstanceId: req.params.id
        });

        if (!processInstance) {
            const error = new Error('La instancia de proceso solicitada no existe.');
            error.statusCode = 404;
            error.code = 'PROCESS_INSTANCE_NOT_FOUND';
            throw error;
        }

        res.status(200).json({
            success: true,
            data: processInstance
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.getProductsNServices = async (req, res, next) => {
    try {
        const result = await zjService.getProductsNServices({
            companyId: req.integration.companyId,
            search: req.query.search,
            page: req.query.page,
            limit: req.query.limit
        });

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.createProcessInstance = async (req, res, next) => {
    try {
        const result = await zjService.createProcessInstance({
            integrationId: req.integration.integrationId,
            companyId: req.integration.companyId,
            serviceUserId: req.integration.serviceUserId,
            payload: req.body
        });

        res.status(result.replayed ? 200 : 201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

zjIntegrationController.createClientOrder = async (req, res, next) => {
    try {
        const result = await zjService.createClientOrder({
            integrationId: req.integration.integrationId,
            companyId: req.integration.companyId,
            serviceUserId: req.integration.serviceUserId,
            payload: req.body
        });

        res.status(result.replayed ? 200 : 201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};



export default zjIntegrationController;
