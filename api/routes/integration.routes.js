import express from 'express';
import integrationAuthController from '../controllers/integrationAuthController.js';
import { integrationTokenRateLimit } from '../middleware/integrationTokenRateLimit.js';

const integrationRouter = express.Router();

integrationRouter.post(
    '/auth/token',
    integrationTokenRateLimit,
    integrationAuthController.issueToken
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
