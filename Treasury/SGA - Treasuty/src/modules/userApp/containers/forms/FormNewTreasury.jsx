import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import { SearchinList } from "../../components/SearchInList";
import { postInfo } from "../../../../utils/functions";
import "./FormNewTreasury.css";

export function FormNewTreasury({reloadFun }) {

    // Context
    const { appInfo } = useAppInfo();
    const { addNotification } = useNotifications();
    const { popOutAlert } = useAlert();

    // Control
    const [loading, setLoading] = useState(false);
    const [disabled, setDisabled] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("cash");
    const [status, setStatus] = useState("active");

    // Payload
    const formInfo = {
        company_id: appInfo.company_id,
        name,
        description,
        type,
        status
    };

    // Create Treasury
    const createTreasury = async () => {
        setLoading(true);
        setDisabled(true);

        const res = await postInfo("/treasury/createTreasury", formInfo);

        if (res[0]) {
            addNotification({
                type: "aproved",
                title: `Tesorería "${name}" creada`,
                description: `La tesorería ${name} fue creada correctamente.`
            });

            popOutAlert();

            if (reloadFun) {
                reloadFun();
            }
        } else {
            addNotification({
                type: "error",
                title: `Error al crear la tesorería`,
                description: `Hubo un problema al crear la tesorería "${name}".`
            });
        }

        setLoading(false);
        setDisabled(false);
    };

    return (
        <div className="FormNewTreasury">
            <BoldTitle text={"Nueva Tesorería"} />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    //createTreasury();
                }}
            >
                <FormInput
                    title="Nombre"
                    placeholder="Nombre de la tesorería"
                    action={setName}
                    disabled={disabled}
                />

                <FormInput
                    title="Descripción"
                    placeholder="Descripción de la tesorería"
                    action={setDescription}
                    disabled={disabled}
                />

                <SearchinList
                    title="Tipo de tesorería"
                    placeHolder="Seleccione el tipo"
                    action={setType}
                    disabled={disabled}
                    list={[
                        { text: "Caja", value: "cash" },
                        { text: "Banco", value: "bank" },
                        { text: "Billetera digital", value: "wallet" }
                    ]}
                />

                <SearchinList
                    title="Estado"
                    placeHolder="Seleccione el estado"
                    action={setStatus}
                    disabled={disabled}
                    list={[
                        { text: "Activo", value: "active" },
                        { text: "Desactivado", value: "disabled" },
                        { text: "Bloqueado", value: "blocked" }
                    ]}
                />

                <FormButton
                    text={loading ? "Creando tesorería..." : "Crear tesorería"}
                    loading={loading}
                    disabled={disabled}
                />
            </form>
        </div>
    );
}
