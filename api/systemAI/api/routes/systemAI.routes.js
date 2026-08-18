import express from 'express';
import multer from 'multer';
import systemAIController from '../controllers/systemAIController.js';
import { validateAgentRunRequest } from '../../security/guardrails/validateSystemAIRequest.js';
import { systemAIRateLimit } from '../../middleware/systemAIRateLimit.js';
import { systemAIErrorHandler } from '../../middleware/systemAIErrorHandler.js';
import { authenticateSession } from '../../../middleware/authenticateSession.js';
import { requireCompanyAccess } from '../../../middleware/requireCompanyAccess.js';
import { requireTrustedOrigin } from '../../../middleware/requireTrustedOrigin.js';

const systemAIRouter = express.Router();
const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { files: 1, fileSize: 10 * 1024 * 1024 }
});

systemAIRouter.use(express.json({ limit: '32kb', strict: true }));
systemAIRouter.get('/health', systemAIController.health);
systemAIRouter.use(requireTrustedOrigin, authenticateSession, requireCompanyAccess, systemAIRateLimit);
systemAIRouter.get('/agents', systemAIController.getAgents);
systemAIRouter.post('/agents/run', validateAgentRunRequest, systemAIController.runAgent);
systemAIRouter.post('/documents/read', documentUpload.single('document'), systemAIController.readDocument);
systemAIRouter.use(systemAIErrorHandler);

export default systemAIRouter;
