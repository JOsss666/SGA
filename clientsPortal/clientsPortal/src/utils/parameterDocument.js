// Helpers compartidos para interpretar plantillas de documentos parametrizados.
// La lógica es idéntica a la usada en FormNewParameterDocument: se centraliza aquí
// para que la previsualización renderice los campos "tal cual" los llenó el usuario
// (mismos títulos, orden, item-blocks y campos derivados/reference).

const asList = value => Array.isArray(value) ? value : value ? [value] : [];

export const getSpecialProps = field => field?.specialProps ?? field?.propEspecial ?? {};

// Un item-block agrupa varios subcampos (productos/servicios) bajo un selector.
export const isItemBlockSelector = field => {
    const action = getSpecialProps(field).action;
    return field?.component === "SearchinList" && (action === "addItemBlock" || action === "selectMultiple");
};

// Un "reference" es un campo derivado: su valor se arma concatenando otros campos.
export const isReferenceField = field => getSpecialProps(field).action === "reference";

export function getItemBlockDefinition(fields) {
    const selectorIndex = fields.findIndex(isItemBlockSelector);
    if (selectorIndex === -1) return null;

    const selector = fields[selectorIndex];
    const specialProps = getSpecialProps(selector);
    const configuredKeys = specialProps.fieldKeys ?? specialProps.blockFields;
    const blockFields = Array.isArray(configuredKeys)
        ? fields.filter(field => configuredKeys.includes(field.key))
        : fields.slice(selectorIndex + 1);

    return {
        selector,
        blockKey: specialProps.blockKey ?? "itemBlock",
        title: specialProps.blockTitle ?? selector.title ?? "Ítems",
        fields: blockFields
    };
}

// Normaliza una plantilla (objeto { id, name, description, config }) o su config
// cruda a una lista de fields con los defaults aplicados. No hace fetch ni valida:
// solo prepara los fields para renderizar.
export function normalizeTemplateConfig(source) {
    const rawConfig = source?.config ?? source;
    const config = typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
    if (!config || !Array.isArray(config.fields)) return null;

    const fields = config.fields.map(field => ({
        visible: true,
        disabled: false,
        required: false,
        ...config.fieldDefaults,
        ...field
    }));

    return {
        id: source?.id ?? source?.paramdoc_id ?? config.id,
        name: source?.name ?? config.title ?? "Documento parametrizado",
        description: source?.description ?? config.description ?? "",
        config: { ...config, fields }
    };
}

export function normalizeOptions(items) {
    return asList(items).map(item => {
        if (typeof item === "string" || typeof item === "number") return { value: String(item), text: String(item) };
        return {
            value: item.value ?? item.id ?? item.product_id ?? item.thirdParty_id,
            text: item.text ?? item.label ?? item.name ?? item.names ?? "",
            data: item
        };
    }).filter(item => item.value != null && item.text);
}
