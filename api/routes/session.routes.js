import express from 'express';
import sessionAuthController from '../controllers/sessionAuthController.js';
import { authenticateSession } from '../middleware/authenticateSession.js';
import { sessionErrorHandler } from '../middleware/sessionErrorHandler.js';
import { requireTrustedOrigin } from '../middleware/requireTrustedOrigin.js';

const sessionRouter = express.Router();

sessionRouter.use(express.json({ limit: '16kb', strict: true }));
sessionRouter.post('/login', sessionAuthController.login);
sessionRouter.post('/logout', requireTrustedOrigin, sessionAuthController.logout);
sessionRouter.get('/session', authenticateSession, sessionAuthController.currentSession);
sessionRouter.use(sessionErrorHandler);

export default sessionRouter;
