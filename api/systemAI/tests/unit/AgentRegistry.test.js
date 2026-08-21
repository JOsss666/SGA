import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentRegistry } from '../../agents/AgentRegistry.js';

const agent = {
    id: 'test-agent',
    name: 'Agente de prueba',
    description: 'Agente usado en pruebas.',
    version: '1.0.0',
    enabled: true,
    instructions: 'Responde únicamente para la prueba.',
    skills: [],
    tools: []
};

test('registra y recupera un agente habilitado', () => {
    const registry = new AgentRegistry([agent]);
    assert.equal(registry.get('test-agent').name, 'Agente de prueba');
});

test('la lista pública no expone las instrucciones internas', () => {
    const registry = new AgentRegistry([agent]);
    const [publicAgent] = registry.list();
    assert.equal(publicAgent.id, 'test-agent');
    assert.equal('instructions' in publicAgent, false);
});

test('rechaza identificadores duplicados', () => {
    const registry = new AgentRegistry([agent]);
    assert.throws(() => registry.register(agent), error => error.code === 'DUPLICATE_AGENT');
});

test('registra el lector documental con formatos de solo lectura', async () => {
    const { default: registry } = await import('../../agents/AgentRegistry.js');
    const documentReader = registry.get('document-reader');
    assert.equal(documentReader.limits.readOnly, true);
    assert.deepEqual(documentReader.tools, []);
    assert.equal(documentReader.supportedMimeTypes.includes('application/pdf'), true);
    assert.equal(documentReader.outputSchema.strict, true);
});
