class SessionError extends Error {
    constructor(message, { statusCode = 401, code = 'UNAUTHENTICATED' } = {}) {
        super(message);
        this.name = 'SessionError';
        this.statusCode = statusCode;
        this.code = code;
    }
}

export default SessionError;
