// El agente tiene instrucción de cerrar cada respuesta con "CC__(company_id)"
// y el agente utilizado. Es una marca de depuración: se conserva en el backend
// pero no se le muestra al usuario. El id real de la empresa y el modelo
// llegan en el payload `done` del stream.
export const stripAgentDebugMarker = text => (
    typeof text === 'string' ? text.replace(/\n*\s*CC__.*$/s, '') : text
);

const CHART_TYPES = ['bar', 'line', 'area', 'stat'];

// Pista barata para no intentar parsear cualquier llave suelta del texto.
const looksLikeSpec = fragment => (
    /"component"\s*:/.test(fragment) || /"type"\s*:\s*"(bar|line|area|stat)"/.test(fragment)
);

const isComponentSpec = value => (
    (value && typeof value === 'object' && typeof value.component === 'string')
    || (Array.isArray(value) && value.length > 0
        && value.every(item => item && typeof item === 'object' && typeof item.component === 'string'))
);

const isChartSpec = value => (
    value && typeof value === 'object' && !Array.isArray(value)
    && CHART_TYPES.includes(value.type)
);

/**
 * Recorre desde `start` hasta la llave de cierre equilibrada, respetando las
 * comillas y los escapes. Devuelve -1 si el JSON aún está incompleto, que es lo
 * normal mientras el mensaje se está transmitiendo.
 */
const findBalancedEnd = (text, start) => {
    const open = text[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
        const character = text[index];
        if (escaped) { escaped = false; continue; }
        if (character === '\\') { escaped = true; continue; }
        if (character === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (character === open) depth += 1;
        else if (character === close) {
            depth -= 1;
            if (depth === 0) return index;
        }
    }
    return -1;
};

const fence = (language, body) => `\n\n\`\`\`${language}\n${body}\n\`\`\`\n\n`;

const normalizeSegment = segment => {
    let result = '';
    let cursor = 0;

    while (cursor < segment.length) {
        // Solo se consideran llaves que abren una línea: así no se toca un
        // ejemplo de JSON citado dentro de una frase.
        const match = /(^|\n)[ \t]*[{[]/.exec(segment.slice(cursor));
        if (!match) break;

        const openIndex = cursor + match.index + match[0].length - 1;
        const end = findBalancedEnd(segment, openIndex);
        const fragment = segment.slice(openIndex, end === -1 ? undefined : end + 1);

        if (!looksLikeSpec(fragment)) {
            result += segment.slice(cursor, openIndex + 1);
            cursor = openIndex + 1;
            continue;
        }

        result += segment.slice(cursor, openIndex);

        if (end === -1) {
            // Spec a medio llegar: se encierra igual para que se vea el
            // marcador de "preparando" en lugar del JSON crudo.
            result += fence('component', fragment);
            return result;
        }

        let parsed;
        try { parsed = JSON.parse(fragment); } catch { parsed = undefined; }

        if (isComponentSpec(parsed)) result += fence('component', fragment);
        else if (isChartSpec(parsed)) result += fence('chart', fragment);
        else result += fragment;

        cursor = end + 1;
    }

    return result + segment.slice(cursor);
};

/**
 * El modelo no siempre encierra el spec en un bloque de código, y entonces se
 * vería el JSON crudo en el chat. Aquí se detecta un spec suelto y se envuelve
 * en su bloque, de modo que el renderizador lo trate igual que si el modelo lo
 * hubiera formateado bien. Lo que ya viene en un bloque no se toca.
 */
export const normalizeAgentBlocks = text => {
    if (typeof text !== 'string' || !looksLikeSpec(text)) return text;

    // Se parte por bloques cercados para no reprocesar lo que ya está bien.
    const parts = text.split(/(```[\s\S]*?```|```[\s\S]*$)/);
    return parts
        .map(part => (part.startsWith('```') ? part : normalizeSegment(part)))
        .join('');
};
