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
import { TableReport } from "../TableReport";
import { FilterReports } from "./FilterReports";
import './ReportDocuments.css'
import { ProcessStatusAlert } from "../Alerts/ProcessStatusAlert";
import './ProcessesReport.css'
import { TableReportProcesses } from "../TableReportProcesses";
import { useRealtime } from "../../../../utils/useRealTime";

export function ProcessesReport(){
     // Prev Info
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const {popInAlert} = useAlert();
    const [searchValue,setSearchValue] = useState();
    const [reportView,setReportView] = useState('row');

    // Control
    const [loading, setLoading] = useState(false);
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [allAccounts,setAllAccounts] = useState(false);
    const [visibleSettings,setVisibleSettings] = useState(false);
    const [totalCredit,setTotalCredit] = useState(0)
    const [totalDebit,setTotalDebit] = useState(0)
        // Control of filters
        const [allowedStatus,setAllowedStatus] = useState([
            'active','pending'
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
            {title:'Valor',type:'selectList',
                options:[
                    {text:'Todas',value:true},
                    {text:'Distinto de 0',value:false}
                ],
                action:setAllAccounts
            }
        ],
       /* "Estado":[
            {title:'Activos',type:'checkList',value:'active',array:allowedStatus,action:setAllAccounts},
            {title:'Pendientes',type:'checkList',value:'pending',array:allowedStatus,action:setAllAccounts},
            {title:'Cancelados',type:'checkList',value:'cancelled',array:allowedStatus,action:setAllAccounts},
        ]
        */
    }

    const setInfoForReportDownload = ()=>{
        let C = [];
        info.forEach(element => {
            C.push({
                "Empresa":appInfo.legal_name,
                //"Tienda":element.store_id,
                "Proceso":element.process_name,
                "Instancia":`${element.process_code}#${element.ownSerial}`,
                "Tercero":element.thirdParty_name,
                "Etapa actual":element.step_name,
                "Avance":`${parseFloat((element.current_step_order/element.total_steps)*100)?.toFixed(2)}%`,
                "Responsable actual":element.responsable_name,
                "Estado":element.status,
                "Fecha de entrega":formatDate(element.delivery_date),
                "Ultima modificación":formatDate(element.updated_at),
                "Fecha de creación":formatDate(element.start_date),
            })
        });
        return(C);
    } 

    const settingsReport = {
        columns: columsTr,
        company_id: appInfo.company_id,
        typePlanAccount:appInfo.accountPlanType,
        start_date,
        end_date,
        allAccounts,
        status:allowedStatus
    };

    const calcTotals = ()=>{
        let td = 0;
        info.forEach(element => {
            td += parseInt(element.units)
        });
        setTotalDebit(td);
        setTotalCredit(info.length);
    }

    const getInstances = async () => {
        setLoading(true);
        let res = await postInfo('/process/getProcessInstances',settingsReport);
        if(res[0]){
            res[1].forEach(element => {
                element.total = (element.units * element.value).toFixed(2)
            });
            setInfo(res[1])
        }else{
            if(typeof(res[1]) == 'object'){
                setInfo([]);
            }
        }
        setLoading(false)
    };

    useEffect(()=>{
        if(info.length >0){
            calcTotals();
        }
    },[info])

    useRealtime(appInfo.company_id, (payload) => {
        if (payload.table === 'process_instance') {
            getInstances();
        }
    });

    useEffect(()=>{
        getInstances();
    },[])

    useEffect(() => {
        setVisibleSettings(false)
        getInstances();
    }, [start_date,end_date,allAccounts]);


    return (
        <div className="ProcessesReport ReportDocument">
        <PathLocation />
        <div className="headReport">
            <BoldTitle text={`Informe de Procesos`} />
            <DescriptionSpan text={`Balance de cuentas contables.`} />
        </div>
        <div className="totalsBalanceC">
            <LabelValue title={'Referencias'} value={<b>{totalDebit}</b>}/>
            <LabelValue title={'Movimientos'} value={<b>{totalCredit}</b>}/>
        </div>
        <div className="settingsReport">
            <SearchBar placeholder={"Buscar"} action={setSearchValue}/>
            <div className="rangeInput">
            <FormInput type={"date"} title={"Fecha Inicial"} action={setStart_date} />
            <span>-</span>
            <FormInput type={"date"} title={"Fecha Final"} action={setEnd_date} />
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
            <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} onClick={()=>{
                setVisibleSettings(!visibleSettings)
            }}/>
            <ButtonMenu title={"Agregar a favoritos"} children={<i className="fa-regular fa-star" />} noRotate={true} />
            <AiButton attached={info} sugerence={[
                {text:'¿Que proceso deberia priorizar?',context:`Procesos - Balance - Cuentas contables - Saldo`},
                {text:'Realiza un analisis de este informe',context:`Procesos - Balance - Cuentas contables - Saldo`},
                {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`}
            ]}/>
            <ButtonDownload info={setInfoForReportDownload()} title={'Informe instancias de procesos'}/>
            <FilterReports hidden={visibleSettings} columns={columsTr} filters={filters}/>
        </div>
        <div className="SpaceReport">
            {!loading && (
                <TableReportProcesses searchValue={searchValue} settingsReport={settingsReport} info={info}/>
            )}
            {loading && (
            <LoadingSpace title={"Cargando información"} description={"Esto no debe tardar mucho..."} />
            )}
        </div>
        </div>
    )
}