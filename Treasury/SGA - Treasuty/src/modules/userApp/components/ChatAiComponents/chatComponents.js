import { LabelValue } from '../LabelValue';
import { TagIndicator } from '../TagIndicator';
import { ProgressBar } from '../ProgressBar';
import { OutstandingAnalyticCard } from '../OutstandingAnalyticCard';
import { NormalCard } from '../NormalCard';
import { ActionButton } from './ActionButton';
import { CapsuleButtonAi } from './CapsuleButtonAi';

/**
 * Catálogo de componentes que el agente puede pedir que se rendericen.
 *
 * Dos reglas que no se saltan:
 *  1. Solo se renderiza lo que está en este mapa. Nunca un lookup libre sobre
 *     el nombre que mande el modelo.
 *  2. Cada prop pasa por un normalizador. Varios de estos componentes meten sus
 *     props en className o en style inline, así que un valor sin validar es una
 *     vía para inyectar clases o CSS arbitrario.
 *
 * Para exponer un componente nuevo: impórtalo, añade una entrada aquí con sus
 * props normalizadas, y descríbelo en las instrucciones del agente
 * (api/systemAI/agents/definitions/generalAssistant.agent.js).
 */

// --- Normalizadores ---

const label = (value, max = 160) => {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, max) : undefined;
};

const number = ({ min = -Infinity, max = Infinity } = {}) => value => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.min(Math.max(parsed, min), max);
};

const oneOf = allowed => value => (allowed.includes(value) ? value : undefined);

// Los patrones exigen string explícito: regex.test(undefined) compara contra
// la cadena "undefined" y daría por buenos valores que nadie envió.
const matches = (pattern, value) => typeof value === 'string' && pattern.test(value);

// El color entra a un style inline: solo se acepta un hex de 6 dígitos.
const hexColor = value => (matches(/^#[0-9a-fA-F]{6}$/, value) ? value : undefined);

// El id de la acción y sus params los valida el catálogo de acciones al
// renderizar: aquí solo se comprueba la forma.
const actionId = value => (typeof value === 'string' ? value : undefined);
const plainObject = value => (
    value && typeof value === 'object' && !Array.isArray(value) ? value : undefined
);

// El modelo manda el nombre del icono, nunca JSX ni una clase completa.
// Se valida aquí y ComponentMessage lo convierte en elemento al renderizar.
const iconName = value => (matches(/^[a-z0-9-]{1,40}$/, value) ? value : undefined);

// --- Catálogo ---

export const CHAT_COMPONENTS = Object.freeze({
    LabelValue: {
        component: LabelValue,
        props: { title: label, value: label }
    },
    TagIndicator: {
        component: TagIndicator,
        props: {
            title: label,
            desc: label,
            // Construye la clase `${type}_color`: solo los tipos con CSS real.
            type: oneOf(['active', 'category', 'disabled', 'indicator', 'suspended'])
        }
    },
    ProgressBar: {
        component: ProgressBar,
        props: { progress: number({ min: 0, max: 100 }) }
    },
    Button:{
        component:CapsuleButtonAi,
        props:{ onClick: ()=>{
            alert('Doc type y ownSerial')
        } }
    },
    OutstandingAnalyticCard: {
        component: OutstandingAnalyticCard,
        props: {
            title: label,
            value: label,
            description: label,
            color: hexColor,
            icon: iconName
        }
    },
    NormalCard: {
        component: NormalCard,
        props: { title: label, description: label, onlyTitle: oneOf([true, false]) }
    },
    ActionButton: {
        component: ActionButton,
        props: { action: actionId, params: plainObject }
    }
});

/**
 * Descarta el componente si no está en el catálogo y cualquier prop que no esté
 * declarada o que no supere su normalizador.
 */
export const resolveChatComponent = entry => {
    const componentName = entry?.component;
    // hasOwn y no acceso directo: CHAT_COMPONENTS['constructor'] devolvería un
    // valor heredado de Object.prototype y pasaría por bueno.
    if (typeof componentName !== 'string' || !Object.hasOwn(CHAT_COMPONENTS, componentName)) return null;
    const definition = CHAT_COMPONENTS[componentName];

    const props = {};
    for (const [name, normalize] of Object.entries(definition.props)) {
        const value = normalize(entry?.props?.[name]);
        if (value !== undefined) props[name] = value;
    }
    return { Component: definition.component, props, iconName: props.icon };
};
