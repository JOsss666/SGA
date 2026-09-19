const getThirdPartiesTool = Object.freeze({
    id: 'get_thirdparties_tool',
    operation: 'read',
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_third_parties',
            description: 'Consulta terceros de la compañía autenticada, incluyendo clientes y proveedores. Permite listar, contar, resumir o buscar un tercero concreto.',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    operation: {
                        type: 'string',
                        enum: ['list', 'count', 'summary', 'by_id'],
                        description: 'list devuelve una muestra; count devuelve la cantidad total; summary incluye información comercial y saldos; by_id busca un tercero por su ID interno.'
                    },
                    id: {
                        type: 'integer',
                        minimum: 1,
                        description: 'ID interno del tercero. Úsalo exclusivamente con operation="by_id" y solo cuando el usuario indique un ID concreto.'
                    },
                    identification_number: {
                        type: 'string',
                        minLength: 1,
                        description: 'Número de identificación exacto del tercero.'
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

export default getThirdPartiesTool;
