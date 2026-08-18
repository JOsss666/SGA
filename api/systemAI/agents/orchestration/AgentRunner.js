import systemAIConfig from '../../config/systemAIConfig.js';
import SystemAIError from '../../core/errors/SystemAIError.js';
import toolRegistry from '../../tools/ToolRegistry.js';
import ToolExecutor from '../../tools/ToolExecutor.js';

class AgentRunner {
    constructor({ agentRegistry, provider, tools = toolRegistry, toolExecutor = new ToolExecutor() }) {
        this.agentRegistry = agentRegistry;
        this.provider = provider;
        this.tools = tools;
        this.toolExecutor = toolExecutor;
    }

    async run({ agentId, input, context }) {
        const agent = this.agentRegistry.get(agentId);
        const startedAt = Date.now();

        const availableTools = this.tools.resolve(agent.tools || []);
        const toolsByFunctionName = new Map(
            availableTools.map(tool => [tool.definition.function.name, tool])
        );
        const messages = [{ role: 'user', content: input }];
        const maxSteps = Math.max(1, agent.limits?.maxSteps || 1);
        let result;

        for (let step = 0; step < maxSteps; step += 1) {
            result = await this.provider.generate({
                model: agent.model || systemAIConfig.defaultModel,
                instructions: agent.instructions,
                input,
                messages,
                tools: availableTools.map(tool => tool.definition),
                outputSchema: agent.outputSchema,
                documentProcessing: agent.documentProcessing,
                maxOutputTokens: Math.min(
                    agent.limits?.maxOutputTokens || systemAIConfig.maxOutputTokens,
                    systemAIConfig.maxOutputTokens
                ),
                metadata: {
                    agentId,
                    companyId: context.companyId,
                    userId: context.userId,
                    requestId: context.requestId
                }
            });

            if (!result.toolCalls?.length) break;
            if (step === maxSteps - 1) {
                throw new SystemAIError('El agente excedió el número máximo de pasos.', {
                    statusCode: 422,
                    code: 'AI_MAX_STEPS_EXCEEDED'
                });
            }

            messages.push(result.assistantMessage);
            for (const toolCall of result.toolCalls) {
                const tool = toolsByFunctionName.get(toolCall?.function?.name);
                if (!tool) {
                    throw new SystemAIError('El modelo solicitó una tool no autorizada para este agente.', {
                        statusCode: 403,
                        code: 'AI_TOOL_NOT_ALLOWED'
                    });
                }

                let args;
                try {
                    args = JSON.parse(toolCall.function.arguments || '{}');
                } catch {
                    throw new SystemAIError('El modelo produjo argumentos inválidos para la tool.', {
                        statusCode: 400,
                        code: 'INVALID_TOOL_ARGUMENTS'
                    });
                }

                const toolResult = await this.toolExecutor.execute({ tool, arguments: args, context });
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }
        }

        const cost = Number(result.usage?.cost ?? 0);
        if (Number.isFinite(cost) && cost > systemAIConfig.maxCostPerRun) {
            console.warn(`Ejecución ${context.requestId} superó el costo configurado: ${cost}.`);
        }

        if (!result?.output) {
            throw new SystemAIError('El agente no produjo una respuesta.', {
                statusCode: 502,
                code: 'EMPTY_AGENT_OUTPUT'
            });
        }

        return {
            agent: { id: agent.id, name: agent.name, version: agent.version },
            output: result.output,
            model: result.model,
            provider: result.provider,
            response_id: result.responseId,
            usage: result.usage,
            duration_ms: Date.now() - startedAt,
            request_id: context.requestId
        };
    }

    async runStream({ agentId, input, context, onDelta }) {
        const agent = this.agentRegistry.get(agentId);
        const startedAt = Date.now();
        const availableTools = this.tools.resolve(agent.tools || []);
        const toolsByFunctionName = new Map(
            availableTools.map(tool => [tool.definition.function.name, tool])
        );
        const messages = [{ role: 'user', content: input }];
        const maxSteps = Math.max(1, agent.limits?.maxSteps || 1);
        let result;

        for (let step = 0; step < maxSteps; step += 1) {
            result = await this.provider.generateStream({
                model: agent.model || systemAIConfig.defaultModel,
                instructions: agent.instructions,
                input,
                messages,
                tools: availableTools.map(tool => tool.definition),
                maxOutputTokens: Math.min(
                    agent.limits?.maxOutputTokens || systemAIConfig.maxOutputTokens,
                    systemAIConfig.maxOutputTokens
                ),
                metadata: {
                    agentId,
                    companyId: context.companyId,
                    userId: context.userId,
                    requestId: context.requestId
                },
                onDelta
            });

            if (!result.toolCalls?.length) break;
            if (step === maxSteps - 1) {
                throw new SystemAIError('El agente excedió el número máximo de pasos.', {
                    statusCode: 422,
                    code: 'AI_MAX_STEPS_EXCEEDED'
                });
            }

            messages.push(result.assistantMessage);
            for (const toolCall of result.toolCalls) {
                const tool = toolsByFunctionName.get(toolCall?.function?.name);
                if (!tool) {
                    throw new SystemAIError('El modelo solicitó una tool no autorizada para este agente.', {
                        statusCode: 403,
                        code: 'AI_TOOL_NOT_ALLOWED'
                    });
                }
                let args;
                try {
                    args = JSON.parse(toolCall.function.arguments || '{}');
                } catch {
                    throw new SystemAIError('El modelo produjo argumentos inválidos para la tool.', {
                        statusCode: 400,
                        code: 'INVALID_TOOL_ARGUMENTS'
                    });
                }
                const toolResult = await this.toolExecutor.execute({ tool, arguments: args, context });
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                });
            }
        }

        if (!result?.output) {
            throw new SystemAIError('El agente no produjo una respuesta.', {
                statusCode: 502,
                code: 'EMPTY_AGENT_OUTPUT'
            });
        }
        return {
            agent: { id: agent.id, name: agent.name, version: agent.version },
            output: result.output,
            model: result.model,
            provider: result.provider,
            response_id: result.responseId,
            usage: result.usage,
            duration_ms: Date.now() - startedAt,
            request_id: context.requestId
        };
    }
}

export default AgentRunner;
