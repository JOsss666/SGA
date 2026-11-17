const createSellInvoiceTool = Object.freeze({
    id: 'create-sell-invoice',
    operation: 'write',
    surfaces: Object.freeze(['mcp']),
    permissions: Object.freeze(['sell-invoices:create']),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'create_sell_invoice',
            description: 'Crea una factura de venta (documento interno, SIN emisión electrónica) en la compañía autenticada. Usa get_document_options para conocer los IDs válidos de tienda, centro de costo, concepto, medios de pago, caja y turno. Los valores unit_value INCLUYEN impuestos. La suma de los pagos debe ser igual al total. Reintentar con el mismo request_id es seguro: no duplica el documento.',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    request_id: { type: 'string', minLength: 16, maxLength: 100, description: 'Clave de idempotencia (UUID). Genera una nueva por factura; reutilízala solo para reintentar la misma.' },
                    third_party_id: { type: 'integer', minimum: 1, description: 'ID del cliente.' },
                    store_id: { type: 'integer', minimum: 1 },
                    cost_center_id: { type: 'integer', minimum: 1 },
                    business_id: { type: 'integer', minimum: 1, description: 'Opcional.' },
                    concept_id: { type: 'integer', minimum: 1, description: 'Concepto de venta activo.' },
                    description: { type: 'string', maxLength: 1000 },
                    items: {
                        type: 'array',
                        maxItems: 100,
                        description: 'Líneas de la factura.',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                product_id: { type: 'integer', minimum: 1 },
                                units: { type: 'number', minimum: 0 },
                                unit_value: { type: 'number', minimum: 0, description: 'Precio unitario con impuestos incluidos, máximo 2 decimales.' }
                            },
                            required: ['product_id', 'units', 'unit_value']
                        }
                    },
                    payments: {
                        type: 'array',
                        maxItems: 10,
                        description: 'Medios de pago. Un medio de crédito (cartera) no requiere caja; los demás sí.',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                payment_method_id: { type: 'integer', minimum: 1 },
                                value: { type: 'number', minimum: 0 },
                                voucher: { type: 'string', maxLength: 100 }
                            },
                            required: ['payment_method_id', 'value']
                        }
                    },
                    cash_box_id: { type: 'integer', minimum: 1, description: 'Requerido si algún pago no es de crédito.' },
                    shift_id: { type: 'integer', minimum: 1, description: 'Turno abierto de esa caja. Requerido si algún pago no es de crédito.' }
                },
                required: ['request_id', 'third_party_id', 'store_id', 'cost_center_id', 'concept_id', 'items', 'payments']
            }
        }
    })
});

export default createSellInvoiceTool;
