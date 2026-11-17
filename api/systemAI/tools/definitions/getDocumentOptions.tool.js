const getDocumentOptionsTool = Object.freeze({
    id: 'get-document-options',
    operation: 'read',
    surfaces: Object.freeze(['mcp']),
    permissions: Object.freeze([]),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'get_document_options',
            description: 'Lista los IDs necesarios para crear facturas de venta y recibos de caja: tiendas, centros de costo, negocios, conceptos, medios de pago activos, cajas y turnos abiertos de la compañía autenticada.',
            parameters: { type: 'object', additionalProperties: false, properties: {} }
        }
    })
});

export default getDocumentOptionsTool;
