import { useState, useEffect } from "react";
import { useAlert, useAppInfo } from "../../../../context/context";
import { formatDate, postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonDownload } from "../../components/ButtonDownload";
import { ButtonMenu } from "../../components/ButtonMenu";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { LabelValue } from "../../components/LabelValue";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import { LoadingSpace } from "../LoadingSpace";
import { FilterReports } from "./FilterReports";
import { TableReportProcesses } from "../TableReportProcesses";
import "./ReportDocuments.css";
import "./ProcessesReport.css";
import { useRealtime } from "../../../../utils/useRealTime";

export function ProcessesReport(){

    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const { popInAlert } = useAlert();

    const [searchValue,setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);

    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);

    const [allAccounts,setAllAccounts] = useState(false);
    const [visibleSettings,setVisibleSettings] = useState(false);

    const [totalProcesses,setTotalProcesses] = useState(0);
    const [finishedProcesses,setFinishedProcesses] = useState(0);

    const [allowedStatus,setAllowedStatus] = useState([
        "active","pending"
    ]);

    const columsTr = [
        "ID",
        "Proceso",
        "Tercero",
        "Etapa",
        "Responsable",
        "Avance",
        "Fecha de entrega",
        "Ultima modificación",
        "Fecha de inicio",
        "Estado"
    ];

    const filters = {
        "Saldo":[
            {
                title:"Valor",
                type:"selectList",
                options:[
                    {text:"Todas",value:true},
                    {text:"Distinto de 0",value:false}
                ],
                action:setAllAccounts
            }
        ]
    };

    const settingsReport = {
        columns: columsTr,
        company_id: appInfo.company_id,
        typePlanAccount: appInfo.accountPlanType,
        start_date,
        end_date,
        allAccounts,
        status: allowedStatus
    };

    const validateInstance = (instance)=>{
        return (
            instance &&
            instance.id &&
            instance.process_name &&
            instance.process_code &&
            instance.ownSerial &&
            instance.thirdParty_name &&
            instance.step_name &&
            instance.responsable_name &&
            instance.current_step_order &&
            instance.total_steps
        );
    };

    const setInfoForReportDownload = () => {

        return info.map(element => ({

            "ID": element?.id || "",

            "Proceso": element?.process_name || "",

            "Tercero": element?.thirdParty_name || "",

            "Etapa": element?.step_name || "",

            "Responsable": element?.responsable_name || "",

            "Avance":
                element?.current_step_order && element?.total_steps
                    ? `${((Number(element.current_step_order) / Number(element.total_steps)) * 100).toFixed(2)}%`
                    : "0%",

            "Fecha de entrega":
                element?.delivery_date ? formatDate(element.delivery_date) : "",

            "Ultima modificación":
                element?.updated_at ? formatDate(element.updated_at) : "",

            "Fecha de inicio":
                element?.start_date ? formatDate(element.start_date) : "",

            "Estado": element?.status || ""

        }));

    };

    const calcTotals = ()=>{

        const total = info.length;

        const finished = info.filter(p => p.step_name === "Terminado").length;

        setTotalProcesses(total);
        setFinishedProcesses(finished);
    };

    const getInstances = async ()=>{

        setLoading(true);

        try{

            let res = await postInfo("/process/getProcessInstances",settingsReport);

            console.log("Respuesta backend:",res);

            if(!res || !Array.isArray(res) || !res[0]){
                console.warn("Respuesta inválida");
                setInfo([]);
                setLoading(false);
                return;
            }

            let data = res[1];

            if(!Array.isArray(data)){
                console.warn("Datos inválidos:",data);
                setInfo([]);
                setLoading(false);
                return;
            }

            console.table(data);

            const validData = data.filter(validateInstance);

            console.log("Procesos válidos:",validData.length);

            setInfo(validData);

        }catch(error){

            console.error("Error cargando procesos:",error);

            popInAlert({
                type:"error",
                message:"Error cargando el informe de procesos"
            });

            setInfo([]);

        }

        setLoading(false);
    };

    useEffect(()=>{

        if(info.length > 0){
            calcTotals();
        }

    },[info]);

    useRealtime(appInfo.company_id,(payload)=>{

        if(payload.table === "process_instance"){

            console.log("Realtime update:",payload);

            getInstances();
        }

    });

    useEffect(()=>{
        getInstances();
    },[]);

    useEffect(()=>{
        setVisibleSettings(false);
        getInstances();
    },[start_date,end_date,allAccounts]);

    return(

        <div className="ProcessesReport ReportDocument">

            <PathLocation />

            <div className="headReport">

                <BoldTitle text={"Informe de Procesos"} />

                <DescriptionSpan text={"Balance de instancias de procesos."} />

            </div>

            <div className="totalsBalanceC">

                <LabelValue title={"Total procesos"} value={<b>{totalProcesses}</b>} />

                <LabelValue title={"Procesos terminados"} value={<b>{finishedProcesses}</b>} />

            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                <div className="rangeInput">

                    <FormInput type={"date"} title={"Fecha Inicial"} action={setStart_date}/>

                    <span>-</span>

                    <FormInput type={"date"} title={"Fecha Final"} action={setEnd_date}/>

                </div>

                <SelectOptions
                    options={[
                        "Ascendente (fecha)",
                        "Descendente (fecha)",
                        "Ascendente (Nombre)",
                        "Descendente (Nombre)"
                    ]}
                    title={"Orden"}
                />

                <ButtonMenu
                    title={"Mas Ajustes"}
                    children={<i className="fa-solid fa-sliders"/>}
                    noRotate={true}
                    onClick={()=>{setVisibleSettings(!visibleSettings)}}
                />

                <ButtonMenu
                    title={"Agregar a favoritos"}
                    children={<i className="fa-regular fa-star"/>}
                    noRotate={true}
                />

                <AiButton
                    attached={info}
                    sugerence={[
                        {text:"¿Que proceso deberia priorizar?",context:"Procesos - Balance"},
                        {text:"Realiza un analisis de este informe",context:"Procesos - Balance"},
                        {text:"¿Que acciones me recomiendas basado en este informe?",context:"Procesos - Balance"}
                    ]}
                />

                <ButtonDownload
                    info={setInfoForReportDownload()}
                    columns={columsTr}
                    title={"Informe_instancias_procesos"}
                />

                <FilterReports
                    hidden={visibleSettings}
                    columns={columsTr}
                    filters={filters}
                />

            </div>

            <div className="SpaceReport">

                {!loading && (

                    <TableReportProcesses
                        searchValue={searchValue}
                        settingsReport={settingsReport}
                        info={info}
                    />

                )}

                {loading && (

                    <LoadingSpace
                        title={"Cargando información"}
                        description={"Esto no debe tardar mucho..."}
                    />

                )}

            </div>

        </div>
    );
}