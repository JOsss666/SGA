import { postInfo } from './functions';

const fileToDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
        resolve({
            name: file.name,
            type: file.type || 'application/octet-stream',
            data: reader.result
        });
    };

    reader.onerror = () => {
        reject(new Error(`No se pudo leer el archivo "${file.name}".`));
    };

    reader.readAsDataURL(file);
});

const normalizeFiles = async ({ file, files }) => {
    const receivedFiles = files ?? (file ? [file] : []);
    const fileList = Array.from(receivedFiles);

    return Promise.all(fileList.map(currentFile => {
        if (currentFile instanceof File) {
            return fileToDataUrl(currentFile);
        }

        if (currentFile?.file instanceof File) {
            return fileToDataUrl(currentFile.file);
        }

        if (currentFile?.name && currentFile?.data) {
            return currentFile;
        }

        if (typeof currentFile === 'string') {
            return {
                name: currentFile.split('/').pop()?.split('?')[0] || 'document',
                data: currentFile
            };
        }

        if (currentFile?.url) {
            return {
                name: currentFile.name
                    || currentFile.url.split('/').pop()?.split('?')[0]
                    || `document-${currentFile.id ?? Date.now()}`,
                type: currentFile.type,
                data: currentFile.url
            };
        }

        throw new Error(
            'Cada archivo debe ser File, una URL o un objeto { name, data } / { url }.'
        );
    }));
};

const parseJsonResponse = content => {
    if (typeof content !== 'string') return content;

    const normalizedContent = content
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');

    return JSON.parse(normalizedContent);
};

/**
 * Ejecuta una tarea aislada con IA sin usar el contexto ni las restricciones
 * del chat general.
 *
 * @param {object} options
 * @param {string} options.masterPrompt Instrucción de sistema para la tarea.
 * @param {string} options.prompt Solicitud concreta que debe ejecutar el modelo.
 * @param {File|object} [options.file] Archivo único.
 * @param {File[]|object[]} [options.files] Múltiples archivos.
 * @param {'text'|'json'|'json_schema'} [options.responseType='text']
 * @param {string} [options.responseInstructions] Forma esperada de la respuesta.
 * @param {object} [options.jsonSchema] JSON Schema exigido al modelo.
 * @param {string} [options.schemaName='custom_ai_response']
 * @param {string} [options.model='openai/gpt-4o-mini']
 * @param {number} [options.temperature=0.1]
 * @param {number} [options.maxTokens]
 */
export async function runAiTask({
    masterPrompt,
    prompt,
    file,
    files,
    responseType = 'text',
    responseInstructions = '',
    jsonSchema,
    schemaName = 'custom_ai_response',
    model = 'openai/gpt-4o-mini',
    temperature = 0.1,
    maxTokens
}) {
    if (!masterPrompt?.trim()) {
        throw new Error('masterPrompt es requerido.');
    }

    if (!prompt?.trim()) {
        throw new Error('prompt es requerido.');
    }

    if (responseType === 'json_schema' && !jsonSchema) {
        throw new Error('jsonSchema es requerido cuando responseType es "json_schema".');
    }

    const normalizedFiles = await normalizeFiles({ file, files });
    const response = await postInfo('/processCustomAiRequest', {
        masterPrompt,
        prompt,
        files: normalizedFiles,
        responseType,
        responseInstructions,
        jsonSchema,
        schemaName,
        model,
        temperature,
        maxTokens
    });

    if (!response?.ok) {
        throw new Error(response?.error || 'La tarea de IA no pudo completarse.');
    }

    const shouldParseJson = responseType === 'json'
        || responseType === 'json_schema';

    return {
        ...response,
        data: shouldParseJson
            ? parseJsonResponse(response.content)
            : response.content
    };
}

export const documentToJson = options => runAiTask({
    responseType: 'json',
    temperature: 0,
    ...options
});
