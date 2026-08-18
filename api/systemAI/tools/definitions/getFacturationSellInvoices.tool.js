const getFacturationSellInvoicesTool = Object.freeze({
    id: 'get-facturation-sellInvoices',
    operation: 'read',
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_facturation_sell_invoices',
            description: 'Obtiene facturas de venta reales de la compañía activa en SGA360.',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['list', 'latest', 'summary', 'by_id'],
                        description: `
                            list devuelve facturas,
                            latest devuelve la última factura,
                            summary devuelve cantidades y totales agregados,
                            by_id busca una factura por su ID interno.
                        `
                    },
                    id: {
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
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100
                    }
                },
                required: ['operation']
            }
        }
    })
});

export default getFacturationSellInvoicesTool;
