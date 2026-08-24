import 'dotenv/config';

const parsePositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const defaultModel = process.env.SYSTEM_AI_DEFAULT_MODEL || 'openai/gpt-4.1-mini';

// Cada tier apunta a un modelo configurable por entorno. Sin configuración
// explícita todos caen al modelo por defecto, así el selector del chat nunca
// rompe un despliegue existente.
const modelTiers = Object.freeze({
    'low-consume': process.env.SYSTEM_AI_MODEL_TIER_LOW_CONSUME || defaultModel,
    fast: process.env.SYSTEM_AI_MODEL_TIER_FAST || defaultModel,
    think: process.env.SYSTEM_AI_MODEL_TIER_THINK || defaultModel,
    pro: process.env.SYSTEM_AI_MODEL_TIER_PRO || defaultModel
});

// Instrucciones fijas definidas en el servidor. El cliente solo envía la clave,
// nunca el texto, para que no se pueda inyectar contexto arbitrario.
const modeInstructions = Object.freeze({
    creation: 'El usuario está en modo Creación: prioriza redactar, proponer y estructurar contenido nuevo a partir de los datos disponibles.',
    analysis: 'El usuario está en modo Análisis: prioriza interpretar cifras, comparar periodos y explicar tendencias, señalando siempre de qué datos partes.',
    search: 'El usuario está en modo Búsqueda: prioriza localizar registros concretos y responder con datos puntuales y verificables, sin elaborar de más.',
    action: 'El usuario está en modo Acciones: prioriza indicar los pasos concretos a seguir dentro de SGA. No afirmes haber ejecutado nada que no hayas ejecutado realmente.'
});

const systemAIConfig = Object.freeze({
    enabled: process.env.SYSTEM_AI_ENABLED === 'true',
    provider: process.env.SYSTEM_AI_PROVIDER || 'openrouter',
    defaultModel,
    modelTiers,
    modeInstructions,
    maxInputCharacters: parsePositiveInteger(process.env.SYSTEM_AI_MAX_INPUT_CHARACTERS, 12000),
    maxOutputTokens: parsePositiveInteger(process.env.SYSTEM_AI_MAX_OUTPUT_TOKENS, 6000),
    maxHistoryMessages: parsePositiveInteger(process.env.SYSTEM_AI_MAX_HISTORY_MESSAGES, 12),
    maxHistoryCharacters: parsePositiveInteger(process.env.SYSTEM_AI_MAX_HISTORY_CHARACTERS, 20000),
    requestTimeoutMs: parsePositiveInteger(process.env.SYSTEM_AI_REQUEST_TIMEOUT_MS, 60000),
    requestsPerMinute: parsePositiveInteger(process.env.SYSTEM_AI_REQUESTS_PER_MINUTE, 20),
    maxCostPerRun: parsePositiveNumber(process.env.SYSTEM_AI_MAX_COST_PER_RUN, 0.10),
    openRouter: Object.freeze({
        apiKey: process.env.OPENROUTER_API_KEY || '',
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        appUrl: process.env.OPENROUTER_APP_URL || '',
        appName: process.env.OPENROUTER_APP_NAME || 'SGA360'
    })
});

export const validateSystemAIConfig = () => {
    const errors = [];

    if (!systemAIConfig.enabled) errors.push('SYSTEM_AI_ENABLED debe ser true.');
    if (systemAIConfig.provider === 'openrouter' && !systemAIConfig.openRouter.apiKey) {
        errors.push('OPENROUTER_API_KEY no está configurada.');
    }
    for (const [tier, model] of Object.entries(systemAIConfig.modelTiers)) {
        if (typeof model !== 'string' || !model.trim()) {
            errors.push(`El tier ${tier} no tiene un modelo configurado.`);
        }
    }

    return errors;
};

export default systemAIConfig;
