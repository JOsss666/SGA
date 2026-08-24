import SystemAIError from '../core/errors/SystemAIError.js';
import getAccountabilityTool from './definitions/getAccountability.tool.js';

// Tools
import sellInvoicesTool from './definitions/getFacturationSellInvoices.tool.js';
import purchasesTool from './definitions/getFacturationPurchases.tool.js';
import processInstancesTool from './definitions/getProcessProcessInstances.tool.js';
import getDocumentsTool from './definitions/getDocumentsTool.js';

// Executors
import executeSellInvoices from './executors/getFacturationSellInvoices.executor.js';
import executePurchases from './executors/getFacturationPurchases.executor.js';
import executeProcessInstances from './executors/getProcessProcessInstances.executor.js';
import executeGetAccountability from './executors/getAccountability.executor.js';
import executeGetDocuments from './executors/getDocuments.tool.js';

const JSON_SCHEMA_TYPES = new Set(['object', 'array', 'string', 'integer', 'number', 'boolean', 'null']);

const validateJsonSchema = (schema, path = 'parameters') => {
    if (!schema || typeof schema !== 'object' || !JSON_SCHEMA_TYPES.has(schema.type)) {
        throw new SystemAIError(`JSON Schema inválido en ${path}.`, {
            statusCode: 500,
            code: 'INVALID_TOOL_DEFINITION'
        });
    }
    if (schema.type === 'array') {
        if (!schema.items) {
            throw new SystemAIError(`El arreglo ${path} requiere items.`, {
                statusCode: 500,
                code: 'INVALID_TOOL_DEFINITION'
            });
        }
        validateJsonSchema(schema.items, `${path}.items`);
    }
    if (schema.type === 'object') {
        const properties = schema.properties || {};
        for (const [name, propertySchema] of Object.entries(properties)) {
            validateJsonSchema(propertySchema, `${path}.properties.${name}`);
        }
        const unknownRequired = (schema.required || []).filter(name => !Object.hasOwn(properties, name));
        if (unknownRequired.length) {
            throw new SystemAIError(`Campos required inexistentes en ${path}.`, {
                statusCode: 500,
                code: 'INVALID_TOOL_DEFINITION',
                details: { unknownRequired }
            });
        }
    }
};

const validateTool = (tool, execute) => {
    if (!tool?.id || !tool?.definition?.function?.name || typeof execute !== 'function') {
        throw new SystemAIError('La definición de la tool es inválida.', {
            statusCode: 500,
            code: 'INVALID_TOOL_DEFINITION'
        });
    }
    validateJsonSchema(tool.definition.function.parameters);
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
    { tool: processInstancesTool, execute: executeProcessInstances },
    {tool:getAccountabilityTool,execute:executeGetAccountability},
    {tool:getDocumentsTool,execute:executeGetDocuments}
]);

export { ToolRegistry };
export default toolRegistry;
