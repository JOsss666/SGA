import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonDownload } from "../../components/ButtonDownload";
import { ButtonMenu } from "../../components/ButtonMenu";
import { AiButton } from "../../components/ChatAiComponents/AiButton";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { PathLocation } from "../../components/PathLocation";
import { SearchBar } from "../../components/SearchBar";
import { SelectOptions } from "../../components/SelectOptions";
import './BriefCaseReport.css'
import './ReportDocuments.css'
import { FilterReports } from "./FilterReports";
import { TableReport } from "../TableReport";
import { postInfo } from "../../../../utils/functions";
import { useAppInfo } from "../../../../context/context";
import { LoadingSpace } from "../LoadingSpace";


export function BriefCaseReport(){

    //Requirements
    const {appInfo,userConfig} = useAppInfo();

    // Control
    const [info,setInfo] = useState({});
    const [loading,setLoading] = useState(true);
    const [disabled,setDisabled] = useState(false);
    const [searchValue,setSearchValue] = useState('');
    const [startDate, setStart_date] = useState();
    const [endDate,setEnd_date] = useState();
    const [visibleSettings,setVisibleSettings] = useState(false);

    // FormSettings

    const columsTr = [
        "Terceros",
        "Habilitado",
        "Plazo",
        "Cupo_max",
        "Cupo_disponible",
        "Cartera",
        "Corriente",
        "Vencido",
    ]

    const filters = [];

    const FormSettings = {
        columsTr
    }

    // Getters of info
    const getThirdParties = async(id,limit)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/getThirdParties',{
            company_id:appInfo.company_id,
            comercialInfo:true
        });
        console.log(res);
        if(res[0]){
            setInfo(res[1])
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getThirdParties();
    },[])

    return(
        <div className="BriefCaseReport ReportDocument">
            <div className="headReport">
                <PathLocation/>
                <BoldTitle text={'Informe de cartera'}/>
                <DescriptionSpan text={'Consulte la cartera de los terceros de su aplicación'}/>
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
            {!loading && (
                <div className="bodyreport">
                    <TableReport columns={columsTr} info={info} searchValue={searchValue}/>
                </div>
            )}
            {loading && (
                <LoadingSpace title={'Cargando cartera'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}