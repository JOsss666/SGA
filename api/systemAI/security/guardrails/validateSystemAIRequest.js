import crypto from 'node:crypto';
import systemAIConfig from '../../config/systemAIConfig.js';
import SystemAIError from '../../core/errors/SystemAIError.js';

export const validateAgentRunRequest = (req, res, next) => {
    try {
        const { agent_id: agentId, input } = req.body || {};

        if (typeof agentId !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(agentId)) {
            throw new SystemAIError('agent_id no tiene un formato válido.', {
                statusCode: 400,
                code: 'INVALID_AI_REQUEST'
            });
        }

        if (typeof input !== 'string' || !input.trim()) {
            throw new SystemAIError('input es obligatorio.', {
                statusCode: 400,
                code: 'INVALID_AI_REQUEST'
            });
        }

        if (input.length > systemAIConfig.maxInputCharacters) {
            throw new SystemAIError('input excede el tamaño permitido.', {
                statusCode: 413,
                code: 'AI_INPUT_TOO_LARGE'
            });
        }

        req.systemAI = {
            agentId,
            input: input.trim(),
            context: {
                companyId: req.auth.companyId,
                userId: req.auth.userId,
                permissions: req.auth.permissions,
                requestId: crypto.randomUUID()
            }
        };
        next();
    } catch (error) {
        next(error);
    }
};
