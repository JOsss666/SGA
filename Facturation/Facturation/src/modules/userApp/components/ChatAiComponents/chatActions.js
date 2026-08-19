/**
 * Catálogo de acciones que el agente puede ofrecer como botón.
 *
 * La regla que gobierna este archivo: el modelo elige la INTENCIÓN, la app
 * decide la ETIQUETA y el COMPORTAMIENTO. Si el modelo pudiera fijar el texto
 * del botón y la acción por separado, un prompt inyectado podría pintar un
 * "Ver factura" que en realidad dispara otra cosa. Aquí la etiqueta se deriva
 * de la acción, así que el botón nunca puede mentir sobre lo que hace.
 *
 * Para añadir una acción: declara sus params con su normalizador, la etiqueta
 * que le corresponde y su `run`, y descríbela en las instrucciones del agente.
 */

// Secciones navegables. El modelo solo puede nombrar una de estas claves: nunca
// una ruta ni una URL, que sería una vía de redirección abierta.
const SECTIONS = Object.freeze({
    '': 'Inicio',
    new: 'Crear documento',
    reports: 'Informes',
    analytics: 'Analítica',
    edocuments: 'Documentos electrónicos',
    thirdparties: 'Terceros',
    cashBoxes: 'Cajas',
    concepts: 'Conceptos e impuestos',
    users: 'Usuarios',
    settings: 'Configuración',
    quickActions: 'Acciones rápidas'
});

const oneOf = allowed => value => (allowed.includes(value) ? value : undefined);

const text = (value, max = 120) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, max) : undefined;
};

export const CHAT_ACTIONS = Object.freeze({
    goToSection: {
        icon: 'arrow-right',
        params: { section: oneOf(Object.keys(SECTIONS)) },
        required: ['section'],
        // La etiqueta la construye la app a partir de la sección validada.
        label: ({ section }) => `Ir a ${SECTIONS[section]}`,
        run: ({ section }, context) => context.navigate(section)
    },
    askAssistant: {
        icon: 'wand-magic-sparkles',
        params: { prompt: text },
        required: ['prompt'],
        // Aquí el texto sí viene del modelo, pero solo rellena el campo de
        // escritura: no ejecuta nada por su cuenta, lo envía el usuario.
        label: () => 'Continuar con esta pregunta',
        run: ({ prompt }, context) => context.fillPrompt(prompt)
    }
});

/**
 * Devuelve null si la acción no existe o si le falta algún parámetro
 * obligatorio; nunca lanza, para que un bloque mal formado no tumbe el mensaje.
 */
export const resolveChatAction = (actionId, rawParams) => {
    if (typeof actionId !== 'string' || !Object.hasOwn(CHAT_ACTIONS, actionId)) return null;
    const definition = CHAT_ACTIONS[actionId];

    const params = {};
    for (const [name, normalize] of Object.entries(definition.params)) {
        const value = normalize(rawParams?.[name]);
        if (value !== undefined) params[name] = value;
    }
    const missing = definition.required.filter(name => params[name] === undefined);
    if (missing.length) return null;

    return {
        label: definition.label(params),
        icon: definition.icon,
        run: context => definition.run(params, context)
    };
};
