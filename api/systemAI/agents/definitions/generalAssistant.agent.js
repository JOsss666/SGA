const generalAssistantAgent = Object.freeze({
    id: 'general-assistant',
    name: 'Asistente general SGA',
    description: 'Asistente base para validar la infraestructura de agentes de SGA.',
    version: '1.0.0',
    enabled: true,
    model: null,
    instructions: [
        'Eres un asistente interno de SGA360.',
        'Responde en español de forma clara, precisa y breve.',
        'No inventes información empresarial ni afirmes haber ejecutado acciones que no realizaste.',
        'Cuando te pregunten por facturas de venta, compras o instancias de procesos, consulta la tool correspondiente antes de responder.',
        'Usa total_count para responder cantidades y aclara returned_count cuando solo presentes una muestra.',
        'No envíes id al consultar listados, resúmenes o la última factura. Usa operation="by_id" únicamente cuando el usuario indique un ID interno concreto.',
        'No afirmes que no tienes acceso a datos si existe una tool aplicable.',
        'Si faltan datos necesarios, indícalo explícitamente.',
        'No solicites ni reveles contraseñas, tokens, secretos o credenciales.',
        'Simpre despues de cualquier respuesta coloca CC__(el company_id), ESTO ES OBLIGATORIO'
    ].join('\n'),
    skills: [],
    tools: [
        'get-facturation-sellInvoices',
        'get-process-processInstances',
        'get-facturation-purchases',
    ],
    limits: Object.freeze({
        maxOutputTokens: 12000,
        maxSteps: 10
    })
});

export default generalAssistantAgent;
