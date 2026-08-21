const getProcessProcessInstancesTool = Object.freeze({
    id: 'get-process-processInstances',
    operation: 'read',
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_process_process_instances',
            description: 'Obtiene instancias de procesos reales de la compañía activa en SGA360, by_id busca una factura por su ownSerial interno..',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ownSerial: {
                        type: 'integer',
                        minimum: 1,
                        description: 'ID interno de la factura. Úsalo exclusivamente con operation="by_id" y solo cuando el usuario indique un ID concreto.'
                    },
                    process_id: { type: 'integer', minimum: 1, description: 'ID opcional del proceso.' },
                    status: {
                        type: 'string',
                        enum: ['all', 'active', 'disabled', 'blocked', 'reported'],
                        description: 'Estado del documento. Usa "all" para no filtrar por estado.'
                    },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
                    initial_date: {
                        type: 'string',
                        format: 'date'
                    },
                    final_date: {
                        type: 'string',
                        format: 'date'
                    },
                }
            }
        }
    })
});

export default getProcessProcessInstancesTool;
