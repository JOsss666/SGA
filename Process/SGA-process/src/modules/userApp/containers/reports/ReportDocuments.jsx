import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import { TableReport } from "../TableReport";
import "./ReportDocuments.css";
import { LoadingSpace } from "../LoadingSpace";
import { ButtonDownload } from "../../components/ButtonDownload";

export function ReportDocuments({ type }) {

    // Prev Info
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();

    // Actions Page
    const [loading, setLoading] = useState(false);

    // Settings Report
    const documentTypes = {
        OC: "Ordenes de Cliente",
        OP: "Ordenes de Producción",
        DC: "Documentos de Compra",
        CI: "Consumos de inventario",
        FV: "Facturas de venta",
        TR: "Transacciónes",
        TR_details: "Detalles de la Transacción",
    };

    const columnsOp = [
        "ID",
        "Tienda",
        "Creada por",
        "Cliente",
        "Ingreso Presupuestado",
        "Costo Presupuestado",
        "Costo Ejecutado",
        "Valor Facturado",
        "Fecha de entrega",
        "Estado",
    ];

    const columnsOc = [
        "ID",
        "OP",
        "Tienda",
        "Creada por",
        "Cliente",
        "Descripción",
        "Ingreso Presupuestado",
        "Costo Presupuestado",
        "Fecha creación",
        "Estado",
    ];

    const columnsDc = [
        "ID",
        "OP",
        "Tienda",
        "Creada por",
        "Cliente",
        "Descripción",
        "Valor",
        "Fecha creación",
        "Estado",
    ];

    const columsTr = [
        "ID",
        "Concepto",
        "Tienda",
        "Creada por",
        "Fecha Documento",
        "Sub Total",
        "Total",
        "Fecha creación",
        "Estado",
        "Ver Destalles",
    ];

    const columsTr_details = [
        "ID",
        "Concepto",
        "Creada por",
        "Fecha Documento",
        "Sub Total",
        "Total",
        "Fecha creación",
    ];

    const columsDictionary = {
        OP: columnsOp,
        OC: columnsOc,
        DC: columnsDc,
        FV: columnsDc,
        CI: columnsDc,
        TR: columsTr,
        TR_details: columsTr_details,
    };

    const settingsReport = {
        columns: columsDictionary[type],
        company_id: appInfo.company_id,
        type,
    };


    const GetDocuments = async () => {
        setLoading(true);

        if(type === "TR_details"){
            let res = await postInfo('/getTransactionDetails',settingsReport);
            if(res[0]){
                setInfo(res[1])
            }
        }else if (type === "TR"){
            let res = await postInfo('/getTransactions',settingsReport);
            if(res[0]){
                setInfo(res[1])
            }
        }else{
            let res = await postInfo('/process/getDocuments',settingsReport);
            if(res[0]){
                setInfo(res[1])
            }
        }
        setLoading(false)
    };

    useEffect(() => {
        GetDocuments();
    }, []);

    return (
        <div className="ReportDocument">
        <PathLocation />
        <div className="headReport">
            <BoldTitle text={`Informe de ${documentTypes[type]}`} />
            <DescriptionSpan text={`Informe del estado de todos los documentos (${type}).`} />
        </div>
        <div className="settingsReport">
            <SearchBar placeholder={"Buscar"} />
            <div className="rangeInput">
            <FormInput type={"date"} title={"Fecha Inicial"} />
            <span>-</span>
            <FormInput type={"date"} title={"Fecha Final"} />
            </div>
            <SelectOptions
            options={[
                "Ascendente (fecha)",
                "Descendente (fecha)",
                "Ascendente (Nombre)",
                "Descendente (Nombre)",
            ]}
            title={"Orden"}
            />
            <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} />
            <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />
            <ButtonDownload />
        </div>
        <div className="SpaceReport">
            {!loading && (
            <TableReport columns={settingsReport.columns} info={info} type={type} />
            )}
            {loading && (
            <LoadingSpace title={"Cargando información"} description={"Esto no debe tardar mucho..."} />
            )}
        </div>
        </div>
    );
}
