import express from 'express';
import mcpSettingsController from './mcpSettingsController.js';
import { authenticateSession } from '../../middleware/authenticateSession.js';
import { requireCompanyAccess } from '../../middleware/requireCompanyAccess.js';
import { requireTrustedOrigin } from '../../middleware/requireTrustedOrigin.js';
import { sessionErrorHandler } from '../../middleware/sessionErrorHandler.js';
import { systemAIRateLimit } from '../middleware/systemAIRateLimit.js';

// Administración de la conexión MCP desde la UI. Identidad: cookie de sesión.
// La compañía sale de requireCompanyAccess (membresía verificada), nunca del body.
const mcpSettingsRouter = express.Router();

mcpSettingsRouter.use(
    express.json({ limit: '4kb', strict: true }),
    requireTrustedOrigin,
    authenticateSession,
    requireCompanyAccess,
    systemAIRateLimit
);

mcpSettingsRouter.get('/', mcpSettingsController.getOverview);
mcpSettingsRouter.post('/credentials', mcpSettingsController.createCredentials);
mcpSettingsRouter.post('/credentials/rotate', mcpSettingsController.rotateSecret);
mcpSettingsRouter.patch('/credentials/status', mcpSettingsController.setStatus);
mcpSettingsRouter.post('/credentials/write-access', mcpSettingsController.setWriteAccess);
mcpSettingsRouter.post('/access-token', mcpSettingsController.issueAccessToken);
mcpSettingsRouter.use(sessionErrorHandler);

export default mcpSettingsRouter;
