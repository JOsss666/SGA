import {BoldTitle} from '../../components/BoldTitle';
import { ButtonDownload } from '../../components/ButtonDownload';
import { ButtonMenu } from '../../components/ButtonMenu';
import { AiButton } from '../../components/ChatAiComponents/AiButton';
import { FormInput } from '../../components/FormInput';
import { PathLocation } from '../../components/PathLocation';
import { SearchBar } from '../../components/SearchBar';
import { SelectOptions } from '../../components/SelectOptions';
import { FilterReports } from './FilterReports';
import { useState,useEffect,useRef, useMemo } from 'react';
import { moneyFormat, postInfo } from '../../../utils/functions';
import './AuditoryClicksReport.css'
import { LoadingSpace } from '../LoadingSpace';
import { TableAuditClicks } from '../TableAuditClicks';
import {LabelValue} from '../../components/LabelValue'


export function AuditoryClicksReport({appInfo,userInfo,userConfig,popInAlert,popOutAlert,useAlert ,useAiAssistant}){

    // requierements
    const reportRef = useRef();
    const [info,setInfo] = useState([]);
    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('');
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false); 

    // Aditional data
    const [acDiference,setAcDiference] = useState(0);
        
    
        const filters = {};
    
        const columsReport = [
            "Fecha",
            "Maquina",
            "Clicks iniciales",
            "Clicks cierre",
            "Clicks Ejecutados",
            "Clicks Registrados",
            "Diferencia"
        ];
    
        const settingsReport = {
            columsReport,
            company_id: appInfo.company_id,
            start_date,
            end_date
        };
    
        const getClicksHistoric = async()=>{
            setDisabled(true);
            setLoading(true);
    
            let res = await postInfo('/zj852/getAuditClicksReport', settingsReport);
            if(res[0]){
                console.log("DATA BACKEND:", res[1]);
                setInfo(res[1]);
            }
    
            setLoading(false);
            setDisabled(false);
        }

        useEffect(()=>{
            getClicksHistoric();
        },[start_date,end_date])
    
        useEffect(()=>{
            getClicksHistoric();
        },[]);
    
        const tableData = useMemo(() => {
            if(!Array.isArray(info)) return []
            const search = searchValue.toLowerCase()
    
            return info.filter((row)=>
                Object.values(row)
                    .join(" ")
                    .toLowerCase()
                    .includes(search)
            )
    
        }, [info, searchValue])


        const calcAcumulatedDiference = (data)=>{
            let s = 0;
            data.forEach(element => {
                s += parseFloat(element.diferencia)
            });
            return(s)
        }

        useEffect(()=>{
            if(tableData.length < 1) return;
            setAcDiference(calcAcumulatedDiference(tableData));
        },[tableData])
    
        const columnMap = {
            "Fecha": "fecha",
            "Maquina": "machine_name",
            "Clicks iniciales":'initial_clicks',
            "Clicks cierre":'next_initial_clicks',
            "Clicks Registrados": "clicksRegistrados",
            "Clicks Ejecutados": "clicksEjecutados",
            "Diferencia": "diferencia"
        };
    
        const setInfoForReportDownload = () => {
    
            return tableData.map(element => {
    
                let row = {};
    
                columsReport.forEach(col => {
    
                    const backendKey = columnMap[col];
    
                    row[col] = element[backendKey] ?? "";
    
                });
    
                return row;
            });
    
        };

    return(
        <div className="AuditoryClicksReport">
            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Auditoria de clicks'}/>
            </div>

            <div className="totalsBalanceC">
                <LabelValue title={"No. Registros"} value={<b>{moneyFormat(tableData.length)}</b>} />
                <LabelValue title={"Diferencia acumulada"} value={<b>{moneyFormat(acDiference)}</b>} />
            </div>

            <div className="settingsReport">

                <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                <div className="rangeInput">
                    <input className='rangeINput' type="date" onChange={(e)=>{
                        setStart_date(e.target.value)
                    }}/>
                    <span>-</span>
                    <input className='rangeINput' type="date" onChange={(e)=>{
                        setEnd_date(e.target.value)
                    }}/>
                </div>

                <ButtonMenu
                    title={"Mas Ajustes"}
                    children={<i className="fa-solid fa-sliders" />}
                    noRotate={true}
                    onClick={()=>{
                        setVisibleSettings(!visibleSettings)
                    }}
                />

                <ButtonMenu 
                    title={"Agregar a favoritos"} 
                    children={<i className="fa-regular fa-star" />} 
                    noRotate={true} 
                />

                <AiButton 
                    attached={tableData} 
                    useAiAssistant={useAiAssistant}
                    sugerence={[
                        {text:'¿Que representa este informe?',context:`Clicks - Reporte`},
                        {text:'Realiza un analisis de este informe',context:`Clicks - Reporte`},
                        {text:'¿Que acciones me recomiendas basado en este informe?',context:`Clicks - Reporte`}
                    ]}
                />

                <ButtonDownload 
                    info={setInfoForReportDownload()}
                    columns={columsReport}
                    title="Informe_Clicks"
                    component={reportRef}
                />

                <FilterReports 
                    hidden={visibleSettings} 
                    columns={columsReport} 
                    filters={filters}
                />
            </div>
            {!loading && (
                <div ref={reportRef}>
                    <TableAuditClicks
                        columns={columsReport}
                        info={tableData}
                        disabled={disabled}
                        useAlert={useAlert}
                        appInfo={appInfo}
                    />
                </div>
            )}
            {loading && (
                <LoadingSpace title={'Cargando informe'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}