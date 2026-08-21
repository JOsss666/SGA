class SystemAIError extends Error {
    constructor(message, { statusCode = 500, code = 'SYSTEM_AI_ERROR', details } = {}) {
        super(message);
        this.name = 'SystemAIError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export default SystemAIError;
