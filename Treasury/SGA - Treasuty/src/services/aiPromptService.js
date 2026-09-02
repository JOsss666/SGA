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
            Accept: 'application/json',
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

export async function listAgents({ companyId, signal } = {}) {
    const response = await fetch(`${urlSer}/api/system-ai/v1/agents`, {
        method: 'GET',
        credentials: 'include',
        signal,
        headers: {
            Accept: 'application/json',
            ...(companyId != null ? { 'X-SGA-Company-Id': String(companyId) } : {})
        }
    });
    const data = await parseResponse(response);
    return Array.isArray(data?.data) ? data.data : [];
}

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_ACCEPTED_EXTENSIONS = Object.freeze(['pdf', 'jpg', 'jpeg', 'png', 'csv', 'md']);

export async function readDocument({ file, companyId, signal }) {
    if (!file) {
        throw new AiRequestError('Debes seleccionar un archivo.', { code: 'DOCUMENT_REQUIRED' });
    }
    const extension = file.name?.split('.').pop()?.toLowerCase();
    if (!DOCUMENT_ACCEPTED_EXTENSIONS.includes(extension)) {
        throw new AiRequestError(
            `Solo se admiten archivos ${DOCUMENT_ACCEPTED_EXTENSIONS.join(', ')}.`,
            { code: 'UNSUPPORTED_DOCUMENT_TYPE' }
        );
    }
    if (file.size > DOCUMENT_MAX_BYTES) {
        throw new AiRequestError('El archivo supera los 10 MB permitidos.', { code: 'DOCUMENT_TOO_LARGE' });
    }

    const body = new FormData();
    body.append('document', file);

    const response = await fetch(`${urlSer}/api/system-ai/v1/documents/read`, {
        method: 'POST',
        credentials: 'include',
        signal,
        headers: {
            Accept: 'application/json',
            ...(companyId != null ? { 'X-SGA-Company-Id': String(companyId) } : {})
        },
        body
    });

    const data = await parseResponse(response);
    return data?.data ?? null;
}

export async function streamAgentPrompt({
    target,
    content,
    history = [],
    tier,
    mode,
    companyId,
    signal,
    onDelta = () => {},
    onTool = () => {},
    onToolResult = () => {}
}) {
    if (typeof target !== 'string' || !target.trim()) {
        throw new AiRequestError('Debes indicar el id del agente.', { code: 'INVALID_AGENT_ID' });
    }
    if (typeof content !== 'string' || !content.trim()) {
        throw new AiRequestError('El prompt no puede estar vacío.', { code: 'EMPTY_AI_PROMPT' });
    }

    const response = await fetch(`${urlSer}/api/system-ai/v1/agents/stream`, {
        method: 'POST',
        credentials: 'include',
        signal,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...(companyId != null ? { 'X-SGA-Company-Id': String(companyId) } : {})
        },
        body: JSON.stringify({
            agent_id: target,
            input: content.trim(),
            ...(history.length ? { messages: history } : {}),
            ...(tier ? { tier } : {}),
            ...(mode ? { mode } : {})
        })
    });

    if (!response.ok || !response.body) {
        const details = await response.json().catch(() => null);
        throw new AiRequestError(details?.message || `La solicitud de IA falló (${response.status}).`, {
            status: response.status,
            code: details?.code,
            details
        });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let completedData = null;

    const consumeEvent = (block) => {
        let event = 'message';
        const dataLines = [];
        for (const line of block.split(/\r?\n/)) {
            if (line.startsWith(':')) continue;
            if (line.startsWith('event:')) event = line.slice(6).trim();
            if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (!dataLines.length) return;
        const payload = JSON.parse(dataLines.join('\n'));
        if (event === 'delta' && payload.text) onDelta(payload.text);
        if (event === 'tool') onTool(payload);
        if (event === 'tool_result') onToolResult(payload);
        if (event === 'done') completedData = payload.data;
        if (event === 'error') {
            throw new AiRequestError(payload.message || 'El streaming de IA fue interrumpido.', {
                code: payload.code || 'AI_STREAM_FAILED',
                details: payload
            });
        }
    };

    try {
        while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() || '';
            for (const block of blocks) consumeEvent(block);
            if (done) break;
        }
        if (buffer.trim()) consumeEvent(buffer);
    } catch (error) {
        if (error?.name === 'AbortError' || signal?.aborted) {
            return { aborted: true };
        }
        throw error;
    }

    if (!completedData) {
        if (signal?.aborted) return { aborted: true };
        throw new AiRequestError('El stream terminó sin confirmación.', { code: 'INCOMPLETE_AI_STREAM' });
    }
    return completedData;
}
