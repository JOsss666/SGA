import test from 'node:test';
import assert from 'node:assert/strict';
import AgentRunner from '../../agents/orchestration/AgentRunner.js';
import { AgentRegistry } from '../../agents/AgentRegistry.js';

test('ejecuta un agente mediante un proveedor intercambiable', async () => {
    const registry = new AgentRegistry([{
        id: 'test-agent',
        name: 'Agente de prueba',
        description: 'Agente usado en pruebas.',
        version: '1.0.0',
        enabled: true,
        model: 'test/model',
        instructions: 'Instrucciones de prueba.',
        skills: [],
        tools: [],
        limits: { maxOutputTokens: 100 }
    }]);
    const provider = {
        async generate(request) {
            assert.equal(request.model, 'test/model');
            assert.equal(request.input, 'Hola');
            return {
                output: 'Respuesta',
                model: request.model,
                provider: 'fake',
                responseId: 'response-1',
                usage: { total_tokens: 2, cost: 0.001 }
            };
        }
    };
    const runner = new AgentRunner({ agentRegistry: registry, provider });

    const result = await runner.run({
        agentId: 'test-agent',
        input: 'Hola',
        context: { companyId: 1, userId: 2, requestId: 'request-1' }
    });

    assert.equal(result.output, 'Respuesta');
    assert.equal(result.provider, 'fake');
    assert.equal(result.request_id, 'request-1');
});

test('ejecuta una tool autorizada y devuelve su resultado al modelo', async () => {
    const registry = new AgentRegistry([{
        id: 'tool-agent',
        name: 'Agente con tool',
        description: 'Prueba el ciclo de herramientas.',
        version: '1.0.0',
        enabled: true,
        model: 'test/model',
        instructions: 'Usa la herramienta.',
        skills: [],
        tools: ['count-records'],
        limits: { maxOutputTokens: 100, maxSteps: 2 }
    }]);
    const tool = {
        id: 'count-records',
        operation: 'read',
        permissions: [],
        definition: {
            type: 'function',
            function: { name: 'count_records', parameters: { type: 'object', additionalProperties: false, properties: {} } }
        },
        execute: async () => ({ total_count: 3 })
    };
    const tools = { resolve: ids => ids.map(() => tool) };
    let providerCalls = 0;
    const provider = {
        async generate(request) {
            providerCalls += 1;
            if (providerCalls === 1) {
                assert.equal(request.tools[0].function.name, 'count_records');
                return {
                    output: '',
                    toolCalls: [{ id: 'call-1', function: { name: 'count_records', arguments: '{}' } }],
                    assistantMessage: { role: 'assistant', content: null, tool_calls: [] }
                };
            }
            assert.equal(request.messages.at(-1).role, 'tool');
            assert.deepEqual(JSON.parse(request.messages.at(-1).content), { total_count: 3 });
            return { output: 'Hay 3 registros.', toolCalls: [], model: 'test/model', provider: 'fake', usage: {} };
        }
    };
    const toolExecutor = { execute: ({ tool: selectedTool, arguments: args, context }) => selectedTool.execute({ arguments: args, context }) };
    const runner = new AgentRunner({ agentRegistry: registry, provider, tools, toolExecutor });

    const result = await runner.run({
        agentId: 'tool-agent',
        input: '¿Cuántos registros hay?',
        context: { companyId: 1, userId: 2, permissions: [], requestId: 'request-tool' }
    });

    assert.equal(result.output, 'Hay 3 registros.');
    assert.equal(providerCalls, 2);
});

test('propaga incrementalmente los fragmentos del proveedor', async () => {
    const registry = new AgentRegistry([{
        id: 'stream-agent', name: 'Agente streaming', description: 'Prueba streaming.',
        version: '1.0.0', enabled: true, model: 'test/model', instructions: 'Responde.',
        skills: [], tools: [], limits: { maxOutputTokens: 100, maxSteps: 1 }
    }]);
    const provider = {
        async generateStream({ onDelta }) {
            await onDelta('Hola');
            await onDelta(' mundo');
            return { output: 'Hola mundo', toolCalls: [], model: 'test/model', provider: 'fake', usage: {} };
        }
    };
    const received = [];
    const runner = new AgentRunner({ agentRegistry: registry, provider, tools: { resolve: () => [] } });
    const result = await runner.runStream({
        agentId: 'stream-agent', input: 'Hola',
        context: { companyId: 1, userId: 2, permissions: [], requestId: 'stream-1' },
        onDelta: chunk => received.push(chunk)
    });

    assert.deepEqual(received, ['Hola', ' mundo']);
    assert.equal(result.output, 'Hola mundo');
});
