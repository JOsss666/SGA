import agentRegistry from '../agents/AgentRegistry.js';
import AgentRunner from '../agents/orchestration/AgentRunner.js';
import systemAIConfig, { validateSystemAIConfig } from '../config/systemAIConfig.js';
import { getModelProvider } from '../providers/ModelProviderFactory.js';

const systemAIService = {
    health() {
        const configurationErrors = validateSystemAIConfig();
        return {
            enabled: systemAIConfig.enabled,
            ready: configurationErrors.length === 0,
            provider: systemAIConfig.provider,
            configured_agents: agentRegistry.list().length,
            configuration_errors: configurationErrors
        };
    },

    listAgents() {
        return agentRegistry.list();
    },

    async runAgent(data) {
        const runner = new AgentRunner({
            agentRegistry,
            provider: getModelProvider()
        });
        return runner.run(data);
    },

    async streamAgent(data, onDelta) {
        const runner = new AgentRunner({
            agentRegistry,
            provider: getModelProvider()
        });
        return runner.runStream({ ...data, onDelta });
    }
};

export default systemAIService;
