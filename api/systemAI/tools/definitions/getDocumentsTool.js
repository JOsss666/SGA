const getDocumentsTool = Object.freeze({
    id: 'get_documents_tool',
    operation: 'read',
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_documents',
            description: 'Obtiene la información necesaria de cualquier documento requerido, tambien puede filtrar por fecha, periodo, agrupar y demas.',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['list','summary', 'by_id'],
                        description: `
                            list devuelve las documentos seleccionados,
                            summary da un resumen + analisis de los documentos seleccionados,
                            by_id busca documento por su id interno.
                        `
                    },
                    id: {
                        type: 'integer',
                        minimum: 1,
                        description: 'ID interno del documento. Úsalo exclusivamente con operation="by_id" y solo cuando el usuario indique un ID concreto.'
                    },
                    status: {
                        type: 'string',
                        enum: ['all', 'active', 'disabled', 'blocked', 'reported'],
                        description: 'Estado de las cuentas. Usa "all" para no filtrar por estado.'
                    },
                    types:{
                        type: 'array',
                        minItems: 1,
                        uniqueItems: true,
                        items: {
                            type: 'string',
                            // Valores verificados contra el enum document_types
                            // de PostgreSQL: uno inválido rompe el cast del ANY().
                            enum: [
                                'Sell Invoice',
                                'Purchase Invoice',
                                'Purchase Document',
                                'Cash Recipt',
                                'Client Order',
                                'Production Order',
                                'Inventory Consume'
                            ]
                        },
                        description: 'Indica el tipo o tipos de documento por el cual se quiere filtrar.'
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

export default getDocumentsTool;
