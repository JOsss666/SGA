import SystemAIError from '../core/errors/SystemAIError.js';
import sellInvoicesTool from './definitions/getFacturationSellInvoices.tool.js';
import purchasesTool from './definitions/getFacturationPurchases.tool.js';
import processInstancesTool from './definitions/getProcessProcessInstances.tool.js';
import executeSellInvoices from './executors/getFacturationSellInvoices.executor.js';
import executePurchases from './executors/getFacturationPurchases.executor.js';
import executeProcessInstances from './executors/getProcessProcessInstances.executor.js';

const validateTool = (tool, execute) => {
    if (!tool?.id || !tool?.definition?.function?.name || typeof execute !== 'function') {
        throw new SystemAIError('La definición de la tool es inválida.', {
            statusCode: 500,
            code: 'INVALID_TOOL_DEFINITION'
        });
    }
};

class ToolRegistry {
    constructor(initialTools = []) {
        this.tools = new Map();
        initialTools.forEach(({ tool, execute }) => this.register(tool, execute));
    }

    register(tool, execute) {
        validateTool(tool, execute);
        if (this.tools.has(tool.id)) {
            throw new SystemAIError(`La tool ${tool.id} ya está registrada.`, {
                statusCode: 500,
                code: 'DUPLICATE_TOOL'
            });
        }
        this.tools.set(tool.id, Object.freeze({ ...tool, execute }));
    }

    get(toolId) {
        const tool = this.tools.get(toolId);
        if (!tool) {
            throw new SystemAIError(`La tool ${toolId} no está registrada.`, {
                statusCode: 500,
                code: 'TOOL_NOT_FOUND'
            });
        }
        return tool;
    }

    resolve(toolIds = []) {
        return toolIds.map(toolId => this.get(toolId));
    }

    list() {
        return [...this.tools.values()].map(({ execute, ...tool }) => tool);
    }
}

const toolRegistry = new ToolRegistry([
    { tool: sellInvoicesTool, execute: executeSellInvoices },
    { tool: purchasesTool, execute: executePurchases },
    { tool: processInstancesTool, execute: executeProcessInstances }
]);

export { ToolRegistry };
export default toolRegistry;
