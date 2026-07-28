
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function send_API_AI(prompt,userInfo,attached) {
    try {
        const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-4o-mini", // puedes cambiar a cualquier modelo soportado
            messages: [
            { role: "system", content: `
                Eres un asistente de una APP de gestion Administrativa
                y respondes a un usuario con el nombre ${userInfo.user_name}. de forma amable
                Responde SIEMPRE y unicamente en formato JSON sin información adicional basandote en esta estructura:
                    [
                        {type:"MainTitle",content:"..."},
                        {type:"SubTitle",content:"..."},
                        {type:"TextPlain",content"..."}
                    ]
                IMPORTANTE no coloques texto afuera del formato ej:json porque no sirve el parse,
                puedes crear multiples Subtitle y textPlain si es necesario lo importante es que se
                solucione la dua.
                ` },
            { role: "user", content: prompt },
            ...(attached
            ? [{
                role: "user",
                content: `Adjunto la siguiente información:\n\n${JSON.stringify(attached)}`
            }]
            : [])
            ]
        },
        {
            headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            // Opcional: para mostrar tu app en el panel de OpenRouter
            "HTTP-Referer": "https://tusitio.com",
            "X-Title": "Mi App con OpenRouter"
            }
        }
        );
        console.log(response.data.choices[0].message.content);
        return([true,response.data.choices[0].message.content])
    } catch (error) {
        console.error("Error en la petición:", error.response?.data || error.message);
        return([false,''])
    }
}

const buildCustomResponseFormat = (responseType, jsonSchema, schemaName) => {
    if (responseType === 'json_schema' && jsonSchema) {
        return {
            type: 'json_schema',
            json_schema: {
                name: schemaName || 'custom_ai_response',
                strict: true,
                schema: jsonSchema
            }
        };
    }

    if (responseType === 'json') {
        return { type: 'json_object' };
    }

    return undefined;
};

const remoteFileToDataUrl = async file => {
    if (!/^https?:\/\//i.test(file.data)) return file;

    try {
        const response = await axios.get(file.data, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: 20 * 1024 * 1024
        });
        const contentType = file.type
            || response.headers['content-type']?.split(';')[0]
            || 'application/octet-stream';

        return {
            ...file,
            type: contentType,
            data: `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`
        };
    } catch (error) {
        const status = error.response?.status;
        throw new Error(
            `No se pudo descargar "${file.name}" desde su URL`
            + `${status ? ` (HTTP ${status})` : ''}: ${error.message}`
        );
    }
};

export async function sendCustom_API_AI({
    masterPrompt,
    prompt,
    files = [],
    responseType = 'text',
    responseInstructions = '',
    jsonSchema,
    schemaName,
    model = 'openai/gpt-4o-mini',
    temperature = 0.1,
    maxTokens
}) {
    try {
        const preparedFiles = await Promise.all(
            files.map(remoteFileToDataUrl)
        );
        const content = [
            {
                type: 'text',
                text: [
                    prompt,
                    responseInstructions
                        ? `Formato e instrucciones de respuesta:\n${responseInstructions}`
                        : ''
                ].filter(Boolean).join('\n\n')
            },
            ...preparedFiles.map(file => {
                const isImage = file.type?.startsWith('image/')
                    || /^data:image\//i.test(file.data)
                    || /\.(png|jpe?g|webp|gif)(?:\?.*)?$/i.test(file.data);

                if (isImage) {
                    return {
                        type: 'image_url',
                        image_url: { url: file.data }
                    };
                }

                return {
                    type: 'file',
                    file: {
                        filename: file.name,
                        file_data: file.data
                    }
                };
            })
        ];

        const responseFormat = buildCustomResponseFormat(
            responseType,
            jsonSchema,
            schemaName
        );

        const requestBody = {
            model,
            messages: [
                { role: 'system', content: masterPrompt },
                { role: 'user', content }
            ],
            temperature,
            ...(preparedFiles.some(file => file.type === 'application/pdf')
                ? {
                    plugins: [
                        {
                            id: 'file-parser',
                            pdf: { engine: 'cloudflare-ai' }
                        },
                        ...(responseType === 'json' || responseType === 'json_schema'
                            ? [{ id: 'response-healing' }]
                            : [])
                    ]
                }
                : {}),
            ...(maxTokens ? { max_tokens: maxTokens } : {}),
            ...(responseFormat ? { response_format: responseFormat } : {})
        };

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://tusitio.com',
                    'X-Title': process.env.OPENROUTER_APP_NAME || 'SGA',
                    'X-OpenRouter-Metadata': 'enabled'
                },
                timeout: 120000,
                maxBodyLength: Infinity
            }
        );

        const message = response.data?.choices?.[0]?.message;

        return {
            ok: true,
            content: message?.content ?? '',
            annotations: message?.annotations ?? [],
            usage: response.data?.usage ?? null,
            model: response.data?.model ?? model
        };
    } catch (error) {
        const responseHeaders = error.response?.headers ?? {};
        const providerError = error.response?.data?.error
            ?? error.response?.data
            ?? null;
        const diagnostic = {
            message: error.message,
            axiosCode: error.code ?? null,
            httpStatus: error.response?.status ?? null,
            httpStatusText: error.response?.statusText ?? null,
            requestId: responseHeaders['x-request-id']
                ?? responseHeaders['x-openrouter-request-id']
                ?? responseHeaders['cf-ray']
                ?? null,
            providerError
        };

        console.error(
            'Error detallado en la tarea personalizada de IA:\n',
            JSON.stringify(diagnostic, null, 2)
        );

        return {
            ok: false,
            error: providerError?.message
                || error.response?.data?.message
                || error.message,
            details: diagnostic
        };
    }
}
