const getAccountabilityTool = Object.freeze({
    id: 'get-accountability',
    operation: 'read',
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_facturation_accountability',
            description: 'Obtiene el balance de cuentas contables de la empresa',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['list','summary'],
                        description: `
                            list devuelve las cuentas,
                            summary devuelve cantidades y totales agregados.
                        `
                    },
                    status: {
                        type: 'string',
                        enum: ['all', 'active', 'disabled', 'blocked', 'reported'],
                        description: 'Estado de las cuentas. Usa "all" para no filtrar por estado.'
                    },
                    balance:{
                        type:'boolean',
                        enum: [true,false],
                        description: `
                            true devuelve todas las cuentas con o sin saldo,
                            false devuelve solo las cuentas con saldo.
                        `
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

export default getAccountabilityTool;
