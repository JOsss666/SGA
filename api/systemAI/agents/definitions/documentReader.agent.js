const documentExtractionSchema = Object.freeze({
    name: 'document_extraction',
    strict: true,
    schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
            document_type: { type: ['string', 'null'] },
            language: { type: ['string', 'null'] },
            summary: { type: 'string' },
            full_text: { type: 'string' },
            people: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        name: { type: 'string' },
                        role: { type: ['string', 'null'] },
                        context: { type: 'string' }
                    },
                    required: ['name', 'role', 'context']
                }
            },
            organizations: { type: 'array', items: { type: 'string' } },
            addresses: { type: 'array', items: { type: 'string' } },
            emails: { type: 'array', items: { type: 'string' } },
            phones: { type: 'array', items: { type: 'string' } },
            identifiers: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        type: { type: 'string' },
                        value: { type: 'string' },
                        context: { type: 'string' }
                    },
                    required: ['type', 'value', 'context']
                }
            },
            dates: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        value: { type: 'string' },
                        context: { type: 'string' }
                    },
                    required: ['value', 'context']
                }
            },
            monetary_values: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        value: { type: 'string' },
                        currency: { type: ['string', 'null'] },
                        context: { type: 'string' }
                    },
                    required: ['value', 'currency', 'context']
                }
            },
            key_value_fields: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        key: { type: 'string' },
                        value: { type: 'string' }
                    },
                    required: ['key', 'value']
                }
            },
            tables: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        title: { type: ['string', 'null'] },
                        columns: { type: 'array', items: { type: 'string' } },
                        rows: {
                            type: 'array',
                            items: { type: 'array', items: { type: 'string' } }
                        }
                    },
                    required: ['title', 'columns', 'rows']
                }
            },
            sections: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        title: { type: ['string', 'null'] },
                        text: { type: 'string' }
                    },
                    required: ['title', 'text']
                }
            },
            unreadable_fragments: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        location: { type: 'string' },
                        reason: { type: 'string' },
                        partial_text: { type: ['string', 'null'] }
                    },
                    required: ['location', 'reason', 'partial_text']
                }
            },
            warnings: { type: 'array', items: { type: 'string' } },
            extraction_complete: { type: 'boolean' }
        },
        required: [
            'document_type', 'language', 'summary', 'full_text', 'people',
            'organizations', 'addresses', 'emails', 'phones', 'identifiers',
            'dates', 'monetary_values', 'key_value_fields', 'tables', 'sections',
            'unreadable_fragments', 'warnings', 'extraction_complete'
        ]
    }
});

const documentReaderAgent = Object.freeze({
    id: 'document-reader',
    name: 'Lector de documentos',
    description: 'Extrae texto y datos estructurados de documentos PDF, JPG, JPEG, PNG, CSV y Markdown.',
    version: '1.0.0',
    enabled: true,
    model: 'openai/gpt-4.1-mini',
    instructions: [
        'Eres un extractor documental de solo lectura para SGA360.',
        'Tu salida será consumida por otro agente: responde únicamente con el JSON solicitado y sin texto adicional.',
        'Transcribe todo el contenido legible conservando el orden natural, encabezados, saltos, listas y relaciones entre campos.',
        'Extrae nombres, roles, organizaciones, direcciones, correos, teléfonos, identificadores, fechas, valores monetarios, campos clave-valor y tablas.',
        'No resumas en full_text: full_text debe contener la transcripción más completa posible.',
        'summary es una descripción breve y factual del documento, no una interpretación.',
        'No completes, corrijas ni normalices silenciosamente datos ilegibles, cortados o ambiguos.',
        'No inventes valores. Usa arreglos vacíos o null cuando el documento no contenga un dato.',
        'Registra texto parcialmente legible en unreadable_fragments e indica su ubicación aproximada.',
        'Marca extraction_complete=false cuando falten páginas, haya texto ilegible o el contenido pueda estar truncado.',
        'Para CSV conserva todas las filas, columnas y valores; no calcules ni agregues datos.',
        'Para Markdown conserva títulos, enlaces, listas, tablas y bloques de código como texto.',
        'No ejecutes acciones, no modifiques archivos y no consultes datos del ERP.'
    ].join('\n'),
    supportedMimeTypes: Object.freeze([
        'application/pdf',
        'image/jpeg',
        'image/png',
        'text/csv',
        'text/markdown'
    ]),
    documentProcessing: Object.freeze({
        pdfParserEngine: 'cloudflare-ai',
        maxFileBytes: 10 * 1024 * 1024,
        maxTextCharacters: 200000
    }),
    outputSchema: documentExtractionSchema,
    skills: [],
    tools: [],
    limits: Object.freeze({
        maxOutputTokens: 6000,
        maxSteps: 1,
        readOnly: true
    })
});

export { documentExtractionSchema };
export default documentReaderAgent;
