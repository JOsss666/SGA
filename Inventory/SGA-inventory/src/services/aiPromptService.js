import { urlSer } from '../App';

export const AI_DESTINATIONS = Object.freeze({ AGENT: 'agent', CONTROLLER: 'controller' });
export const AI_AGENTS = Object.freeze({ GENERAL_ASSISTANT: 'general-assistant', DOCUMENT_READER: 'document-reader' });

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
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
        throw new AiRequestError(data?.message || data?.error?.message || `La solicitud de IA falló (${response.status}).`, {
            status: response.status,
            code: data?.code || data?.error?.code,
            details: data
        });
    }
    return data;
};

const postJson = async (path, body, companyId) => parseResponse(await fetch(`${urlSer}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(companyId != null ? { 'X-SGA-Company-Id': String(companyId) } : {})
    },
    body: JSON.stringify(body)
}));

const validateControllerPath = (path) => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
        throw new AiRequestError('El controller debe ser una ruta interna válida.', { code: 'INVALID_AI_CONTROLLER' });
    }
};

export async function sendPrompt({ destination, target, content, companyId }) {
    if (destination === AI_DESTINATIONS.AGENT) {
        if (typeof target !== 'string' || !target.trim()) throw new AiRequestError('Debes indicar el id del agente.', { code: 'INVALID_AGENT_ID' });
        if (typeof content !== 'string' || !content.trim()) throw new AiRequestError('El prompt no puede estar vacío.', { code: 'EMPTY_AI_PROMPT' });
        const response = await postJson('/api/system-ai/v1/agents/run', { agent_id: target, input: content.trim() }, companyId);
        return { destination, target, output: response?.data?.output ?? '', data: response?.data, raw: response };
    }
    if (destination === AI_DESTINATIONS.CONTROLLER) {
        validateControllerPath(target);
        const response = await postJson(target, content, companyId);
        return { destination, target, data: response, raw: response };
    }
    throw new AiRequestError('El destino debe ser "agent" o "controller".', { code: 'INVALID_AI_DESTINATION' });
}

export async function streamAgentPrompt({ target, content, companyId, onDelta = () => {} }) {
    if (typeof target !== 'string' || !target.trim()) throw new AiRequestError('Debes indicar el id del agente.', { code: 'INVALID_AGENT_ID' });
    if (typeof content !== 'string' || !content.trim()) throw new AiRequestError('El prompt no puede estar vacío.', { code: 'EMPTY_AI_PROMPT' });
    const response = await fetch(`${urlSer}/api/system-ai/v1/agents/stream`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', ...(companyId != null ? { 'X-SGA-Company-Id': String(companyId) } : {}) },
        body: JSON.stringify({ agent_id: target, input: content.trim() })
    });
    if (!response.ok || !response.body) {
        const details = await response.json().catch(() => null);
        throw new AiRequestError(details?.message || `La solicitud de IA falló (${response.status}).`, { status: response.status, code: details?.code, details });
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completedData = null;
    const consumeEvent = block => {
        let event = 'message';
        const dataLines = [];
        for (const line of block.split(/\r?\n/)) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (!dataLines.length) return;
        const payload = JSON.parse(dataLines.join('\n'));
        if (event === 'delta' && payload.text) onDelta(payload.text);
        if (event === 'done') completedData = payload.data;
        if (event === 'error') throw new AiRequestError(payload.message || 'El streaming de IA fue interrumpido.', { code: payload.code || 'AI_STREAM_FAILED', details: payload });
    };
    while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';
        for (const block of blocks) consumeEvent(block);
        if (done) break;
    }
    if (buffer.trim()) consumeEvent(buffer);
    if (!completedData) throw new AiRequestError('El stream terminó sin confirmación.', { code: 'INCOMPLETE_AI_STREAM' });
    return completedData;
}
