import systemAIService from '../../services/systemAIService.js';
import agentRegistry from '../../agents/AgentRegistry.js';
import SystemAIError from '../../core/errors/SystemAIError.js';
import crypto from 'node:crypto';

const systemAIController = {};
const DOCUMENT_MIME_BY_EXTENSION = Object.freeze({
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    csv: 'text/csv',
    md: 'text/markdown'
});

const hasExpectedSignature = (extension, buffer) => {
    if (extension === 'pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    if (extension === 'png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (extension === 'jpg' || extension === 'jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
    return !buffer.includes(0);
};

systemAIController.health = (req, res) => {
    const health = systemAIService.health();
    return res.status(health.ready ? 200 : 503).json({ ok: health.ready, data: health });
};

systemAIController.getAgents = (req, res) => {
    return res.status(200).json({ ok: true, data: systemAIService.listAgents() });
};

systemAIController.runAgent = async (req, res, next) => {
    try {
        const result = await systemAIService.runAgent(req.systemAI);
        return res.status(200).json({ ok: true, data: result });
    } catch (error) {
        next(error);
    }
};

const STREAM_HEARTBEAT_MS = 15000;

const writeStreamEvent = (res, event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

systemAIController.streamAgent = async (req, res, next) => {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Cuando el usuario pulsa Detener el navegador cierra la conexión; abortar
    // la llamada al proveedor evita seguir consumiendo tokens de una respuesta
    // que ya nadie va a leer.
    const abortController = new AbortController();
    const handleClose = () => abortController.abort();
    res.on('close', handleClose);

    // Una tool lenta puede dejar el stream sin tráfico el tiempo suficiente
    // para que un proxy lo corte. El comentario SSE mantiene la conexión viva
    // sin ensuciar los eventos que consume el cliente.
    const heartbeat = setInterval(() => {
        if (!res.writableEnded) res.write(': ping\n\n');
    }, STREAM_HEARTBEAT_MS);

    const emit = (event, data) => {
        if (!res.writableEnded) writeStreamEvent(res, event, data);
    };

    try {
        const result = await systemAIService.streamAgent(
            { ...req.systemAI, signal: abortController.signal },
            {
                onDelta: text => emit('delta', { text }),
                onToolCall: ({ name, arguments: toolArguments }) => emit('tool', {
                    name,
                    arguments: toolArguments
                }),
                // Solo se anuncia el tamaño del resultado: las filas pueden ser
                // enormes y el modelo ya las recibió por su propio canal.
                onToolResult: ({ name, result: toolResult }) => emit('tool_result', {
                    name,
                    ok: true,
                    total_count: toolResult?.total_count ?? null,
                    returned_count: toolResult?.returned_count ?? null
                })
            }
        );
        if (!res.writableEnded) {
            writeStreamEvent(res, 'done', { data: result });
            res.end();
        }
    } catch (error) {
        if (!res.headersSent) return next(error);
        if (!res.writableEnded) {
            writeStreamEvent(res, 'error', {
                code: error.code || 'AI_STREAM_FAILED',
                message: error.message || 'No fue posible completar la respuesta.'
            });
            res.end();
        }
    } finally {
        clearInterval(heartbeat);
        res.off('close', handleClose);
    }
};

systemAIController.readDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new SystemAIError('Se requiere un documento.', {
                statusCode: 400,
                code: 'DOCUMENT_REQUIRED'
            });
        }

        const agent = agentRegistry.get('document-reader');
        const extension = req.file.originalname.split('.').pop()?.toLowerCase();
        const normalizedMimeType = DOCUMENT_MIME_BY_EXTENSION[extension];

        if (!normalizedMimeType || !agent.supportedMimeTypes.includes(normalizedMimeType)) {
            throw new SystemAIError('El tipo de documento no está permitido.', {
                statusCode: 415,
                code: 'UNSUPPORTED_DOCUMENT_TYPE'
            });
        }
        if (!hasExpectedSignature(extension, req.file.buffer)) {
            throw new SystemAIError('El contenido del archivo no coincide con su extensión.', {
                statusCode: 415,
                code: 'INVALID_DOCUMENT_CONTENT'
            });
        }

        const prompt = [
            'Extrae toda la información del documento adjunto.',
            `Nombre del archivo: ${req.file.originalname}.`,
            `Tipo MIME: ${normalizedMimeType}.`
        ].join('\n');
        let input;

        if (normalizedMimeType === 'text/csv' || normalizedMimeType === 'text/markdown') {
            const documentText = req.file.buffer.toString('utf8');
            if (documentText.length > agent.documentProcessing.maxTextCharacters) {
                throw new SystemAIError('El documento de texto excede el tamaño procesable.', {
                    statusCode: 413,
                    code: 'DOCUMENT_TEXT_TOO_LARGE'
                });
            }
            input = `${prompt}\n\nCONTENIDO DEL DOCUMENTO:\n${documentText}`;
        } else if (normalizedMimeType === 'application/pdf') {
            input = [
                { type: 'text', text: prompt },
                {
                    type: 'file',
                    file: {
                        filename: req.file.originalname,
                        file_data: `data:application/pdf;base64,${req.file.buffer.toString('base64')}`
                    }
                }
            ];
        } else {
            input = [
                { type: 'text', text: prompt },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:${normalizedMimeType};base64,${req.file.buffer.toString('base64')}`
                    }
                }
            ];
        }

        const result = await systemAIService.runAgent({
            agentId: 'document-reader',
            input,
            context: {
                companyId: req.auth.companyId,
                userId: req.auth.userId,
                permissions: req.auth.permissions,
                requestId: crypto.randomUUID()
            }
        });

        return res.status(200).json({
            ok: true,
            data: {
                ...result,
                file: {
                    name: req.file.originalname,
                    mime_type: normalizedMimeType,
                    size_bytes: req.file.size
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export default systemAIController;
