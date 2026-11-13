const createCashReceiptTool = Object.freeze({
    id: 'create-cash-receipt',
    operation: 'write',
    surfaces: Object.freeze(['mcp']),
    permissions: Object.freeze(['cash-receipts:create']),
    requiresApproval: false,
    definition: Object.freeze({
        type: 'function',
        function: {
            name: 'create_cash_receipt',
            description: 'Crea un recibo de caja que abona una o más carteras (cuentas por cobrar) de un cliente de la compañía autenticada. No admite anticipos ni saldo a favor. Usa get_document_options para los IDs válidos. La suma de los pagos debe igualar la suma de los abonos. Reintentar con el mismo request_id es seguro.',
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    request_id: { type: 'string', minLength: 16, maxLength: 100, description: 'Clave de idempotencia (UUID).' },
                    third_party_id: { type: 'integer', minimum: 1, description: 'ID del cliente dueño de las carteras.' },
                    store_id: { type: 'integer', minimum: 1 },
                    cost_center_id: { type: 'integer', minimum: 1 },
                    business_id: { type: 'integer', minimum: 1, description: 'Opcional.' },
                    concept_id: { type: 'integer', minimum: 1, description: 'Concepto de recaudo activo (no de saldo a favor).' },
                    description: { type: 'string', maxLength: 1000 },
                    bills: {
                        type: 'array',
                        maxItems: 100,
                        description: 'Carteras a abonar.',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                receivable_id: { type: 'integer', minimum: 1, description: 'ID de la cuenta por cobrar.' },
                                paid_value: { type: 'number', minimum: 0, description: 'Abono, máximo 2 decimales y sin superar el saldo.' }
                            },
                            required: ['receivable_id', 'paid_value']
                        }
                    },
                    payments: {
                        type: 'array',
                        maxItems: 10,
                        description: 'Medios con los que se recibe el dinero.',
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
                    cash_box_id: { type: 'integer', minimum: 1 },
                    shift_id: { type: 'integer', minimum: 1, description: 'Turno abierto de la caja.' }
                },
                required: ['request_id', 'third_party_id', 'store_id', 'cost_center_id', 'concept_id', 'bills', 'payments', 'cash_box_id', 'shift_id']
            }
        }
    })
});

export default createCashReceiptTool;
