import crypto from 'node:crypto';
import systemAIConfig from '../../config/systemAIConfig.js';
import SystemAIError from '../../core/errors/SystemAIError.js';

const ALLOWED_HISTORY_ROLES = new Set(['user', 'assistant']);

const invalidRequest = message => new SystemAIError(message, {
    statusCode: 400,
    code: 'INVALID_AI_REQUEST'
});

// El historial llega desde el cliente, así que se valida en allowlist: solo
// turnos de usuario y asistente, nunca system ni tool, y siempre acotado.
const normalizeHistory = messages => {
    if (messages === undefined || messages === null) return [];
    if (!Array.isArray(messages)) {
        throw invalidRequest('messages debe ser un arreglo de turnos.');
    }

    const normalized = [];
    for (const message of messages) {
        if (!message || typeof message !== 'object' || Array.isArray(message)) {
            throw invalidRequest('Cada turno de messages debe ser un objeto.');
        }
        const { role, content } = message;
        if (!ALLOWED_HISTORY_ROLES.has(role)) {
            throw new SystemAIError('El rol del turno no está permitido.', {
                statusCode: 400,
                code: 'INVALID_AI_HISTORY_ROLE'
            });
        }
        if (typeof content !== 'string') {
            throw invalidRequest('El contenido de cada turno debe ser texto.');
        }
        const trimmed = content.trim();
        if (!trimmed) continue;
        normalized.push({ role, content: trimmed });
    }

    const trimmedHistory = normalized.slice(-systemAIConfig.maxHistoryMessages);
    const totalCharacters = trimmedHistory.reduce((total, message) => total + message.content.length, 0);
    if (totalCharacters > systemAIConfig.maxHistoryCharacters) {
        throw new SystemAIError('El historial de la conversación excede el tamaño permitido.', {
            statusCode: 413,
            code: 'AI_HISTORY_TOO_LARGE'
        });
    }

    return trimmedHistory;
};

const normalizeChoice = (value, allowed, { code, label }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string' || !Object.hasOwn(allowed, value)) {
        throw new SystemAIError(`${label} no es válido.`, { statusCode: 400, code });
    }
    return value;
};

export const validateAgentRunRequest = (req, res, next) => {
    try {
        const { agent_id: agentId, input, messages, tier, mode } = req.body || {};

        if (typeof agentId !== 'string' || !/^[a-z0-9][a-z0-9-]{1,63}$/.test(agentId)) {
            throw invalidRequest('agent_id no tiene un formato válido.');
        }

        if (typeof input !== 'string' || !input.trim()) {
            throw invalidRequest('input es obligatorio.');
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
            history: normalizeHistory(messages),
            tier: normalizeChoice(tier, systemAIConfig.modelTiers, {
                code: 'INVALID_AI_TIER',
                label: 'tier'
            }),
            mode: normalizeChoice(mode, systemAIConfig.modeInstructions, {
                code: 'INVALID_AI_MODE',
                label: 'mode'
            }),
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
