import systemAIConfig from '../config/systemAIConfig.js';
import SystemAIError from '../core/errors/SystemAIError.js';
import OpenRouterProvider from './openrouter/OpenRouterProvider.js';

let providerInstance;

export const getModelProvider = () => {
    if (providerInstance) return providerInstance;

    if (systemAIConfig.provider === 'openrouter') {
        providerInstance = new OpenRouterProvider({
            ...systemAIConfig.openRouter,
            timeoutMs: systemAIConfig.requestTimeoutMs
        });
        return providerInstance;
    }

    throw new SystemAIError(`Proveedor de IA no soportado: ${systemAIConfig.provider}.`, {
        statusCode: 503,
        code: 'UNSUPPORTED_AI_PROVIDER'
    });
};

export const setModelProviderForTests = (provider) => {
    providerInstance = provider;
};
