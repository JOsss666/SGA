import systemAIConfig from '../../config/systemAIConfig.js';
import SystemAIError from '../../core/errors/SystemAIError.js';
import toolRegistry from '../../tools/ToolRegistry.js';
import ToolExecutor from '../../tools/ToolExecutor.js';

const ACCUMULATED_USAGE_FIELDS = ['prompt_tokens', 'completion_tokens', 'total_tokens', 'cost'];

// Cada paso del agente reporta su propio consumo. Sumarlos evita que los
// tokens gastados en los pasos de tool-calling desaparezcan del total.
const mergeUsage = (accumulated, usage) => {
    if (!usage) return accumulated;
    const merged = { ...(accumulated || {}), ...usage };
    for (const field of ACCUMULATED_USAGE_FIELDS) {
        const previous = Number(accumulated?.[field] ?? 0);
        const current = Number(usage?.[field] ?? 0);
        if (Number.isFinite(previous) && Number.isFinite(current) && (previous || current)) {
            merged[field] = previous + current;
        }
    }
    return merged;
};

class AgentRunner {
    constructor({ agentRegistry, provider, tools = toolRegistry, toolExecutor = new ToolExecutor() }) {
        this.agentRegistry = agentRegistry;
        this.provider = provider;
        this.tools = tools;
        this.toolExecutor = toolExecutor;
    }

    resolveModel(agent, tier) {
        return systemAIConfig.modelTiers?.[tier] || agent.model || systemAIConfig.defaultModel;
    }

    resolveInstructions(agent, mode) {
        const modeInstruction = systemAIConfig.modeInstructions?.[mode];
        return modeInstruction ? `${agent.instructions}\n${modeInstruction}` : agent.instructions;
    }

    buildMessages(history, input) {
        return [...(history || []), { role: 'user', content: input }];
    }

    async executeToolCalls({ result, messages, toolsByFunctionName, context, onToolCall, onToolResult }) {
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

            await onToolCall?.({ name: toolCall.function.name, arguments: args });
            const toolResult = await this.toolExecutor.execute({ tool, arguments: args, context });
            await onToolResult?.({ name: toolCall.function.name, result: toolResult });

            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolResult)
            });
        }
    }

    async run({ agentId, input, history, tier, mode, context, signal, onToolCall, onToolResult }) {
        const agent = this.agentRegistry.get(agentId);
        const startedAt = Date.now();

        const availableTools = this.tools.resolve(agent.tools || []);
        const toolsByFunctionName = new Map(
            availableTools.map(tool => [tool.definition.function.name, tool])
        );
        const messages = this.buildMessages(history, input);
        const maxSteps = Math.max(1, agent.limits?.maxSteps || 1);
        let result;
        let usage = null;

        for (let step = 0; step < maxSteps; step += 1) {
            result = await this.provider.generate({
                model: this.resolveModel(agent, tier),
                instructions: this.resolveInstructions(agent, mode),
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
                },
                signal
            });
            usage = mergeUsage(usage, result.usage);

            if (!result.toolCalls?.length) break;
            if (step === maxSteps - 1) {
                throw new SystemAIError('El agente excedió el número máximo de pasos.', {
                    statusCode: 422,
                    code: 'AI_MAX_STEPS_EXCEEDED'
                });
            }

            await this.executeToolCalls({
                result,
                messages,
                toolsByFunctionName,
                context,
                onToolCall,
                onToolResult
            });
        }

        const cost = Number(usage?.cost ?? 0);
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
            usage,
            duration_ms: Date.now() - startedAt,
            request_id: context.requestId
        };
    }

    async runStream({ agentId, input, history, tier, mode, context, signal, onDelta, onToolCall, onToolResult }) {
        const agent = this.agentRegistry.get(agentId);
        const startedAt = Date.now();
        const availableTools = this.tools.resolve(agent.tools || []);
        const toolsByFunctionName = new Map(
            availableTools.map(tool => [tool.definition.function.name, tool])
        );
        const messages = this.buildMessages(history, input);
        const maxSteps = Math.max(1, agent.limits?.maxSteps || 1);
        let result;
        let usage = null;

        for (let step = 0; step < maxSteps; step += 1) {
            result = await this.provider.generateStream({
                model: this.resolveModel(agent, tier),
                instructions: this.resolveInstructions(agent, mode),
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
                signal,
                onDelta
            });
            usage = mergeUsage(usage, result.usage);

            if (!result.toolCalls?.length) break;
            if (step === maxSteps - 1) {
                throw new SystemAIError('El agente excedió el número máximo de pasos.', {
                    statusCode: 422,
                    code: 'AI_MAX_STEPS_EXCEEDED'
                });
            }

            await this.executeToolCalls({
                result,
                messages,
                toolsByFunctionName,
                context,
                onToolCall,
                onToolResult
            });
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
            usage,
            duration_ms: Date.now() - startedAt,
            request_id: context.requestId
        };
    }
}

export default AgentRunner;
