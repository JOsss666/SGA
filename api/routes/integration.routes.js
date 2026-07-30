import express from 'express';
import integrationAuthController from '../controllers/integrationAuthController.js';
import { integrationTokenRateLimit } from '../middleware/integrationTokenRateLimit.js';
import {
    authenticateIntegration,
    requireScope
} from '../middleware/integrationAuth.js';
import zjIntegrationController from '../controllers/custom-controllers/zjIntegrationController.js';

const integrationRouter = express.Router();

integrationRouter.post(
    '/auth/token',
    integrationTokenRateLimit,
    integrationAuthController.issueToken
);

integrationRouter.get(
    '/handshake',
    authenticateIntegration,
    zjIntegrationController.handshake
);

integrationRouter.get(
    '/third-parties',
    authenticateIntegration,
    requireScope('third-parties:read'),
    zjIntegrationController.getThirdParties
);

integrationRouter.get(
    '/third-parties/:id',
    authenticateIntegration,
    requireScope('third-parties:read'),
    zjIntegrationController.getThirdPartyById
);

integrationRouter.get(
    '/services',
    authenticateIntegration,
    requireScope('services:read'),
    zjIntegrationController.getProductsNServices
);

integrationRouter.get(
    '/processes',
    authenticateIntegration,
    requireScope('processes:read'),
    zjIntegrationController.getProcessTypes
);

integrationRouter.get(
    '/process-instances/:id',
    authenticateIntegration,
    requireScope('processes:read'),
    zjIntegrationController.getProcessInstanceById
);

integrationRouter.post(
    '/process-instances',
    authenticateIntegration,
    requireScope('processes:create'),
    express.json({ limit: '32kb', strict: true }),
    zjIntegrationController.createProcessInstance
);

integrationRouter.post(
    '/customer-orders',
    authenticateIntegration,
    requireScope('customer-orders:create'),
    express.json({ limit: '64kb', strict: true }),
    zjIntegrationController.createClientOrder
);

integrationRouter.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const statusCode = Number(error.statusCode) || 500;
    const isServerError = statusCode >= 500;
    if (isServerError) {
        console.error('Error en API de integraciones:', error);
    }

    return res.status(statusCode).json({
        success: false,
        error: {
            code: isServerError ? 'INTERNAL_ERROR' : (error.code || 'REQUEST_ERROR'),
            message: isServerError
                ? 'No fue posible procesar la petición.'
                : error.message
        }
    });
});

export default integrationRouter;
