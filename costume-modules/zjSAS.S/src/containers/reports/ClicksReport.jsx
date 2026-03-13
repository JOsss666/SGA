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
import { postInfo } from "../../../utils/functions";
import { LoadingSpace } from "../LoadingSpace";
import { TableClicks } from "../TableClicks";
import './ClicksReport.css'

export function ClicksReport({appInfo,userInfo,userConfig,popInAlert,popOutAlert,useAlert ,useAiAssistant}){

    // requirements
    const [info,setInfo] = useState([]);

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('');
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false); 

    // Settings Report

    const filters = {};

    const columsReport = [
        "Maquina",
        "Clicks",
        "Responsable",
        "Descripcion",
        "Fecha"
    ]

    const settingsReport = {
        columsReport,
        company_id:appInfo.company_id,
        start_date,
        end_date
    }

     // Gettrers of info

     const getClicksHistoric = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/zj852/getHistorialClicksControl',settingsReport);
        console.log(res);
        if(res[0]){
            setInfo(res[1])
        }
        setLoading(false)
        setDisabled(false)
     }

    const getAttachedDodcs = async(attArray)=>{
        let res = await postInfo('/getAttachedFiles',{
            company_id:appInfo.company_id,
            allowedDocs:attArray
        })
        console.log(res);
        if(res[0]){
            setAttachedFiles(res[1]);
        }
    }

     // Effects listener
     useEffect(()=>{
        getClicksHistoric();
     },[])


    return(
        <div className="ClicksReport ReportDocument">
            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Informe de cierre de clicks'}/>
                <DescriptionSpan text={'Consulte el No de clicks ejecutados'}/>
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
            {!loading && (
                <TableClicks columns={columsReport} info={info} disabled={disabled} useAlert={useAlert} appInfo={appInfo}/>
            )}
            {loading && (
                <LoadingSpace title={'Cargando registro de clicks'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}