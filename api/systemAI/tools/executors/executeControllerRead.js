import { EventEmitter } from 'node:events';
import SystemAIError from '../../core/errors/SystemAIError.js';

// Permite reutilizar controllers legacy basados en req.on('data'/'end') sin
// hacer una petición HTTP desde el backend hacia sí mismo.
const executeControllerRead = (controller, body) => new Promise((resolve, reject) => {
    const req = new EventEmitter();
    let statusCode = 200;
    let responseBody = '';
    let settled = false;

    const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        callback(value);
    };

    const res = {
        writeHead(status) {
            statusCode = status;
            return this;
        },
        status(status) {
            statusCode = status;
            return this;
        },
        json(payload) {
            finish(statusCode >= 400 ? reject : resolve, payload);
            return this;
        },
        end(payload = '') {
            responseBody += payload == null ? '' : String(payload);
            let parsed = responseBody;
            try {
                parsed = responseBody ? JSON.parse(responseBody) : null;
            } catch {
                // Se conserva texto plano si el controller no devuelve JSON.
            }
            if (statusCode >= 400) {
                finish(reject, new SystemAIError('El controller rechazó la consulta de la tool.', {
                    statusCode,
                    code: 'AI_TOOL_CONTROLLER_FAILED',
                    details: parsed
                }));
            } else {
                finish(resolve, parsed);
            }
            return this;
        }
    };

    req.on('error', error => finish(reject, error));
    try {
        controller(req, res);
        queueMicrotask(() => {
            req.emit('data', Buffer.from(JSON.stringify(body)));
            req.emit('end');
        });
    } catch (error) {
        finish(reject, error);
    }
});

export default executeControllerRead;
