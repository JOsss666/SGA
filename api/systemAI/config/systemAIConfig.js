import 'dotenv/config';

const parsePositiveInteger = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parsePositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const systemAIConfig = Object.freeze({
    enabled: process.env.SYSTEM_AI_ENABLED === 'true',
    provider: process.env.SYSTEM_AI_PROVIDER || 'openrouter',
    defaultModel: process.env.SYSTEM_AI_DEFAULT_MODEL || 'openai/gpt-4.1-mini',
    maxInputCharacters: parsePositiveInteger(process.env.SYSTEM_AI_MAX_INPUT_CHARACTERS, 12000),
    maxOutputTokens: parsePositiveInteger(process.env.SYSTEM_AI_MAX_OUTPUT_TOKENS, 6000),
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

    return errors;
};

export default systemAIConfig;
