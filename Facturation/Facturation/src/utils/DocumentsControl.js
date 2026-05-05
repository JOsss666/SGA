
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
  'bussines_id',
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

const actionsHandlers = {
  VALIDATE_REQUIRED_HEADER: (context) => {
    return validateRequired(context, requiredHeaderFields);
  }
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