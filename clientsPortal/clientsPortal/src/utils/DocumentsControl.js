
const validateRequired = (obj, fields) => {
    const missingKeys = fields.filter(
        (field) => obj[field] === undefined || obj[field] === null || obj[field] === ""
    );

    // Traducir a nombres funcionales
    const missingFields = missingKeys.map(
        (key) => dictionaryFieds[key] || key
    );

    console.log(obj)
    console.log(missingFields)

    return {
        isValid: missingKeys.length === 0,
        missingFields, // ya traducidos
        missingKeys,   // opcional: útil para debug o lógica interna
        message: missingFields.length
        ? `Campos faltantes: ${missingFields.join(', ')}`
        : null
    };
};

const requiredHeaderFields = [
  'store_id',
  'costCenter_id',
  'concept_id',
  'company_id',
  'created_by',
  'thirdParty_id',
  'thirdParty_name',
  //'bussines_id',
  'doc_type',
  'subTotal',
  'total'
];

const dictionaryFieds = {
    'store_id':'Tienda',
    'costCenter_id':'Centro de costo',
    'concept_id':'Concepto',
    'company_id':'Compañia',
    'created_by':'Creado por',
    'thirdParty_id':'Id del tercero',
    'thirdParty_name':'Nombre del tercero',
    'bussines_id':'Negocio',
    'doc_type':'Tipo de documento',
    'subTotal':'Sub total',
    'total':'Total'
}

// Tolerancia en pesos para comparaciones de totales (evita falsos negativos por redondeo).
const TOTALS_TOLERANCE = 1;

// Valida que el documento traiga al menos una línea (ítem/servicio).
const validateLinesExist = (context) => {
    const lines = context.lines ?? context.items ?? [];
    const hasLines = Array.isArray(lines) && lines.length > 0;
    return {
        isValid: hasLines,
        message: hasLines ? null : 'Debe agregar al menos un ítem al documento.'
    };
};

// Valida que el total sea positivo y que subtotal (neto) + impuestos cuadre con el bruto.
const validateDocumentTotals = (context) => {
    const gross = Number(context.grossTotal ?? context.total ?? 0);

    if (!(gross > 0)) {
        return { isValid: false, message: 'El total del documento debe ser mayor a cero.' };
    }

    if (context.subtotalNet !== undefined && context.taxesTotal !== undefined) {
        const computed = Number(context.subtotalNet) + Number(context.taxesTotal);
        if (Math.abs(computed - gross) > TOTALS_TOLERANCE) {
            return {
                isValid: false,
                message: `Los totales no cuadran (calculado ${computed.toFixed(2)} vs ${gross.toFixed(2)}).`
            };
        }
    }

    return { isValid: true, message: null };
};

// Valida que los pagos coincidan con el neto a pagar (bruto menos retenciones).
const validatePayments = (context) => {
    const gross = Number(context.grossTotal ?? context.total ?? 0);
    const retentions = Number(context.retentionsTotal ?? 0);
    const payments = Number(context.paymentsTotal ?? 0);
    const netToPay = gross - retentions;

    if (Math.abs(payments - netToPay) > TOTALS_TOLERANCE) {
        return {
            isValid: false,
            message: `Los pagos (${payments.toFixed(2)}) no coinciden con el neto a pagar (${netToPay.toFixed(2)}).`
        };
    }

    return { isValid: true, message: null };
};

const actionsHandlers = {
  VALIDATE_REQUIRED_HEADER: (context) => {
    return validateRequired(context, requiredHeaderFields);
  },
  VALIDATE_LINES_EXIST: validateLinesExist,
  VALIDATE_DOCUMENT_TOTALS: validateDocumentTotals,
  VALIDATE_PAYMENTS: validatePayments
};

export function executeDocumentAction(action, context) {
  const handler = actionsHandlers[action];

  if (!handler) {
    throw new Error(`Acción no permitida: ${action}`);
  }

  return handler(context);
}

function validateHeadInvoice(info) {
  return validateRequired(info, requiredHeaderFields);
}