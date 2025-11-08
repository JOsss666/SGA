import { data, useLocation } from "react-router-dom";
import { PathLocation } from "../components/PathLocation";
import { LightChart } from "./LightChart";
import './AnalyticDocDetail.css'
import { AiButton } from "../components/ChatAiComponents/AiButton";
import { SearchBar } from "../components/SearchBar";
import { CardRankingAnalytics } from "../components/CardRankingAnalytics";
import { BoldTitle } from "../components/BoldTitle";
import { FormButton } from "../components/FormButton";
import { FormInput } from "../components/FormInput";
import { AnalyticDocDetailTable } from "./AnalyticDocDetailTable";
import { useEffect, useState } from "react";
import { media, mediana, moda, varianza, desviacionEstandar, CoefVari } from "../../../utils/AnalyticsFunctions";
import { SelectOptions } from "../components/SelectOptions";

const DOC_NAMES = {
    OCS: "Ordenes de cliente (OC)",
    OPS: "Ordenes de producción (OP)",
    DCS: "Documentos de compra (DC)",
    CIS: "Consumos de inventario (CI)",
    FVS: "Facturas de venta (FV)",
    TRS: "Transacciones (TR)",
};

export function AnalyticDocDetail() {
    const location = useLocation();
    const [tableData, setTableData] = useState([]);
    const filterRoute = location.pathname.split('/analytics/');
    const pathSections = filterRoute[1] ? filterRoute[1].split('/') : [];
    const docType = pathSections[0] || 'DEFAULT';
    const docName = DOC_NAMES[docType] || "Documento desconocido";
    const [procesData,setProcesData] = useState([]);
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [status, setStatus] = useState("");
    const [filter, setFilter] = useState("");
    const [order, setOrder] = useState("");
    const [limit, setLimit] = useState("");
    const [analytics,setAnalytics] = useState({
            media:0,
            mediana:0,
            moda:0,
            varianza:0,
            desviacionEstandar:0,
            cv:0
        })
    const [loading, setLoading] = useState(false);

    const applyFilters = async (event) => {
        event.preventDefault();
        setLoading(true);

        const body = {      
            doc_type: docType,
            dateStart,
            dateEnd,
            status,
            filterField: "state", 
            filterValue: filter,
            orderBy: order,
            limit
        };
        setLoading(false);
    };

    const calcNewAnalyticValues = async(data)=>{
        let newAnalytic = {
            media:0,
            mediana:0,
            moda:0,
            varianza:0,
            desviacionEstandar:0,
            cv:0
        }
        newAnalytic["media"] = (media(data)).toFixed(2);
        newAnalytic["mediana"] = (mediana(data)).toFixed(2);
        newAnalytic["moda"] = moda(data);
        newAnalytic["varianza"] = (varianza(data)).toFixed(2);
        newAnalytic["desviacionEstandar"] = (desviacionEstandar(data)).toFixed(2);
        newAnalytic["cv"] = `${(CoefVari(data)).toFixed(1)}%`;
        setAnalytics(newAnalytic);
    }

    useEffect(()=>{
        calcNewAnalyticValues(procesData);
    },[procesData])

    useEffect(()=>{
        let newProcesD = []
        tableData.length> 0 && tableData.forEach(element => {
            newProcesD.push(element.total)
        });
        setProcesData(newProcesD);
    },[tableData])


    return (
        <div className="AnalyticDocDetail">
            <div className="HeaderAnalytics">
                <PathLocation />
                <AiButton sugerence={[
                    {text:'¿Que representa esta estadistica?'},
                    {text:'Realiza un analisis de esta estadistica'},
                    {text:'¿Que acciones me recomiendas basado en esta estadistica?'}
                ]}/>
            </div>

            <div className="ContainerAnalitycs">
                <div className="ContainerData">
                    <div className="Graph">
                        <LightChart
                            title={docName}
                            doc_type={docType}
                            type="number"
                            dateStart={dateStart}
                            dateEnd={dateEnd}
                            status={status}
                            filterField="state"
                            filterValue={filter}
                            orderBy={order}
                            limit={limit}
                            updateFatherData={setTableData}
                        />
                    </div>

                    <div className="TableValues">
                        <AnalyticDocDetailTable tableData={tableData} />
                    </div>
                </div>

                <div className="Ranking">
                    <div className="gridOptionsDocuments">
                        <CardRankingAnalytics title={"Promedio"} value={analytics.media} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-circle-info"/>}/>
                        <CardRankingAnalytics title={"Mediana"} value={analytics.mediana} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Moda"} value={analytics.moda} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Varianza"} value={analytics.varianza} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Desviación estandar"} value={analytics.desviacionEstandar} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Coeficiente de variación"} value={analytics.cv} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                    </div>
                </div>

                <div className="Search">
                    <SearchBar placeholder={"Buscar"} />
                    <BoldTitle text={"Fecha Inicio"} />
                    <FormInput placeholder={"Fecha Inicio"} type={"date"} value={dateStart} action={setDateStart}/>
                    <BoldTitle text={"Fecha Fin"} />
                    <FormInput placeholder={"Fecha Fin"} type={"date"} value={dateEnd} action={setDateEnd}/>
                    <div className="SearchElements">
                        <div>
                            <BoldTitle text={"Estado"} />
                            <FormInput placeholder={"Estado"} type={"text"} value={status} action={setStatus}/>
                        </div>
                        <div>
                            <BoldTitle text={"Filtro"} />
                            <SelectOptions options={["Ninguno",'Usuario','Valor','Fecha']}/>
                        </div>
                    </div>
                    <BoldTitle text={"Orden"} />
                    <SelectOptions options={["Ninguno",'Valor (Ascendente)','Valor (Descendente)','Fecha (Ascendente)','Fecha (Descendente)']}/>
                    <BoldTitle text={"Cantidad"} />
                    <FormInput placeholder={"Ej max 10"} type={"number"} value={limit} action={setLimit}/>
                    <FormButton text={"Aplicar filtros"} loading={loading} action={applyFilters}/>
                </div>

            </div>

            

            
        </div>
    )
}
