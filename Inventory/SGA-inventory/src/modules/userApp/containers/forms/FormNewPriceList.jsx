import { useState, useEffect, useRef } from "react";
import { FormInput } from "../../components/FormInput";
import { SelectOptions } from "../../components/SelectOptions";
import { FormButton } from "../../components/FormButton";
import { BoldTitle } from "../../components/BoldTitle";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import "./FormNewPriceList.css";


export function FormNewPriceList({ reloadInfo, update = false, updateInfo = {} }) {
    const { appInfo } = useAppInfo();
    const { popOutAlert } = useAlert();
    const { addNotification } = useNotifications();

    const [name, setName] = useState(updateInfo.list_name || updateInfo.name || "");
    const [description, setDescription] = useState(updateInfo.list_description || updateInfo.description || "");
    const [status, setStatus] = useState(
        updateInfo.status !== undefined ? (updateInfo.status === "active" ? "active" : "inactive") : "active"
    );
    const [disabled, setDisabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const hasSubmitted = useRef(false);

    const statusOptions = [
        { text: "Activo", value: "active" },
        { text: "Inactivo", value: "inactive" }
    ];

    const createPriceList = async () => {
    setDisabled(true);
    setLoading(true);
    try {
        const payload = {
            company_id: appInfo.company_id,
            list_name: name,
            list_description: description,
            status: status === "active" ? "active" : "inactive"
        };
        const res = await postInfo('/inventory/createPriceList', payload);
        if (res && res[0] === true) {
            addNotification({ type: "aproved", title: "Creada", description: `"${name}" creada correctamente.` });
            popOutAlert();
            if (typeof reloadInfo === "function") reloadInfo();
        } else {
            addNotification({ type: "error", title: "Error", description: res?.[1]?.message || "No se pudo crear la lista." });
        }
    } catch (error) {
        console.error("Error en createPriceList:", error);
        addNotification({ type: "error", title: "Error de red", description: error.message });
    } finally {
        setLoading(false);
        setDisabled(false);
    }
};

    const updatePriceList = async () => {
        setDisabled(true);
        setLoading(true);
        try {
            const payload = {
                company_id: appInfo.company_id,
                list_name: name,
                list_description: description,
                status: status === "active" ? "active" : "inactive"
            };
            const res = await postInfo(`/inventory/updatePriceList/${updateInfo.id}`, payload);
            if (res && res[0] === true) {
                addNotification({ type: "aproved", title: "Actualizada", description: `"${name}" actualizada.` });
                popOutAlert();
                if (typeof reloadInfo === "function") reloadInfo();
            } else {
                addNotification({ type: "error", title: "Error", description: res?.[1]?.message || "No se pudo actualizar." });
            }
        } catch (error) {
            console.error(error);
            addNotification({ type: "error", title: "Error", description: error.message });
        } finally {
            setLoading(false);
            setDisabled(false);
        }
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    createPriceList();
};
    useEffect(() => {
        if (update && updateInfo) {
            setName(updateInfo.list_name || updateInfo.name || "");
            setDescription(updateInfo.list_description || updateInfo.description || "");
            setStatus(updateInfo.status === "active" ? "active" : "inactive");
        }
    }, [update, updateInfo]);

    return (
        <div className="FormNewPriceList">
            <BoldTitle text={update ? `Actualizar "${updateInfo.name || updateInfo.list_name}"` : "Nueva lista de precios"} />
            <form onSubmit={handleSubmit}>
                <FormInput
                    disabled={disabled}
                    action={setName}
                    title="Nombre"
                    placeholder="Ej: Lista mayorista"
                    value={name}
                    required
                />
                <FormInput
                    disabled={disabled}
                    action={setDescription}
                    title="Descripción"
                    placeholder="Descripción opcional"
                    value={description}
                />
                <div className="statusSelectWrapper">
                    <span className="statusLabel">Estado</span>
                    <SelectOptions
                        title="Estado"
                        options={statusOptions}
                        actualOption={status}
                        action={setStatus}
                        disabled={disabled}
                        objectC={true}
                    />
                </div>
                <FormButton text={update ? "Actualizar lista" : "Crear lista"} disabled={disabled} loading={loading} />
            </form>
        </div>
    );
}