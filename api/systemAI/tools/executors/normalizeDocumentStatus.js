import SystemAIError from '../../core/errors/SystemAIError.js';

export const DOCUMENT_STATUSES = Object.freeze([
    'active',
    'disabled',
    'blocked',
    'reported'
]);

const normalizeDocumentStatus = value => {
    if (value == null) return undefined;
    if (typeof value !== 'string') {
        throw new SystemAIError('El estado del documento debe ser texto.', {
            statusCode: 400,
            code: 'INVALID_TOOL_ARGUMENTS'
        });
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === 'all') return undefined;
    if (!DOCUMENT_STATUSES.includes(normalized)) {
        throw new SystemAIError('El estado solicitado no es válido para documentos.', {
            statusCode: 400,
            code: 'INVALID_TOOL_ARGUMENTS',
            details: { field: 'status', allowed: [...DOCUMENT_STATUSES, 'all'] }
        });
    }
    return normalized;
};

export default normalizeDocumentStatus;
