import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { PathLocation } from '../../components/PathLocation'
import { SearchBar } from '../../components/SearchBar'
import { FormInput } from '../../components/FormInput';
import { SelectOptions } from '../../components/SelectOptions';
import { ButtonMenu } from '../../components/ButtonMenu';
import { ButtonDownload } from '../../components/ButtonDownload';
import { AiButton } from '../../components/ChatAiComponents/AiButton';
import { useEffect, useState, useRef, useMemo } from "react";
import { FilterReports } from './FilterReports'
import { postInfo } from "../../../utils/functions";
import { LoadingSpace } from "../LoadingSpace";
import { TableClicks } from "../TableClicks";
import './ClicksReport.css'

export function ClicksReport({appInfo,userInfo,userConfig,popInAlert,popOutAlert,useAlert ,useAiAssistant}){

    const [info,setInfo] = useState([]);
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true);
    const [searchValue,setSearchValue] = useState('');
    const [start_date,setStart_date] = useState(undefined);
    const [end_date,setEnd_date] = useState(undefined);
    const [visibleSettings,setVisibleSettings] = useState(false); 

    const reportRef = useRef();

    const filters = {};

    const columsReport = [
        "Maquina",
        "Clicks",
        "Responsable",
        "Descripcion",
        "Fecha"
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

        let res = await postInfo('/zj852/getHistorialClicksControl', settingsReport);

        if(res[0]){
            console.log("DATA BACKEND:", res[1]);
            setInfo(res[1]);
        }

        setLoading(false);
        setDisabled(false);
    }

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

    const columnMap = {
        "Maquina": "asset_name",
        "Clicks": "initialClicks",
        "Responsable": "responsable",
        "Descripcion": "description",
        "Fecha": "created_at"
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
        <div className="ClicksReport ReportDocument">

            <div className="headReport">
                <PathLocation key="path-location-report"/>
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
                    <TableClicks 
                        columns={columsReport} 
                        info={tableData}
                        disabled={disabled}
                        useAlert={useAlert}
                        appInfo={appInfo}
                    />
                </div>
            )}

            {loading && (
                <LoadingSpace 
                    title={'Cargando registro de clicks'} 
                    description={'Esto no debe tardar mucho'}
                />
            )}

        </div>
    )
}