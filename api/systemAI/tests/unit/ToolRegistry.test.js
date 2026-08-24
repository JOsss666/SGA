import test from 'node:test';
import assert from 'node:assert/strict';
import toolRegistry, { ToolRegistry } from '../../tools/ToolRegistry.js';
import generalAssistantAgent from '../../agents/definitions/generalAssistant.agent.js';

test('resuelve todas las tools configuradas para el asistente general', () => {
    const tools = toolRegistry.resolve(generalAssistantAgent.tools);

    assert.deepEqual(tools.map(tool => tool.id), generalAssistantAgent.tools);
    assert.ok(tools.every(tool => tool.operation === 'read'));
    assert.ok(tools.every(tool => typeof tool.execute === 'function'));
});

test('rechaza ids de tools que no estén registrados', () => {
    const registry = new ToolRegistry();
    assert.throws(() => registry.get('unknown-tool'), error => error.code === 'TOOL_NOT_FOUND');
});

test('rechaza un tipo JSON Schema inválido antes de llamar al proveedor', () => {
    const registry = new ToolRegistry();
    assert.throws(() => registry.register({
        id: 'invalid-schema',
        definition: {
            function: {
                name: 'invalid_schema',
                parameters: {
                    type: 'object',
                    properties: { types: { type: 'aray' } }
                }
            }
        }
    }, async () => {}), error => error.code === 'INVALID_TOOL_DEFINITION');
});
