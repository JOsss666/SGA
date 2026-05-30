import { useEffect, useState } from "react";
import { useAppInfo } from "../../../context/context";
import { BoldTitle } from "../components/BoldTitle";
import { ButtonDownload } from "../components/ButtonDownload";
import { ButtonMenu } from "../components/ButtonMenu";
import { AiButton } from "../components/ChatAiComponents/AiButton";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormInput } from "../components/FormInput";
import { LabelValue } from "../components/LabelValue";
import { PathLocation } from "../components/PathLocation";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FilterReports } from "./reports/FilterReports";
import './ElectronicDocuments.css'
import { LoadingSpace } from "./LoadingSpace";
import { postInfo } from "../../../utils/functions";
import { ElectronicDocumentCard } from "../components/ElectronicDocumentCard";

export function ElectronicDocuments(){
    
    // requierements
    const {appInfo} = useAppInfo();

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [searchValue,setSearchValue] = useState('');
    const [visibleSettings,setVisibleSettings] = useState(false)

    // Filters
    const [startDate,setStartDate] = useState();
    const [endDate,setEndDate] = useState();
    const [filters,setFilters] =useState();

    // Info
    const [documents,setDocuments] = useState([]);

    // getters of info
    const getInvoices = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/electronicFacturation/getDocuments',{
            company_id:appInfo.company_id,
            type:'electronic invoice'
        })
        console.log(res);
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.number,
                    value:element
                })
            });
            setDocuments(C)
        }
        setLoading(false)
        setDisabled(false);
    }
    
    useEffect(()=>{
        getInvoices();
    },[])

    return(
        <div className="ElectronicDocuments">
            <div className="headSection">
                <PathLocation />
                <div className="headReport">

                    <BoldTitle text={"Documentos electronicos"} />

                    <DescriptionSpan text={"Consulte sus facturas, notas débito, notas crédito y demas en esta sección"} />

                </div>

                <div className="totalsBalanceC">

                    <LabelValue title={"Total procesos"} value={<b>{documents.length}</b>} />

                    <LabelValue title={"Procesos terminados"} value={<b>{documents.length}</b>} />

                </div>

                <div className="settingsReport">

                    <SearchBar placeholder={"Buscar"} action={setSearchValue}/>

                    <div className="rangeInput">

                        <FormInput type={"date"} title={"Fecha Inicial"} action={setStartDate}/>

                        <span>-</span>

                        <FormInput type={"date"} title={"Fecha Final"} action={setEndDate}/>

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
                        attached={{}}
                        sugerence={[
                            {text:"¿Que proceso deberia priorizar?",context:"Procesos - Balance"},
                            {text:"Realiza un analisis de este informe",context:"Procesos - Balance"},
                            {text:"¿Que acciones me recomiendas basado en este informe?",context:"Procesos - Balance"}
                        ]}
                    />

                    <ButtonDownload
                        info={{}}
                        columns={[]}
                        title={"Informe_instancias_procesos"}
                    />

                    <FilterReports
                        hidden={visibleSettings}
                        columns={[]}
                        filters={filters}
                    />
                </div>
            </div>
            
            <div className="contentSection">
                {!loading && (
                    <div className="documentResults">
                        {documents.map((element,index)=>(
                            <ElectronicDocumentCard info={element.value} key={index}/>
                        ))}
                    </div>
                )}
                {loading && (
                    <LoadingSpace title={'Cargando documentos'} description={'Esto no debe tardar mucho'} />
                )}
            </div>
            
        </div>
    )

}