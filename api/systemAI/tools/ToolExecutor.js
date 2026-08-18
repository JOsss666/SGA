import SystemAIError from '../core/errors/SystemAIError.js';

const validateValue = (name, value, schema) => {
    if (value === undefined) return;
    if (schema.type === 'integer' && !Number.isSafeInteger(value)) {
        throw new SystemAIError(`${name} debe ser un número entero.`, { statusCode: 400, code: 'INVALID_TOOL_ARGUMENTS' });
    }
    if (schema.type === 'string' && typeof value !== 'string') {
        throw new SystemAIError(`${name} debe ser texto.`, { statusCode: 400, code: 'INVALID_TOOL_ARGUMENTS' });
    }
    if (schema.type === 'array' && !Array.isArray(value)) {
        throw new SystemAIError(`${name} debe ser un arreglo.`, { statusCode: 400, code: 'INVALID_TOOL_ARGUMENTS' });
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
        throw new SystemAIError(`${name} contiene un valor no permitido.`, {
            statusCode: 400,
            code: 'INVALID_TOOL_ARGUMENTS',
            details: { field: name, allowed: schema.enum }
        });
    }
    if (schema.minimum != null && value < schema.minimum) {
        throw new SystemAIError(`${name} está por debajo del mínimo permitido.`, { statusCode: 400, code: 'INVALID_TOOL_ARGUMENTS' });
    }
    if (schema.maximum != null && value > schema.maximum) {
        throw new SystemAIError(`${name} supera el máximo permitido.`, { statusCode: 400, code: 'INVALID_TOOL_ARGUMENTS' });
    }
    if (schema.maxLength != null && value.length > schema.maxLength) {
        throw new SystemAIError(`${name} excede la longitud permitida.`, { statusCode: 400, code: 'INVALID_TOOL_ARGUMENTS' });
    }
    if (schema.maxItems != null && value.length > schema.maxItems) {
        throw new SystemAIError(`${name} contiene demasiados elementos.`, { statusCode: 400, code: 'INVALID_TOOL_ARGUMENTS' });
    }
    if (schema.type === 'array' && schema.items) {
        value.forEach((item, index) => validateValue(`${name}[${index}]`, item, schema.items));
    }
};

class ToolExecutor {
    async execute({ tool, arguments: args, context }) {
        if (!Number.isSafeInteger(Number(context?.companyId)) || Number(context.companyId) <= 0) {
            throw new SystemAIError('La tool requiere una compañía autenticada.', {
                statusCode: 403,
                code: 'AI_TOOL_COMPANY_REQUIRED'
            });
        }

        const schema = tool.definition.function.parameters || {};
        const properties = schema.properties || {};
        const safeArguments = args && typeof args === 'object' && !Array.isArray(args) ? args : {};
        const missingRequired = (schema.required || []).filter(name => safeArguments[name] === undefined);
        if (missingRequired.length) {
            throw new SystemAIError('La tool no recibió todos los argumentos obligatorios.', {
                statusCode: 400,
                code: 'INVALID_TOOL_ARGUMENTS',
                details: { missing: missingRequired }
            });
        }
        const unknown = Object.keys(safeArguments).filter(key => !Object.hasOwn(properties, key));
        if (unknown.length) {
            throw new SystemAIError('La tool recibió argumentos no permitidos.', {
                statusCode: 400,
                code: 'INVALID_TOOL_ARGUMENTS',
                details: { unknown }
            });
        }
        for (const [name, value] of Object.entries(safeArguments)) {
            validateValue(name, value, properties[name]);
        }

        const granted = new Set(context.permissions || []);
        const missing = (tool.permissions || []).filter(permission => !granted.has(permission));
        if (missing.length) {
            throw new SystemAIError('El usuario no tiene permisos para ejecutar la tool.', {
                statusCode: 403,
                code: 'AI_TOOL_FORBIDDEN',
                details: { missing }
            });
        }
        if (tool.operation !== 'read') {
            throw new SystemAIError('Este ejecutor solo permite tools de lectura.', {
                statusCode: 403,
                code: 'AI_TOOL_WRITE_NOT_ALLOWED'
            });
        }

        return tool.execute({ arguments: safeArguments, context });
    }
}

export default ToolExecutor;
