const getFacturationPurchasesTool = Object.freeze({
    id: 'get-facturation-purchases',
    operation: 'read',
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_facturation_purchases',
            description: 'Obtiene documentos o facturas de compra reales de la compañía activa en SGA360.',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    ownSerial: {
                        type: 'integer',
                        minimum: 1,
                        description: 'ID interno de la factura. Úsalo exclusivamente con operation="by_id" y solo cuando el usuario indique un ID concreto.'
                    },
                    status: {
                        type: 'string',
                        enum: ['all', 'active', 'disabled', 'blocked', 'reported'],
                        description: 'Estado del documento. Usa "all" para no filtrar por estado.'
                    },
                    initial_date: {
                        type: 'string',
                        format: 'date'
                    },
                    final_date: {
                        type: 'string',
                        format: 'date'
                    },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 }
                }
            }
        }
    })
});

export default getFacturationPurchasesTool;
