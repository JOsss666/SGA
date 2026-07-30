class IntegrationAuthError extends Error {
    constructor(message, { statusCode = 401, code = 'UNAUTHORIZED' } = {}) {
        super(message);
        this.name = 'IntegrationAuthError';
        this.statusCode = statusCode;
        this.code = code;
    }
}

export default IntegrationAuthError;
