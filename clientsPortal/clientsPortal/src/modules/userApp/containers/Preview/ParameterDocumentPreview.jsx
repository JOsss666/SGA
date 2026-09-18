import { useMemo } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { ItemsList } from "../forms/itemsList";
import {
    getSpecialProps,
    isItemBlockSelector,
    isReferenceField,
    getItemBlockDefinition,
    normalizeTemplateConfig,
    normalizeOptions
} from "../../../../utils/parameterDocument";
import "./ParameterDocumentPreview.css";

// Render read-only de un documento parametrizado ya creado. Reutiliza los mismos
// componentes hoja del formulario (FormInput, SearchinList, ItemsList) en modo
// disabled, de forma que la previsualización se vea "tal cual" la llenó el usuario:
// mismos títulos, orden e item-blocks. Los valores vienen del specialConfig guardado
// y la plantilla (fields) del endpoint /externalAccess/getParamDocTemplate.
export function ParameterDocumentPreview({ template, values = {} }) {
    const document = useMemo(() => normalizeTemplateConfig(template), [template]);
    const fields = document?.config.fields ?? [];
    const visibleFields = useMemo(() => fields.filter(field => field.visible !== false), [fields]);
    const itemBlock = useMemo(() => getItemBlockDefinition(visibleFields), [visibleFields]);

    if (!document) {
        return <div className="ParameterDocumentPreview">
            <DescriptionSpan text={"No fue posible reconstruir la plantilla de este documento."} />
        </div>;
    }

    const blockFieldKeys = new Set(itemBlock?.fields.map(field => field.key) ?? []);

    const renderCollection = (field) => {
        const specialProps = getSpecialProps(field);
        const collection = values[specialProps.collectionKey] ?? [];
        return <div className="previewField previewCollection" key={field.key}>
            <label>{field.title ?? field.key}</label>
            {collection.length === 0
                ? <span className="previewEmpty">Sin elementos</span>
                : <ul>
                    {collection.map((item, index) => (
                        <li key={`${item.product_id ?? item.id ?? item.value ?? index}-${index}`}>
                            {item.name ?? item.names ?? item.text ?? item.label ?? item.product_id ?? item.id ?? String(item)}
                        </li>
                    ))}
                </ul>}
        </div>;
    };

    const renderFile = (field) => {
        const rawValue = values[field.key];
        const files = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
        return <div className="previewField previewFiles" key={field.key}>
            <label>{field.title ?? field.key}</label>
            {files.length === 0
                ? <span className="previewEmpty">Sin archivos</span>
                : <div className="previewFileChips">
                    {files.map((file, index) => {
                        const url = file?.url ?? (typeof file === "string" ? file : null);
                        const name = file?.name ?? `Archivo ${index + 1}`;
                        return url
                            ? <a className="previewFileChip" href={url} target="_blank" rel="noopener noreferrer" key={index}>
                                <i className="fa-solid fa-paperclip" /> {name}
                            </a>
                            : <span className="previewFileChip" key={index}><i className="fa-solid fa-paperclip" /> {name}</span>;
                    })}
                </div>}
        </div>;
    };

    const renderSearch = (field) => {
        const options = normalizeOptions(field.options);
        const value = values[field.key];
        // Con catálogo estático SearchinList muestra el texto de la opción seleccionada.
        // Sin catálogo (requirements) mostramos el valor crudo guardado como respaldo.
        if (options.length > 0) {
            return <div className="previewField" key={field.key}>
                <SearchinList title={field.title ?? field.key} list={options} value={value} disabled canClear={false} />
            </div>;
        }
        return <div className="previewField" key={field.key}>
            <FormInput title={field.title ?? field.key} type="text" value={value ?? ""} disabled required={false} />
        </div>;
    };

    const renderScalar = (field) => {
        const props = field.props ?? {};
        const type = props.type ?? (field.type === "number" || field.type === "integer" ? "number" : "text");
        return <div className="previewField" key={field.key}>
            <FormInput
                title={field.title ?? field.key}
                type={type}
                textArea={Boolean(props.textArea)}
                value={values[field.key] ?? ""}
                disabled
                required={false}
            />
        </div>;
    };

    const renderField = (field) => {
        if (getSpecialProps(field).action === "addToCollection") return renderCollection(field);
        if (field.component === "FileInput") return renderFile(field);
        if (field.component === "SearchinList" && !isItemBlockSelector(field)) return renderSearch(field);
        return renderScalar(field);
    };

    return (
        <div className="ParameterDocumentPreview">
            <BoldTitle text={document.config.title ?? document.name} />
            {document.config.description || document.description
                ? <DescriptionSpan text={document.config.description ?? document.description} />
                : null}

            <div className="previewFieldsGrid">
                {visibleFields
                    .filter(field => !blockFieldKeys.has(field.key))
                    .map(field => {
                        // El selector del item-block se reemplaza, en su posición, por el
                        // ItemsList en modo lectura con los ítems guardados.
                        if (itemBlock && field.key === itemBlock.selector.key) {
                            return <div className="itemsListField" key={field.key}>
                                <ItemsList
                                    title={itemBlock.title}
                                    visibleItemTotal={false}
                                    itemUnitsLabel={document.config.itemsLabel}
                                    blocks={[{ docInfo: undefined, items: values[itemBlock.blockKey] ?? [] }]}
                                    setItems={() => {}}
                                    disabled
                                    productsAndServices={[]}
                                />
                            </div>;
                        }
                        return renderField(field);
                    })}
            </div>
        </div>
    );
}

export default ParameterDocumentPreview;
