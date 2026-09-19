import { useEffect, useMemo, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FileInput } from "../../components/FileInput";
import { FormButton } from "../../components/FormButton";
import { ItemsList } from "./itemsList";
import './FormNewParameterDocument.css'
import { LoadingSpace } from "../LoadingSpace";

const componentDictionary = { FormInput, SearchinList, FileInput };

const unwrapResponse = response => {
    if (Array.isArray(response)) return response[0] ? response[1] : [];
    return response?.data ?? response?.rows ?? response ?? [];
};

const asList = value => Array.isArray(value) ? value : value ? [value] : [];

function extractTemplate(source) {
    if (Array.isArray(source)) {
        const records = source.filter(Boolean);
        const documentRecord = records.find(record => {
            const config = typeof record?.config === "string" ? JSON.parse(record.config) : record?.config;
            return Array.isArray(config?.fields);
        });

        if (documentRecord) return extractTemplate(documentRecord);

        const fieldRecords = records.filter(record => {
            const config = typeof record?.config === "string" ? JSON.parse(record.config) : record?.config;
            return config?.key && config?.component;
        });
        if (!fieldRecords.length) return null;

        const firstRecord = fieldRecords[0];
        return extractTemplate({
            ...firstRecord,
            config: {
                schemaVersion: 1,
                title: firstRecord.name,
                description: firstRecord.description,
                fields: fieldRecords.map(record => typeof record.config === "string" ? JSON.parse(record.config) : record.config)
            }
        });
    }

    const config = typeof source?.config === "string" ? JSON.parse(source.config) : source?.config;
    const candidate = source?.document ?? source?.documentConfig ?? config?.document ?? config?.documentConfig ?? config ?? source;
    let normalizedConfig = typeof candidate === "string" ? JSON.parse(candidate) : candidate;

    // Compatibilidad con la tabla actual: algunas filas guardan en `config`
    // un único field, mientras que el formato nuevo guarda el documento completo.
    if (!Array.isArray(normalizedConfig?.fields) && normalizedConfig?.key && normalizedConfig?.component) {
        normalizedConfig = {
            schemaVersion: 1,
            title: source?.name ?? normalizedConfig.title ?? "Documento parametrizado",
            description: source?.description ?? "",
            fieldDefaults: {
                visible: true,
                disabled: false,
                required: false
            },
            fields: [normalizedConfig]
        };
    }

    if (!normalizedConfig || !Array.isArray(normalizedConfig.fields)) return null;

    return {
        id: source?.paramdoc_id ?? source?.document_id ?? source?.id,
        name: source?.name ?? normalizedConfig.title ?? "Documento parametrizado",
        description: source?.description ?? normalizedConfig.description ?? "",
        config: normalizedConfig
    };
}

const getSpecialProps = field => field.specialProps ?? field.propEspecial ?? {};

const isItemBlockSelector = field => {
    const action = getSpecialProps(field).action;
    return field.component === "SearchinList" && (action === "addItemBlock" || action === "selectMultiple");
};

// Un "reference" es un campo derivado: su valor no lo diligencia el usuario, sino
// que se arma concatenando los valores de los demás campos en un solo string
// (formato CSV, separador configurable). Es opcional: si un paramDoc no lo trae,
// nada de esto se ejecuta.
const isReferenceField = field => getSpecialProps(field).action === "reference";

// Arma el string del campo reference a partir de los valores actuales del resto
// de campos. Por defecto toma todos los campos escalares (texto/número/fecha) en
// el orden del config; se puede acotar con specialProps.fieldKeys.
function buildReferenceValue(field, fields, values, itemBlock) {
    const specialProps = getSpecialProps(field);
    const separator = specialProps.separator ?? "; ";
    const blockFieldKeys = new Set(itemBlock?.fields.map(blockField => blockField.key) ?? []);

    const explicitKeys = Array.isArray(specialProps.fieldKeys) && specialProps.fieldKeys.length
        ? specialProps.fieldKeys
        : null;

    const sourceFields = explicitKeys
        ? explicitKeys.map(key => fields.find(candidate => candidate.key === key)).filter(Boolean)
        : fields.filter(candidate => {
            if (isReferenceField(candidate)) return false;                 // ni sí mismo ni otros reference
            if (blockFieldKeys.has(candidate.key)) return false;           // subcampos del item-block
            if (candidate.type === "array") return false;                  // colecciones/items
            if (candidate.component === "FileInput" || candidate.component === "SearchinList") return false;
            const candidateProps = getSpecialProps(candidate);
            return !["addToCollection", "addItemBlock", "selectMultiple"].includes(candidateProps.action);
        });

    const parts = sourceFields.map(sourceField => {
        const raw = values[sourceField.key];
        if (raw == null || Array.isArray(raw)) return "";
        return String(raw).trim();
    });

    return (specialProps.includeEmpty === true ? parts : parts.filter(part => part !== "")).join(separator);
}

function getItemBlockDefinition(fields) {
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

function normalizeTemplate(source) {
    const template = extractTemplate(source);
    if (!template?.config?.fields?.length) throw new Error("El documento no tiene fields configurados.");

    const keys = new Set();
    const fields = template.config.fields.map((field, index) => {
        if (!field?.key || typeof field.key !== "string" || keys.has(field.key)) {
            throw new Error(`El campo ${index + 1} necesita una key única.`);
        }
        if (!componentDictionary[field.component]) {
            throw new Error(`El componente ${field.component} no está registrado.`);
        }
        keys.add(field.key);
        return { visible: true, disabled: false, required: false, ...template.config.fieldDefaults, ...field };
    });

    return { ...template, config: { ...template.config, fields } };
}

function initialValues(fields) {
    const itemBlock = getItemBlockDefinition(fields);
    const blockFieldKeys = new Set(itemBlock?.fields.map(field => field.key) ?? []);
    const values = Object.fromEntries(fields.map(field => [
        field.key,
        field.value ?? field.defaultValue ?? (field.type === "array" ? [] : "")
    ]).filter(([key]) => !blockFieldKeys.has(key)));

    fields.forEach(field => {
        const specialProps = field.specialProps ?? field.propEspecial;
        if (specialProps?.action === "addToCollection" && specialProps.collectionKey) {
            values[specialProps.collectionKey] ??= [];
        }
    });

    if (itemBlock) values[itemBlock.blockKey] = [];

    return values;
}

function normalizeOptions(items) {
    return asList(items).map(item => {
        if (typeof item === "string" || typeof item === "number") return { value: String(item), text: String(item) };
        return {
            value: item.value ?? item.id ?? item.product_id ?? item.thirdParty_id,
            text: item.text ?? item.label ?? item.name ?? item.names ?? "",
            data: item
        };
    }).filter(item => item.value != null && item.text);
}

export function FormNewParameterDocument({ params, document: initialDocument, onSubmit }) {
    const { appInfo, userInfo } = useAppInfo();
    const paramdocId = params?.paramdoc_id ?? 1;
    const [document, setDocument] = useState(null);
    const [values, setValues] = useState({});
    const [catalogs, setCatalogs] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitFeedback, setSubmitFeedback] = useState(null); // { type: 'ok' | 'error', message }

    useEffect(() => {
        let active = true;

        async function loadTemplate() {
            setLoading(true);
            setError("");
            setDocument(null);
            setValues({});
            setCatalogs({});

            try {
                let source = initialDocument ?? params?.document ?? params?.config;

                if (!source) {
                    if (!appInfo.company_key || !userInfo.user_key) return;
                    const response = await postInfo("/externalAccess/getParamDocs", {
                        company_key: appInfo.company_key,
                        access_key: userInfo.user_key
                    });
                    const documents = asList(unwrapResponse(response));
                    const selectedDocument = documents.find(item => String(item.paramdoc_id ?? item.document_id ?? item.id) === String(paramdocId));
                    if (!selectedDocument) throw new Error("El documento solicitado no está disponible para este acceso.");

                    // Las configuraciones legacy pueden llegar en varias filas con el mismo nombre.
                    // Se combinan antes de normalizarlas para no descartar campos.
                    source = documents.filter(item => item.name === selectedDocument.name);
                }

                const loadedDocument = normalizeTemplate(source);
                if (!active) return;
                setDocument(loadedDocument);
                setValues(initialValues(loadedDocument.config.fields));
            } catch (loadError) {
                if (active) setError(loadError.message ?? "No se pudo cargar el documento parametrizado.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadTemplate();
        return () => { active = false; };
    }, [appInfo.company_id, initialDocument, paramdocId, params?.config, params?.document, userInfo.user_key, appInfo.company_key]);

    useEffect(() => {
        if (!document) return undefined;
        let active = true;
        const requirements = [...new Set(document.config.fields.map(field => field.requirements).filter(Boolean))];

        async function loadCatalogs() {
            if (!requirements.length) return;
            setLoadingCatalogs(true);

            try {
                const entries = await Promise.all(requirements.map(async requirement => {
                    if (requirement === "products") {
                        const response = await postInfo("/inventory/getComercialProducts", { company_id: appInfo.company_id });
                        return [requirement, normalizeOptions(unwrapResponse(response))];
                    }

                    if (requirement === "presets") {
                        const response = await postInfo("/inventory/getPresets", { company_id: appInfo.company_id });
                        return [requirement, normalizeOptions(unwrapResponse(response))];
                    }

                    if (requirement === "clients") {
                        const response = await postInfo("/getThirdParties", { company_id: appInfo.company_id, type: "client" });
                        return [requirement, normalizeOptions(unwrapResponse(response))];
                    }

                    throw new Error(`No existe un cargador para requirements: ${requirement}.`);
                }));

                if (active) setCatalogs(Object.fromEntries(entries));
            } catch (catalogError) {
                if (active) setError(catalogError.message ?? "No se pudo cargar la información del formulario.");
            } finally {
                if (active) setLoadingCatalogs(false);
            }
        }

        loadCatalogs();
        return () => { active = false; };
    }, [appInfo.company_id, document]);

    const visibleFields = useMemo(() => document?.config.fields.filter(field => field.visible !== false) ?? [], [document]);
    const itemBlock = useMemo(() => getItemBlockDefinition(visibleFields), [visibleFields]);
    const referenceFields = useMemo(() => document?.config.fields.filter(isReferenceField) ?? [], [document]);

    // Recalcula los campos reference cada vez que cambian los valores. Solo escribe
    // cuando el string resultante cambia, así el efecto no entra en bucle (los
    // reference nunca se toman a sí mismos como fuente).
    useEffect(() => {
        if (!referenceFields.length) return;
        setValues(current => {
            let changed = false;
            const next = { ...current };
            referenceFields.forEach(field => {
                const computed = buildReferenceValue(field, document.config.fields, current, itemBlock);
                if (current[field.key] !== computed) {
                    next[field.key] = computed;
                    changed = true;
                }
            });
            return changed ? next : current;
        });
    }, [values, referenceFields, itemBlock, document]);

    // Opciones del selector del item-block (productos/servicios) en el shape que
    // espera ItemsList: { text, value:<objeto completo> }, para que su buscador
    // interno entregue el producto entero a handleAddItem (SearchinList pasa `value`).
    const productsAndServices = useMemo(() => {
        if (!itemBlock) return [];
        const selector = itemBlock.selector;
        const options = selector.requirements
            ? catalogs[selector.requirements] ?? []
            : normalizeOptions(selector.options);
        return options.map(option => ({ text: option.text, value: option.data ?? option }));
    }, [itemBlock, catalogs]);

    // Adaptador entre el modelo de ItemsList (blocks[].items[]) y el modelo plano
    // del formulario (values[blockKey] = arreglo de ítems). Se usa un único bloque
    // manual (docInfo undefined) que envuelve todos los ítems.
    const setItemBlockItems = updater => {
        if (!itemBlock) return;
        setValues(current => {
            const currentBlocks = [{ docInfo: undefined, items: current[itemBlock.blockKey] ?? [] }];
            const nextBlocks = typeof updater === "function" ? updater(currentBlocks) : updater;
            return { ...current, [itemBlock.blockKey]: nextBlocks[0]?.items ?? [] };
        });
        setFieldErrors(current => Object.fromEntries(Object.entries(current)
            .filter(([key]) => key !== itemBlock.blockKey && !key.startsWith(`${itemBlock.blockKey}.`))));
    };

    const updateField = (key, value) => {
        setValues(current => ({ ...current, [key]: value }));
        setFieldErrors(current => ({ ...current, [key]: undefined }));
    };

    const addToCollection = (field, options, value) => {
        const specialProps = getSpecialProps(field);
        const collectionKey = specialProps.collectionKey;
        const option = options.find(item => String(item.value) === String(value));
        const item = option?.data ?? option ?? value;

        if (!collectionKey || item == null) return;

        setValues(current => {
            const collection = current[collectionKey] ?? [];
            const itemId = item.product_id ?? item.id ?? item.value ?? item;
            const alreadyAdded = collection.some(element => String(element.product_id ?? element.id ?? element.value ?? element) === String(itemId));

            if (specialProps.allowDuplicates !== true && alreadyAdded) return current;

            return { ...current, [collectionKey]: [...collection, item] };
        });
        setFieldErrors(current => ({ ...current, [field.key]: undefined, [collectionKey]: undefined }));
    };

    const addItemBlock = (field, options, value) => {
        if (!itemBlock) return;

        const specialProps = getSpecialProps(field);
        const option = options.find(item => String(item.value) === String(value));
        if (!option) return;

        setValues(current => {
            const blocks = current[itemBlock.blockKey] ?? [];
            const alreadyAdded = blocks.some(block => String(block[field.key]) === String(option.value));
            if (specialProps.allowDuplicates !== true && alreadyAdded) return current;

            const newBlock = Object.fromEntries(itemBlock.fields.map(blockField => [
                blockField.key,
                blockField.value ?? blockField.defaultValue ?? (blockField.type === "array" ? [] : "")
            ]));
            newBlock[field.key] = option.value;
            newBlock[`${field.key}Label`] = option.text;

            return { ...current, [itemBlock.blockKey]: [...blocks, newBlock] };
        });
        setFieldErrors(current => ({ ...current, [itemBlock.blockKey]: undefined }));
    };

    const removeFromCollection = (collectionKey, index) => {
        setValues(current => ({
            ...current,
            [collectionKey]: (current[collectionKey] ?? []).filter((_, itemIndex) => itemIndex !== index)
        }));
    };

    const updateItemBlockField = (index, key, value) => {
        if (!itemBlock) return;
        setValues(current => ({
            ...current,
            [itemBlock.blockKey]: (current[itemBlock.blockKey] ?? []).map((block, itemIndex) =>
                itemIndex === index ? { ...block, [key]: value } : block
            )
        }));
    };

    const handleSearchSelect = (field, options, value) => {
        const specialProps = getSpecialProps(field);
        if (isItemBlockSelector(field)) {
            addItemBlock(field, options, value);
            return;
        }
        if (specialProps?.action === "addToCollection") {
            addToCollection(field, options, value);
            return;
        }

        updateField(field.key, value);
    };

    const validate = () => {
        const errors = {};
        visibleFields.forEach(field => {
            if (field.disabled || field.readOnly || field.props?.disabled) return;
            if (isReferenceField(field)) return;
            const specialProps = getSpecialProps(field);
            if (isItemBlockSelector(field)) {
                const blocks = values[itemBlock?.blockKey] ?? [];
                if (field.required && blocks.length === 0) errors[itemBlock.blockKey] = "Agrega al menos un ítem.";
                return;
            }
            if (specialProps?.action === "addToCollection") {
                const collection = values[specialProps.collectionKey] ?? [];
                if (field.required && collection.length === 0) errors[specialProps.collectionKey] = "Agrega al menos un elemento.";
                return;
            }

            if (itemBlock?.fields.some(blockField => blockField.key === field.key)) return;

            const value = values[field.key];
            const empty = value === "" || value == null || (Array.isArray(value) && !value.length);
            if (field.required && empty) errors[field.key] = "Este campo es obligatorio.";
            if (!empty && (field.type === "number" || field.type === "integer") && !Number.isFinite(Number(value))) {
                errors[field.key] = "Ingresa un número válido.";
            }
        });

        // Los presets solo requieren cantidades: sus precios se resuelven en el backend.
        if (itemBlock) {
            (values[itemBlock.blockKey] ?? []).forEach((item, itemIndex) => {
                const invalidUnits = !Number.isFinite(Number(item.units)) || Number(item.units) <= 0;
                const invalidValue = itemBlock.selector.requirements !== 'presets'
                    && (!Number.isFinite(Number(item.unit_value)) || Number(item.unit_value) < 0);
                if (invalidUnits) errors[`${itemBlock.blockKey}.${itemIndex}.units`] = "Ingresa unidades válidas.";
                if (invalidValue) errors[`${itemBlock.blockKey}.${itemIndex}.unit_value`] = "Ingresa un valor unitario válido.";
            });
        }
        setFieldErrors(errors);
        const details = Object.entries(errors).map(([key, message]) => {
            const [fieldKey, itemIndex] = key.split('.');
            const field = visibleFields.find(candidate => candidate.key === fieldKey);
            const label = field?.title ?? (fieldKey === itemBlock?.blockKey ? itemBlock.title : fieldKey);
            return `${label}${itemIndex !== undefined ? ` · ítem ${Number(itemIndex) + 1}` : ''}: ${message}`;
        });
        if (details.length) setSubmitFeedback({ type: 'error', message: 'Revisa los siguientes campos antes de enviar:', details });
        return details.length === 0;
    };

    // Payload de negocio: valores diligenciados, sin reconstruir la plantilla visual.
    const buildCompletedDocument = () => ({
        schemaVersion: 1,
        paramdoc_id: document.id ?? paramdocId,
        paramDoc_id: document.id ?? paramdocId,
        destiny: document.config.destiny,
        values: { ...values, thirdParty_id: userInfo.user_id }
    });

    const handleSubmit = async event => {
        event.preventDefault();
        if (submitting || loadingCatalogs) return;
        if (!validate()) return;

        // Enviar el mismo payload que se conserva en specialConfig y se devuelve al padre.
        const completedDocument = buildCompletedDocument();
        const request = {
            company_key: appInfo.company_key,
            access_key: userInfo.user_key,
            // Contexto del proceso cuando el paramDoc se abre desde un paso (cola de docs).
            instance_id: params?.instance_id,
            step_id: params?.step_id,
            payload: completedDocument
        };

        setSubmitting(true);
        setSubmitFeedback(null);
        try {
            const response = await postInfo('/externalAccess/registerParamDoc', request);
            if (response?.status !== 'OK' || !response.data?.doc_id) {
                throw new Error(response?.message ?? 'No se confirmó el registro del documento.');
            }
            setSubmitFeedback({ type: 'ok', message: response.message ?? 'Documento y orden registrados correctamente.' });
            onSubmit?.({ ...completedDocument, response });
            // Reiniciar el formulario tras un envío exitoso.
            setValues(initialValues(document.config.fields));
            setFieldErrors({});
        } catch (submitError) {
            console.error('Error al enviar el documento parametrizado:', submitError);
            setSubmitFeedback({
                type: 'error',
                message: submitError?.message ?? 'No fue posible enviar el documento.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field, blockIndex = null) => {
        const Component = componentDictionary[field.component];
        const props = field.props ?? {};
        const specialProps = getSpecialProps(field);
        const isAddToCollection = specialProps.action === "addToCollection";
        const isBlockSelector = isItemBlockSelector(field);
        const isReference = isReferenceField(field);
        const options = field.requirements ? catalogs[field.requirements] ?? [] : normalizeOptions(field.options);
        const title = `${field.title ?? field.key}`;
        const disabled = Boolean(field.disabled || field.readOnly || props.disabled || isReference || loadingCatalogs || submitting);
        const block = blockIndex === null ? null : values[itemBlock.blockKey]?.[blockIndex];
        const value = block ? block[field.key] : values[field.key];
        const errorKey = block ? `${itemBlock.blockKey}.${blockIndex}.${field.key}` : field.key;
        const updateValue = nextValue => block
            ? updateItemBlockField(blockIndex, field.key, nextValue)
            : updateField(field.key, nextValue);

        if (field.component === "SearchinList") {
            return <div key={field.key}>
                <Component title={title} list={options} value={value}
                    placeHolder={props.placeHolder ?? props.placeholder ?? "Selecciona una opción"}
                    canClear={props.canClear} disabled={disabled}
                    noActVal={props.noActVal ?? (isAddToCollection || isBlockSelector)}
                    action={nextValue => isBlockSelector ? handleSearchSelect(field, options, nextValue) : updateValue(nextValue)} />
                {isAddToCollection ? (
                    <ul aria-label={specialProps.collectionTitle ?? title}>
                        {(values[specialProps.collectionKey] ?? []).map((item, index) => (
                            <li key={`${item.product_id ?? item.id ?? item.value ?? index}-${index}`}>
                                <span>{item.name ?? item.names ?? item.text ?? item.label ?? item.product_id ?? item.id ?? item}</span>
                                <button type="button" onClick={() => removeFromCollection(specialProps.collectionKey, index)}>Quitar</button>
                            </li>
                        ))}
                    </ul>
                ) : null}
                {fieldErrors[errorKey] ? <p role="alert">{fieldErrors[errorKey]}</p> : null}
                {isAddToCollection && fieldErrors[specialProps.collectionKey] ? <p role="alert">{fieldErrors[specialProps.collectionKey]}</p> : null}
                {isBlockSelector && fieldErrors[itemBlock.blockKey] ? <p role="alert">{fieldErrors[itemBlock.blockKey]}</p> : null}
            </div>;
        }

        if (field.component === "FileInput") {
            return <div key={field.key}>
                <Component category={props.category ?? "files"} multiple={Boolean(props.multiple)}
                    placeholder={props.placeholder ?? "Seleccionar archivo"} disabled={disabled}
                    action={updateValue} />
                {field.helpText ? <p>{field.helpText}</p> : null}
                {fieldErrors[errorKey] ? <p role="alert">{fieldErrors[errorKey]}</p> : null}
            </div>;
        }

        return <div key={field.key}>
            <Component title={title} type={props.type ?? (field.type === "number" || field.type === "integer" ? "number" : "text")}
                textArea={Boolean(props.textArea)} value={value} placeholder={props.placeholder}
                min={props.min} max={props.max} step={props.step} disabled={disabled}
                required={isReference ? false : field.required} action={updateValue} />
            {field.helpText ? <p>{field.helpText}</p> : null}
            {fieldErrors[errorKey] ? <p role="alert">{fieldErrors[errorKey]}</p> : null}
        </div>;
    };

    if (loading) return <div className="FormNewParameterDocument_loadingSpace">
        <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
    </div>;
    if (error) return <div className="FormNewParameterDocument"><p role="alert">{error}</p></div>;
    if (!document) return <div className="FormNewParameterDocument"><p>No hay un documento configurado.</p></div>;

    return (
        <div className="FormNewParameterDocument" aria-busy={loadingCatalogs}>
            <BoldTitle text={document.config.title ?? document.name} />
            {document.config.description || document.description ? <DescriptionSpan text={document.config.description ?? document.description} /> : null}
            <form onSubmit={handleSubmit} onInvalidCapture={event => {
                const label = event.target.closest('.FacturationFormInput')?.querySelector('label')?.textContent;
                setSubmitFeedback({ type: 'error', message: `${label || 'Campo inválido'}: ${event.target.validationMessage}` });
            }}>
                {visibleFields
                    .filter(field => !itemBlock?.fields.some(blockField => blockField.key === field.key))
                    .map(field => {
                        // El selector del item-block se reemplaza, en su propia posición,
                        // por el ItemsList a 100% de ancho: aprovecha el flex-wrap del form
                        // para ocupar toda la fila y desplazar hacia abajo los campos siguientes.
                        if (itemBlock && field.key === itemBlock.selector.key) {
                            return (
                                <div className="itemsListField" key={field.key}>
                                    <ItemsList
                                        title={itemBlock.title}
                                        visibleItemTotal={false}
                                        itemUnitsLabel={document.config.itemsLabel}
                                        blocks={[{ docInfo: undefined, items: values[itemBlock.blockKey] ?? [] }]}
                                        setItems={setItemBlockItems}
                                        disabled={loadingCatalogs || submitting}
                                        productsAndServices={productsAndServices}
                                    />
                                    {Object.entries(fieldErrors)
                                        .filter(([key, message]) => message && (key === itemBlock.blockKey || key.startsWith(`${itemBlock.blockKey}.`)))
                                        .map(([key, message]) => <p role="alert" key={key}>
                                            {key === itemBlock.blockKey ? message : `Ítem ${Number(key.split('.')[1]) + 1}: ${message}`}
                                        </p>)}
                                </div>
                            );
                        }
                        return renderField(field);
                    })}
                {loadingCatalogs ? <p role="status">Cargando listas...</p> : null}
                {submitFeedback ? (
                    <div role={submitFeedback.type === 'error' ? 'alert' : 'status'} className={`submitFeedback ${submitFeedback.type}`}>
                        <p>{submitFeedback.message}</p>
                        {submitFeedback.details?.length > 0 && <ul>
                            {submitFeedback.details.map((detail, index) => <li key={index}>{detail}</li>)}
                        </ul>}
                    </div>
                ) : null}
                <FormButton
                    text={submitting ? "Guardando documento…" : document.config.submit?.label ?? "Guardar documento"}
                    disabled={loadingCatalogs || submitting}
                    loading={submitting}
                />
            </form>
        </div>
    );
}
