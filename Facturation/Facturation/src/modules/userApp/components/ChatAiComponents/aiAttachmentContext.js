const ARRAY_LIMITS = [200, 100, 50, 25, 10, 5, 2, 1];
const MAX_OBJECT_KEYS = 80;
const MAX_STRING_CHARACTERS = 1200;
const MAX_NESTING_DEPTH = 7;

const compactValue = (value, arrayLimit, depth = 0) => {
    if (value == null || typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value.length > MAX_STRING_CHARACTERS
            ? `${value.slice(0, MAX_STRING_CHARACTERS)}… [texto recortado]`
            : value;
    }
    if (depth >= MAX_NESTING_DEPTH) return '[contenido anidado omitido]';
    if (Array.isArray(value)) {
        const compacted = value
            .slice(0, arrayLimit)
            .map(item => compactValue(item, arrayLimit, depth + 1));
        if (value.length > arrayLimit) {
            compacted.push({
                _nota: `${value.length - arrayLimit} registros adicionales omitidos por límite de contexto`,
                _total_registros: value.length
            });
        }
        return compacted;
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value);
        const compacted = Object.fromEntries(
            entries
                .slice(0, MAX_OBJECT_KEYS)
                .map(([key, item]) => [key, compactValue(item, arrayLimit, depth + 1)])
        );
        if (entries.length > MAX_OBJECT_KEYS) {
            compacted._campos_omitidos = entries.length - MAX_OBJECT_KEYS;
        }
        return compacted;
    }
    return String(value);
};

const normalizeAttachment = (attachment, arrayLimit) => ({
    nombre:attachment.label || attachment.name,
    tipo:attachment.type,
    datos:compactValue(attachment.content, arrayLimit)
});

export const buildAiAttachmentContext = ({attachments, prompt, maxInputCharacters}) => {
    if (!attachments.length) return '';

    const prefix = '\n\nContexto adjunto por el usuario. Usa estos datos para responder; no solicites que se adjunten de nuevo:\n';
    const availableCharacters = maxInputCharacters - prompt.length - prefix.length;
    if (availableCharacters <= 0) return '';

    for (const arrayLimit of ARRAY_LIMITS) {
        const serialized = JSON.stringify(
            attachments.map(attachment => normalizeAttachment(attachment, arrayLimit))
        );
        if (serialized.length <= availableCharacters) return `${prefix}${serialized}`;
    }

    const summary = JSON.stringify(attachments.map(attachment => ({
        nombre:attachment.label || attachment.name,
        tipo:attachment.type,
        nota:'El contenido excede el límite disponible del modelo.'
    })));
    return summary.length <= availableCharacters ? `${prefix}${summary}` : '';
};
