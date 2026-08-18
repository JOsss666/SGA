import { urlSer } from '../App';

export const AI_DESTINATIONS = Object.freeze({
    AGENT: 'agent',
    CONTROLLER: 'controller'
});

export const AI_AGENTS = Object.freeze({
    GENERAL_ASSISTANT: 'general-assistant',
    DOCUMENT_READER: 'document-reader'
});

export class AiRequestError extends Error {
    constructor(message, { status = 0, code = 'AI_REQUEST_FAILED', details = null } = {}) {
        super(message);
        this.name = 'AiRequestError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

const parseResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        throw new AiRequestError(
            data?.message || data?.error?.message || `La solicitud de IA falló (${response.status}).`,
            {
                status: response.status,
                code: data?.code || data?.error?.code,
                details: data
            }
        );
    }

    return data;
};

const postJson = async (path, body, companyId) => {
    const response = await fetch(`${urlSer}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(companyId != null ? { 'X-SGA-Company-Id': String(companyId) } : {})
        },
        body: JSON.stringify(body)
    });

    return parseResponse(response);
};

const validateControllerPath = (path) => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
        throw new AiRequestError('El controller debe ser una ruta interna válida.', {
            code: 'INVALID_AI_CONTROLLER'
        });
    }
};

/**
 * Punto único para enviar solicitudes de IA desde el frontend.
 *
 * Agente:
 * sendPrompt({ destination: 'agent', target: 'general-assistant', content: '...' })
 *
 * Controller legacy:
 * sendPrompt({ destination: 'controller', target: '/processAiRequest', content: {...} })
 */
export async function sendPrompt({ destination, target, content, companyId }) {
    if (destination === AI_DESTINATIONS.AGENT) {
        if (typeof target !== 'string' || !target.trim()) {
            throw new AiRequestError('Debes indicar el id del agente.', { code: 'INVALID_AGENT_ID' });
        }
        if (typeof content !== 'string' || !content.trim()) {
            throw new AiRequestError('El prompt no puede estar vacío.', { code: 'EMPTY_AI_PROMPT' });
        }

        const response = await postJson('/api/system-ai/v1/agents/run', {
            agent_id: target,
            input: content.trim()
        }, companyId);

        return {
            destination,
            target,
            output: response?.data?.output ?? '',
            data: response?.data,
            raw: response
        };
    }

    if (destination === AI_DESTINATIONS.CONTROLLER) {
        validateControllerPath(target);
        const response = await postJson(target, content, companyId);
        return { destination, target, data: response, raw: response };
    }

    throw new AiRequestError('El destino debe ser "agent" o "controller".', {
        code: 'INVALID_AI_DESTINATION'
    });
}
