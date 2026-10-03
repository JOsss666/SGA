import test from 'node:test';
import assert from 'node:assert/strict';
import generalAssistantAgent from '../../../systemAI/agents/definitions/generalAssistant.agent.js';

test('incluye la verificación obligatoria al orientar el registro de compras', () => {
    const instructions = generalAssistantAgent.instructions;

    assert.match(instructions, /cómo registrar una compra/i);
    assert.match(instructions, /cuenta contable donde se cargará el valor de la compra/i);
    assert.match(instructions, /concepto de compra con la cuenta y su naturaleza contable/i);
    assert.match(instructions, /IVA descontable/i);
    assert.match(instructions, /retenciones en la fuente/i);
    assert.match(instructions, /comportamiento para compra y venta/i);
    assert.match(instructions, /tercero\/proveedor/i);
    assert.match(instructions, /no asumas que las parametrizaciones anteriores existen/i);
});
