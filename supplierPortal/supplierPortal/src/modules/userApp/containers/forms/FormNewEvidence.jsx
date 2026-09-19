import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { FileInput } from "../../components/FileInput";
import { FormButton } from "../../components/FormButton";
import { SearchinList } from "../../components/SearchInList";
import { LabelValue } from "../../components/LabelValue";
import { LoadingSpace } from "../LoadingSpace";
import { postInfo } from "../../../../utils/functions";
import './FormNewEvidence.css'

export function FormNewEvidence({ reloadFun }) {

    // Requirements
    const { appInfo, userInfo } = useAppInfo();
    const companyKey = appInfo.company_key;
    const accessKey = userInfo.user_key;

    // Control
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [loading, setLoading] = useState(false);      // enviando
    const [uploading, setUploading] = useState(false);  // subida de adjuntos en curso
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(null);

    // Data
    const [instances, setInstances] = useState([]);     // [{ text, value: instance }]
    const [stores, setStores] = useState([]);           // [{ id, name }] ya filtradas por permisos

    // FormInfo
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [storeId, setStoreId] = useState(undefined);
    const [description, setDescription] = useState('');
    const [attached, setAttached] = useState([]);

    const disabled = loading || uploading;

    // El backend (getEvidenceOptions) valida el acceso externo y devuelve solo las
    // tiendas permitidas para el responsable del acceso según su rol.
    const loadOptions = async () => {
        setOptionsLoading(true);
        setError('');
        try {
            const res = await postInfo('/process/getEvidenceOptions', {
                company_key: companyKey,
                access_key: accessKey
            });
            if (res?.status !== 'OK') throw new Error(res?.message || 'No se pudieron cargar las opciones.');
            const data = res.data ?? {};

            setInstances((data.instances ?? []).map(instance => ({
                text: `${instance.process_name} #${instance.ownSerial} — ${instance.step_name}`,
                value: instance
            })));

            const storeList = data.stores ?? [];
            setStores(storeList);
            // Restringido a una tienda -> se auto-selecciona y no se muestra el selector.
            setStoreId(storeList.length === 1 ? storeList[0].id : undefined);
        } catch (err) {
            setError(err?.message || 'No se pudieron cargar las opciones.');
        } finally {
            setOptionsLoading(false);
        }
    };

    useEffect(() => {
        loadOptions();
    }, []);

    const resetForm = () => {
        setSaved(null);
        setSelectedInstance(null);
        setDescription('');
        setAttached([]);
        setStoreId(stores.length === 1 ? stores[0].id : undefined);
    };

    const submit = async (event) => {
        event.preventDefault();
        if (disabled) return;
        setError('');

        if (!selectedInstance) { setError('Selecciona un proceso adjunto.'); return; }
        if (!storeId) {
            setError(stores.length === 0 ? 'No tienes tiendas habilitadas para registrar evidencia.' : 'Selecciona una tienda.');
            return;
        }
        if (!description.trim() && attached.length === 0) {
            setError('Escribe una descripción o adjunta al menos un archivo.');
            return;
        }

        setLoading(true);
        try {
            const res = await postInfo('/process/registerEvidence', {
                company_key: companyKey,
                access_key: accessKey,
                instance_id: selectedInstance.id,
                step_id: selectedInstance.step_id,
                store_id: storeId,
                description: description.trim(),
                attached
            });
            if (res?.status !== 'OK') throw new Error(res?.message || 'No se pudo registrar la evidencia.');
            setSaved(res.data);
            // Un fallo al refrescar no debe permitir reenviar una evidencia ya guardada.
            try { await reloadFun?.(); } catch { /* la confirmación se conserva */ }
        } catch (err) {
            setError(err?.message || 'No se pudo registrar la evidencia. Tus datos se conservan.');
        } finally {
            setLoading(false);
        }
    };

    if (optionsLoading) {
        return (
            <div className="FormNewEvidence">
                <LoadingSpace title={'Cargando'} description={'Preparando el formulario de evidencia...'} />
            </div>
        );
    }

    if (saved) {
        return (
            <div className="FormNewEvidence">
                <div className="head">
                    <BoldTitle text={'Evidencia registrada'} />
                    <DescriptionSpan text={`Comprobante ${saved?.ownSerial ?? ''} registrado correctamente.`} />
                    <div className="options">
                        <FormButton text={'Registrar otra'} onClick={resetForm} />
                    </div>
                </div>
            </div>
        );
    }

    const singleStore = stores.length === 1;

    return (
        <div className="FormNewEvidence">
            <div className="head">
                <BoldTitle text={'Adjuntar nueva evidencia'} />
                <DescriptionSpan text={'Adjunte evidencia y deje registro de cualquier acción.'} />
                <form onSubmit={submit}>
                    <SearchinList
                        title={'Proceso adjunto'}
                        placeHolder={'Seleccione proceso adjunto'}
                        list={instances}
                        action={setSelectedInstance}
                        disabled={disabled}
                    />

                    {/* Tienda: una sola -> fija; varias -> selector. */}
                    {singleStore && (
                        <LabelValue title={'Tienda'} value={<b>{stores[0].name}</b>} />
                    )}
                    {stores.length > 1 && (
                        <SearchinList
                            title={'Tienda'}
                            placeHolder={'Seleccione la tienda'}
                            list={stores.map(store => ({ text: store.name, value: store.id }))}
                            action={setStoreId}
                            disabled={disabled}
                        />
                    )}
                    {stores.length === 0 && (
                        <span className="evidenceWarning">No tienes tiendas habilitadas para registrar evidencia.</span>
                    )}

                    <FormInput
                        title={'Descripción'}
                        textArea={true}
                        placeholder={'Descripción u observación a realizar'}
                        value={description}
                        action={setDescription}
                        disabled={disabled}
                    />

                    <FileInput
                        category="files"
                        multiple={true}
                        placeholder={'Adjuntar archivos o material adjunto'}
                        action={setAttached}
                        setDisabled={setUploading}
                        disabled={disabled}
                    />

                    {error && <span className="evidenceWarning" role="alert">{error}</span>}

                    <div className="options">
                        <FormButton text={'Enviar'} disabled={disabled || stores.length === 0} loading={loading} />
                    </div>
                </form>
            </div>
        </div>
    );
}
