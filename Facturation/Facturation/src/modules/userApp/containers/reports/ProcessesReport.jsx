import { useState, useEffect } from "react";
import { useAlert, useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
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

export function ProcessesReport(){
     // Prev Info
    const [info, setInfo] = useState([]);
    const { appInfo } = useAppInfo();
    const {popInAlert} = useAlert();
    const [searchValue,setSearchValue] = useState();

    // Control
    const [loading, setLoading] = useState(false);
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [allAccounts,setAllAccounts] = useState(false);
    const [visibleSettings,setVisibleSettings] = useState(false);
    const [totalCredit,setTotalCredit] = useState(0)
    const [totalDebit,setTotalDebit] = useState(0)

    const columsTr = [
        "ID",
        "Tercero",
        "Proceso",
        "Instancia",
        "Etapa",
        "Fecha de creación",
        "Fecha de entrega",
        "Ultima modificación",
        "Estado"
    ];

    const filters = {
        "Saldo":[
            {title:'Valor',
                options:[
                    {text:'Todas',value:true},
                    {text:'Distinto de 0',value:false}
                ],
                action:setAllAccounts
            }
        ]
    }

    const settingsReport = {
        columns: columsTr,
        company_id: appInfo.company_id,
        typePlanAccount:appInfo.accountPlanType,
        start_date,
        end_date,
        allAccounts
    };

    const calcTotals = ()=>{
        let td = 0;
        info.forEach(element => {
            td += parseInt(element.units)
        });
        setTotalDebit(td);
        setTotalCredit(info.length);
    }

    useEffect(()=>{
        if(info.length >0){
            calcTotals();
        }
    },[info])

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
            <ButtonDownload />
            <FilterReports hidden={visibleSettings} columns={columsTr} filters={filters}/>
        </div>
        <div className="SpaceReport">
            {!loading && (
                <div className="gridResults">
                    {info.map((element,index)=>(
                        <span onClick={()=>{
                            popInAlert(<ProcessStatusAlert instance_id={element.id}/>)
                        }} key={index}>#{element.ownSerial}</span>
                    ))}
                </div>
            )}
            {loading && (
            <LoadingSpace title={"Cargando información"} description={"Esto no debe tardar mucho..."} />
            )}
        </div>
        </div>
    )
}