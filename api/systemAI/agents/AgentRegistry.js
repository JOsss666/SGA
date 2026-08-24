import generalAssistantAgent from './definitions/generalAssistant.agent.js';
import documentReaderAgent from './definitions/documentReader.agent.js';
import SystemAIError from '../core/errors/SystemAIError.js';

const validateAgentDefinition = (agent) => {
    const requiredStrings = ['id', 'name', 'description', 'version', 'instructions'];
    for (const property of requiredStrings) {
        if (typeof agent?.[property] !== 'string' || !agent[property].trim()) {
            throw new SystemAIError(`La definición del agente requiere ${property}.`, {
                statusCode: 500,
                code: 'INVALID_AGENT_DEFINITION'
            });
        }
    }

    if (!Array.isArray(agent.skills) || !Array.isArray(agent.tools)) {
        throw new SystemAIError('skills y tools deben ser arreglos.', {
            statusCode: 500,
            code: 'INVALID_AGENT_DEFINITION'
        });
    }
};

class AgentRegistry {
    constructor(initialAgents = []) {
        this.agents = new Map();
        initialAgents.forEach(agent => this.register(agent));
    }

    register(agent) {
        validateAgentDefinition(agent);
        if (this.agents.has(agent.id)) {
            throw new SystemAIError(`El agente ${agent.id} ya está registrado.`, {
                statusCode: 500,
                code: 'DUPLICATE_AGENT'
            });
        }

        this.agents.set(agent.id, Object.freeze({ ...agent }));
    }

    get(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent || !agent.enabled) {
            throw new SystemAIError('El agente solicitado no existe o está deshabilitado.', {
                statusCode: 404,
                code: 'AGENT_NOT_FOUND'
            });
        }
        return agent;
    }

    list() {
        return [...this.agents.values()]
            .filter(agent => agent.enabled)
            .map(({ instructions, outputSchema, ...publicAgent }) => publicAgent);
    }
}

const agentRegistry = new AgentRegistry([generalAssistantAgent, documentReaderAgent]);

export { AgentRegistry };
export default agentRegistry;
