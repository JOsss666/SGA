import ModelProvider from '../../core/contracts/ModelProvider.js';
import SystemAIError from '../../core/errors/SystemAIError.js';

class OpenRouterProvider extends ModelProvider {
    constructor({ apiKey, baseUrl, appUrl, appName, timeoutMs }) {
        super();
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.appUrl = appUrl;
        this.appName = appName;
        this.timeoutMs = timeoutMs;
    }

    async generate({ model, instructions, input, messages, tools = [], outputSchema, documentProcessing, maxOutputTokens, metadata = {} }) {
        if (!this.apiKey) {
            throw new SystemAIError('OpenRouter no está configurado.', {
                statusCode: 503,
                code: 'AI_PROVIDER_NOT_CONFIGURED'
            });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    ...(this.appUrl ? { 'HTTP-Referer': this.appUrl } : {}),
                    ...(this.appName ? { 'X-OpenRouter-Title': this.appName } : {})
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: instructions },
                        ...(messages || [{ role: 'user', content: input }])
                    ],
                    max_tokens: maxOutputTokens,
                    ...(tools.length ? { tools, tool_choice: 'auto' } : {}),
                    ...(outputSchema ? {
                        response_format: {
                            type: 'json_schema',
                            json_schema: outputSchema
                        },
                        provider: { require_parameters: true }
                    } : {}),
                    ...(Array.isArray(input) && input.some(part => part.type === 'file') ? {
                        plugins: [{
                            id: 'file-parser',
                            pdf: { engine: documentProcessing?.pdfParserEngine || 'cloudflare-ai' }
                        }]
                    } : {}),
                    user: metadata.userId ? String(metadata.userId) : undefined,
                    usage: { include: true }
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new SystemAIError('El proveedor de IA rechazó la solicitud.', {
                    statusCode: response.status >= 500 ? 502 : 400,
                    code: 'AI_PROVIDER_REQUEST_FAILED',
                    details: { providerStatus: response.status, providerCode: payload?.error?.code }
                });
            }

            const assistantMessage = payload?.choices?.[0]?.message;
            const toolCalls = Array.isArray(assistantMessage?.tool_calls) ? assistantMessage.tool_calls : [];
            const output = assistantMessage?.content;
            if (typeof output !== 'string' && toolCalls.length === 0) {
                throw new SystemAIError('El proveedor devolvió una respuesta sin contenido.', {
                    statusCode: 502,
                    code: 'INVALID_AI_PROVIDER_RESPONSE'
                });
            }

            let parsedOutput = output || '';
            if (outputSchema && !toolCalls.length) {
                try {
                    parsedOutput = JSON.parse(output);
                } catch {
                    throw new SystemAIError('El proveedor devolvió una extracción con formato inválido.', {
                        statusCode: 502,
                        code: 'INVALID_STRUCTURED_AI_RESPONSE'
                    });
                }
            }

            return {
                output: parsedOutput,
                toolCalls,
                assistantMessage,
                model: payload.model || model,
                provider: 'openrouter',
                responseId: payload.id || null,
                usage: payload.usage || null
            };
        } catch (error) {
            if (error instanceof SystemAIError) throw error;
            if (error?.name === 'AbortError') {
                throw new SystemAIError('La solicitud al proveedor de IA excedió el tiempo límite.', {
                    statusCode: 504,
                    code: 'AI_PROVIDER_TIMEOUT'
                });
            }
            throw new SystemAIError('No fue posible conectar con el proveedor de IA.', {
                statusCode: 502,
                code: 'AI_PROVIDER_UNAVAILABLE'
            });
        } finally {
            clearTimeout(timeout);
        }
    }

    async generateStream({ model, instructions, input, messages, tools = [], maxOutputTokens, metadata = {}, onDelta = () => {} }) {
        if (!this.apiKey) {
            throw new SystemAIError('OpenRouter no está configurado.', {
                statusCode: 503,
                code: 'AI_PROVIDER_NOT_CONFIGURED'
            });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    ...(this.appUrl ? { 'HTTP-Referer': this.appUrl } : {}),
                    ...(this.appName ? { 'X-OpenRouter-Title': this.appName } : {})
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: instructions },
                        ...(messages || [{ role: 'user', content: input }])
                    ],
                    max_tokens: maxOutputTokens,
                    stream: true,
                    stream_options: { include_usage: true },
                    ...(tools.length ? { tools, tool_choice: 'auto' } : {}),
                    user: metadata.userId ? String(metadata.userId) : undefined
                })
            });

            if (!response.ok || !response.body) {
                const payload = await response.json().catch(() => ({}));
                throw new SystemAIError('El proveedor de IA rechazó la solicitud.', {
                    statusCode: response.status >= 500 ? 502 : 400,
                    code: 'AI_PROVIDER_REQUEST_FAILED',
                    details: { providerStatus: response.status, providerCode: payload?.error?.code }
                });
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let output = '';
            let responseId = null;
            let responseModel = model;
            let usage = null;
            const toolCalls = [];

            const consumeLine = async line => {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) return;
                const data = trimmed.slice(5).trim();
                if (!data || data === '[DONE]') return;
                let payload;
                try {
                    payload = JSON.parse(data);
                } catch {
                    return;
                }
                if (payload.error) {
                    throw new SystemAIError('OpenRouter interrumpió la respuesta.', {
                        statusCode: 502,
                        code: 'AI_PROVIDER_STREAM_FAILED',
                        details: { providerCode: payload.error.code }
                    });
                }
                responseId = payload.id || responseId;
                responseModel = payload.model || responseModel;
                usage = payload.usage || usage;
                const delta = payload?.choices?.[0]?.delta;
                if (typeof delta?.content === 'string' && delta.content) {
                    output += delta.content;
                    await onDelta(delta.content);
                }
                for (const callDelta of delta?.tool_calls || []) {
                    const index = callDelta.index ?? 0;
                    toolCalls[index] ||= { id: '', type: 'function', function: { name: '', arguments: '' } };
                    if (callDelta.id) toolCalls[index].id += callDelta.id;
                    if (callDelta.type) toolCalls[index].type = callDelta.type;
                    if (callDelta.function?.name) toolCalls[index].function.name += callDelta.function.name;
                    if (callDelta.function?.arguments) toolCalls[index].function.arguments += callDelta.function.arguments;
                }
            };

            for await (const chunk of response.body) {
                buffer += decoder.decode(chunk, { stream: true });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || '';
                for (const line of lines) await consumeLine(line);
            }
            buffer += decoder.decode();
            if (buffer) await consumeLine(buffer);

            const assistantMessage = {
                role: 'assistant',
                content: output || null,
                ...(toolCalls.length ? { tool_calls: toolCalls } : {})
            };
            return {
                output,
                toolCalls,
                assistantMessage,
                model: responseModel,
                provider: 'openrouter',
                responseId,
                usage
            };
        } catch (error) {
            if (error instanceof SystemAIError) throw error;
            if (error?.name === 'AbortError') {
                throw new SystemAIError('La respuesta del proveedor excedió el tiempo límite.', {
                    statusCode: 504,
                    code: 'AI_PROVIDER_TIMEOUT'
                });
            }
            throw new SystemAIError('No fue posible mantener el streaming con el proveedor.', {
                statusCode: 502,
                code: 'AI_PROVIDER_UNAVAILABLE'
            });
        } finally {
            clearTimeout(timeout);
        }
    }
}

export default OpenRouterProvider;
