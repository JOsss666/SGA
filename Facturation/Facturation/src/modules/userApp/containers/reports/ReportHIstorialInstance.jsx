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
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import {TableHistorialInstance} from '../TableHistorialInstance'

export function ReportHistorialInstance() {

    // Prev Info
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const [searchValue,setSearchValue] = useState("");

    // Actions Page
    const [loading, setLoading] = useState(false);

    // Settings Report
    const documentTypes = {
        'Client Order': "Ordenes de Cliente",
        'Production Order': "Ordenes de Producción",
        'Purchase Document': "Documentos de Compra",
        'Inventory Consume': "Consumos de inventario",
        'Sell Invoice': "Facturas de venta",
        TR: "Transacciónes",
        TR_details: "Detalles de la Transacción",
    };

    const columnsOp = [
        "Proceso",
        "Instancia",
        "Responsable",
        "Accion",
        "Descripción",
        "Fecha",
        "Estado"
    ];

    const settingsReport = {
        columns: columnsOp,
        company_id: appInfo.company_id
    };


    const getHistorial = async () => {
        setLoading(true);
        let res = await postInfo('/process/getInstanceHistorial',settingsReport);
        console.log(res);
        if(res[0]){
            setInfo(res[1])
        }
        setLoading(false)
    };

    useEffect(() => {
        getHistorial();
    }, []);

    useEffect(()=>{
        console.log(info)
    },[info])

    return (
        <div className="ReportDocument">
        <PathLocation />
        <div className="headReport">
            <BoldTitle text={`Historial de acciones en procesos`} />
            <DescriptionSpan text={`Consulte el historial de acciones en los procesos.  `} />
        </div>
        <div className="settingsReport">
            <SearchBar placeholder={"Buscar"} action={setSearchValue}/>
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
            <AiButton attached={info} sugerence={[
                {text:'¿Que representa este informe?',context:`Procesos - Informe `},
                {text:'Realiza un analisis de este informe',context:`Procesos - Informe - `},
                {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Informe - `}
            ]}/>
            <ButtonDownload />
        </div>
        <div className="SpaceReport">
            {!loading && (
                <TableHistorialInstance info={info} columns={columnsOp} searchValue={searchValue}/>
            )}
            {loading && (
                <LoadingSpace title={"Cargando información"} description={"Esto no debe tardar mucho..."} />
            )}
        </div>
        </div>
    );
}
