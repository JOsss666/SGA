const getProcessProcessInstancesTool = Object.freeze({
    id: 'get-process-processInstances',
    operation: 'read',
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_process_process_instances',
            description: 'Obtiene instancias de procesos reales de la compañía activa en SGA360.',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    id: { type: 'integer', minimum: 1, description: 'ID opcional de la instancia.' },
                    process_id: { type: 'integer', minimum: 1, description: 'ID opcional del proceso.' },
                    status: {
                        type: 'array',
                        minItems: 1,
                        maxItems: 10,
                        items: { type: 'string', minLength: 1, maxLength: 50 },
                        description: 'Estados a consultar; ["all"] no aplica filtro.'
                    },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 }
                }
            }
        }
    })
});

export default getProcessProcessInstancesTool;
