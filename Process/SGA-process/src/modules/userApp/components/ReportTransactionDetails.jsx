import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppInfo } from "../../../context/context";
import { postInfo } from "../../../utils/functions";
import { BoldTitle } from "./BoldTitle";
import { DescriptionSpan } from "./DescriptionSpan";
import { TableReport } from "../containers/TableReport";
import { LoadingSpace } from "../containers/LoadingSpace";
import { PathLocation } from "./PathLocation";
import { SearchBar } from "./SearchBar";
import { FormInput } from "./FormInput";
import { SelectOptions } from "./SelectOptions";
import { ButtonMenu } from "./ButtonMenu";
import { ButtonDownload } from "./ButtonDownload";
import "./ReportTransactionDetails.css";

export function ReportTransactionDetails() {
    const { transaction_id } = useParams();
    const { appInfo } = useAppInfo();
    const [info, setInfo] = useState([]);
    const [loading, setLoading] = useState(false);

    const type = "TR_details";

    const columns = [
        "ID",
        "Concepto",
        "Creada por",
        "Fecha Documento",
        "Sub Total",
        "Total",
        "Fecha creación",
    ];

    const documentTypes = {
        TR_details: "Detalles de la Transacción",
    };

    const settingsReport = {
        columns,
        transaction_id,
        company_id: appInfo.company_id,
        type,
    };

    const GetTransactionDetails = async () => {
        setLoading(true);
        try {
            const res = await postInfo("/getTransactionDetails", settingsReport);
            if (res && res[0]) {
                setInfo(res[1]);
            } else {
                setInfo([]);
            }
        } catch (error) {
            console.error("Error al obtener detalles de la transacción:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (transaction_id) GetTransactionDetails();
    }, [transaction_id]);

    return (
        <div className="ReportDocument">
            <PathLocation />
            <div className="headReport">
                <BoldTitle text={`Detalle de Transacción #${transaction_id}`} />
                <DescriptionSpan text={`Vista detallada de la transacción seleccionada.`} />
            </div>

            <div className="settingsReport">
                <SearchBar placeholder="Buscar" />
                <div className="rangeInput">
                    <FormInput type="date" title="Fecha Inicial" />
                    <span>-</span>
                    <FormInput type="date" title="Fecha Final" />
                </div>
                <SelectOptions
                    options={["Ascendente (fecha)", "Descendente (fecha)", "Ascendente (Nombre)", "Descendente (Nombre)"]}
                    title="Orden"
                />
                <ButtonMenu title="Mas Ajustes" children={<i className="fa-solid fa-sliders" />} noRotate={true} />
                <ButtonMenu title="Agregar a favoritos" children={<i className="fa-regular fa-star" />} noRotate={true} />
                <ButtonDownload />
            </div>

            <div className="SpaceReport">
                {loading ? (
                    <LoadingSpace title="Cargando detalles" description="Esto no debe tardar mucho..." />
                ) : (
                    <TableReport columns={columns} info={info} type={type} />
                )}
            </div>
        </div>
    );
}
