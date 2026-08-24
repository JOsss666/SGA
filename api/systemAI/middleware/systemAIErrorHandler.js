export const systemAIErrorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    const statusCode = error.code === 'LIMIT_FILE_SIZE'
        ? 413
        : (Number(error.statusCode) || 500);
    const isServerError = statusCode >= 500;

    if (isServerError) {
        console.error('Error en systemAI:', {
            requestId: req.systemAI?.context?.requestId,
            code: error.code,
            message: error.message
        });
    }

    return res.status(statusCode).json({
        ok: false,
        error: {
            code: isServerError ? (error.code || 'SYSTEM_AI_INTERNAL_ERROR') : (error.code || 'SYSTEM_AI_REQUEST_ERROR'),
            message: error.code === 'LIMIT_FILE_SIZE'
                ? 'El documento excede el límite de 10 MB.'
                : (isServerError ? 'No fue posible procesar la solicitud de IA.' : error.message),
            request_id: req.systemAI?.context?.requestId || null
        }
    });
};
