import SystemAIError from '../../core/errors/SystemAIError.js';

// Los servicios legacy lanzan Error con statusCode de negocio (422, 409…).
// Se conservan esos mensajes y se oculta cualquier fallo interno.
export const runDocumentService = async (action) => {
    try {
        return await action();
    } catch (error) {
        if (error instanceof SystemAIError) throw error;
        const status = Number(error?.statusCode);
        if (status >= 400 && status < 500) {
            throw new SystemAIError(error.message, { statusCode: status, code: 'DOCUMENT_REJECTED' });
        }
        console.error('Error creando documento por MCP:', error);
        throw new SystemAIError('No fue posible crear el documento.', { statusCode: 500, code: 'DOCUMENT_CREATION_FAILED' });
    }
};

export const documentResult = (result, kind, summary) => {
    if (result?.status !== 'OK') {
        throw new SystemAIError(result?.message || 'No fue posible crear el documento.', { statusCode: 422, code: 'DOCUMENT_REJECTED' });
    }
    return {
        infoType: kind,
        document_id: result.id,
        own_serial: result.ownSerial,
        replayed: result.replayed === true,
        message: result.message,
        ...summary
    };
};
