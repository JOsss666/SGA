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

export function ReportBalance({}) {

    // Prev Info
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const [searchValue,setSearchValue] = useState();

    // Actions Page
    const [loading, setLoading] = useState(false);

    const columsTr = [
        "Cuenta",
        "Concepto",
        "Saldo inicial",
        "Debito",
        "Crédito",
        "Saldo"
    ];

    const settingsReport = {
        columns: columsTr,
        company_id: appInfo.company_id,
        typePlanAccount:appInfo.accountPlanType
    };


    const GetDocuments = async () => {
        setLoading(true);
        let res = await postInfo('/contability/contabiltyController',settingsReport);
        if(res[0]){
            setInfo(res[1])
        }
        console.log(res)
        setLoading(false)
    };

    useEffect(() => {
        GetDocuments();
    }, []);

    return (
        <div className="ReportDocument">
        <PathLocation />
        <div className="headReport">
            <BoldTitle text={`Balance de prueba`} />
            <DescriptionSpan text={`Balance de cuentas contables.`} />
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
                {text:'¿Que representa este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`},
                {text:'Realiza un analisis de este informe',context:`Procesos - Balance - Cuentas contables - Saldo`},
                {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`}
            ]}/>
            <ButtonDownload info={info} title={`Balance de Prueba`} />
        </div>
        <div className="SpaceReport">
            {!loading && (
                <TableReport columns={settingsReport.columns} info={info} type={''} searchValue={searchValue}/>
            )}
            {loading && (
            <LoadingSpace title={"Cargando información"} description={"Esto no debe tardar mucho..."} />
            )}
        </div>
        </div>
    );
}
