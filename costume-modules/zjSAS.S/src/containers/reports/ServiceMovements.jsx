import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import {PathLocation} from '../../components/PathLocation'
import {SearchBar} from '../../components/SearchBar'
import {FormInput} from '../../components/FormInput';
import {SelectOptions} from '../../components/SelectOptions';
import {ButtonMenu} from '../../components/ButtonMenu';
import {ButtonDownload} from '../../components/ButtonDownload';
import {AiButton} from '../../components/ChatAiComponents/AiButton';
import { useEffect, useState } from "react";
import {FilterReports} from './FilterReports'
import { moneyFormat, postInfo } from "../../../utils/functions";
import { LoadingSpace } from "../LoadingSpace";
import {useRealtime} from '../../../utils/useRealTime.js'
import './ClicksReport.css'
import { TableMovmentServices } from "../TableMovementServices";

export function ServiceMovements({appInfo,userInfo,userConfig,popInAlert,popOutAlert, useAiAssistant}){

    console.log(appInfo,userInfo,userConfig,popInAlert,popOutAlert)

    // requirements
    const [info,setInfo] = useState([]);

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('');
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false); 
    const [totalValue,setTotalValue] = useState(0);
    const [totalServices,setTotalServices] = useState(0);
    const [totalClicks,setTotalClicks] = useState(0);

    // Settings Report

    const filters = {};

    const columsReport = [
        "Servicio",
        "Instancia",
        "Tercero",
        "Clicks",
        "Unidades",
        "Valor unitario",
        "Total",
        "Descripción",
        "Maquina",
        "Fecha"
    ]

    const settingsReport = {
        columsReport,
        company_id:appInfo.company_id,
        start_date,
        end_date
    }

     // Gettrers of info

     const getServiceMovements = async()=>{
        setDisabled(true);
        setLoading(true)
        let res = await postInfo('/zj852/getServiceMovements',settingsReport);
        console.log(res);
        if(res[0]){
            setInfo(res[1]);
        }else{
            setInfo([])
        }
        setLoading(false);
        setDisabled(false);
     }

     // functions

     const calcTotals = ()=>{
        let ttlS = info.length;
        let ttlClicks = 0;
        let ttlValue = 0;
        info.forEach(element => {
            if(element.controlClicks != undefined){
                ttlClicks += parseFloat(element.controlClicks * element.units)
            }
            ttlValue += parseFloat(element.total)
        });
        let defTTVal = ttlValue?.toFixed(2)
        setTotalClicks(ttlClicks);
        setTotalServices(ttlS);
        setTotalValue(defTTVal);
     }

    useRealtime(appInfo.company_id, (payload) => {
        if (payload.table === 'process_instance') {
            getInstances();
        }
    });

     // Effects listener
     useEffect(()=>{
        getServiceMovements();
     },[])

     useEffect(()=>{
        getServiceMovements();
     },[start_date,end_date])

     useEffect(()=>{
        calcTotals();
     },[info])

    return(
        <div className="ClicksReport ReportDocument">
            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Informe de Servicios Z&J S.A.S'}/>
                <DescriptionSpan text={'Consulte el No de clicks ejecutados'}/>
            </div>
            <div className="totalsIndicator">
                <div className="ttlIndicator">
                    <span>Servicios</span>
                    <strong>{moneyFormat(totalServices)}</strong>
                </div>
                <div className="ttlIndicator">
                    <span>Clicks</span>
                    <strong>{moneyFormat(totalClicks)}</strong>
                </div>
                <div className="ttlIndicator">
                    <span>Valor total</span>
                    <strong>$ {moneyFormat(totalValue)}</strong>
                </div>
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
                <AiButton attached={info} useAiAssistant={useAiAssistant} sugerence={[
                    {text:'¿Que representa este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'Realiza un analisis de este informe',context:`Procesos - Balance - Cuentas contables - Saldo`},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Balance - Cuentas contables - Saldo`}
                ]}/>
                <ButtonDownload />
                <FilterReports hidden={visibleSettings} columns={columsReport} filters={filters}/>
            </div>
            <div className="contentReport">
                {!loading && (
                    <TableMovmentServices searchValue={searchValue} columns={columsReport} info={info} disabled={disabled}/>
                )}
                {loading && (
                    <LoadingSpace title={'Cargando registro de clicks'} description={'Esto no debe tardar mucho'}/>
                )}
            </div>
        </div>
    )
}