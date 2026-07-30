import express from 'express';
import fs from 'node:fs';
import { apiReference } from '@scalar/express-api-reference';
import integrationAuthController from '../controllers/integrationAuthController.js';
import { integrationTokenRateLimit } from '../middleware/integrationTokenRateLimit.js';
import {
    authenticateIntegration,
    requireScope
} from '../middleware/integrationAuth.js';
import zjIntegrationController from '../controllers/custom-controllers/zjIntegrationController.js';

const integrationRouter = express.Router();
const integrationLogoUrl = new URL(
    '../../Facturation/Facturation/src/assets/sgaLogo.png',
    import.meta.url
);
const openApiDocument = JSON.parse(
    fs.readFileSync(
        new URL('../../docs/openapi/zj-integration.openapi.json', import.meta.url),
        'utf8'
    )
);

integrationRouter.get('/openapi.json', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(openApiDocument);
});

integrationRouter.get('/assets/sga-logo.png', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(integrationLogoUrl.pathname);
});

integrationRouter.get(
    '/docs',
    apiReference({
        pageTitle: 'SGA360 | API de integración Z&J',
        theme: 'purple',
        layout: 'modern',
        darkMode: true,
        forceDarkModeState: 'dark',
        hideDarkModeToggle: true,
        favicon: '/api/integrations/v1/assets/sga-logo.png',
        customCss: `
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');

            :root {
                --bg: #000000;
                --menuAside: #18181B;
                --lightGradient1: #0C0A09;
                --lightGradient2: #121212;
                --lightGradient3: #1E1E1E;
                --lightGradient4: #252525;
                --text: #e6eef6;
                --mainText: #ffffff;
                --sectionTitle: #E1E1E1;
                --descriptionText: #bbbbbb;
                --iconHover: #303030;
                --inputsBg: #303030;
                --inputsBorder: #5a5a5a;
                --cardHover: #222222;

                --scalar-font: 'Montserrat', sans-serif;
                --scalar-background-1: var(--bg);
                --scalar-background-2: var(--menuAside);
                --scalar-background-3: var(--lightGradient3);
                --scalar-background-accent: var(--iconHover);
                --scalar-color-1: var(--mainText);
                --scalar-color-2: var(--descriptionText);
                --scalar-color-3: var(--text);
                --scalar-border-color: var(--inputsBorder);
                --scalar-color-accent: #48cbd8;
            }

            body,
            button,
            input,
            textarea,
            select {
                font-family: 'Montserrat', sans-serif !important;
            }

            main h1:first-of-type {
                font-size: clamp(2.25rem, 4vw, 4rem) !important;
                line-height: 1.08 !important;
                font-weight: 800 !important;
                letter-spacing: -0.04em;
            }

            main h1:first-of-type::before {
                content: '';
                display: inline-block !important;
                width: clamp(56px, 6vw, 80px);
                height: clamp(56px, 6vw, 80px);
                margin-right: 16px;
                vertical-align: middle;
                background: url('/api/integrations/v1/assets/sga-logo.png') center / contain no-repeat;
                filter: drop-shadow(0 10px 28px rgba(72, 203, 216, 0.22));
            }
        `,
        content: openApiDocument
    })
);

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
