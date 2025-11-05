import { useLocation } from "react-router-dom";
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
import { postInfo } from "../../../utils/functions";

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

    const filterRoute = location.pathname.split('/analytics/');
    const pathSections = filterRoute[1] ? filterRoute[1].split('/') : [];
    const docType = pathSections[0] || 'DEFAULT';
    const docName = DOC_NAMES[docType] || "Documento desconocido";

    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [status, setStatus] = useState("");
    const [filter, setFilter] = useState("");
    const [order, setOrder] = useState("");
    const [limit, setLimit] = useState("");
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


        console.log("🔎 Enviando al backend:", body);

        const res = await postInfo("/getDocAnalyticDocNumber", body);

        console.log("🔎 Respuesta del backend:", res);

        setLoading(false);
    };

    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        const body = {
        type: "DOC_ANALYTIC",
        doc_type: docType 
        };

        postInfo("/getDocAnalyticDocNumberTable", body).then((res) => {
            console.log("Resultado:", res);
            setTableData(res[1]); 
        });

    }, []);

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
                        />
                    </div>

                    <div className="TableValues">
                        <AnalyticDocDetailTable tableData={tableData} />
                    </div>
                </div>

                <div className="Ranking">
                    <div className="gridOptionsDocuments">
                        <CardRankingAnalytics title={"Pedidos"} value={5200} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Compras"} value={5200} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Ventas"} value={5200} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Consumo"} value={5200} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
                        <CardRankingAnalytics title={"Consumo"} value={5200} text={"+50% VS el mes pasado"} icon={<i className="fa-solid fa-ranking-star"/>}/>
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
                            <FormInput placeholder={"Filtro"} type={"text"} value={filter} action={setFilter}/>
                        </div>
                    </div>
                    <BoldTitle text={"Orden"} />
                    <FormInput placeholder={"Orden"} type={"text"} value={order} action={setOrder}/>
                    <BoldTitle text={"Cantidad"} />
                    <FormInput placeholder={"Cantidad"} type={"number"} value={limit} action={setLimit}/>
                    <FormButton text={"Aplicar filtros"} loading={loading} action={applyFilters}/>
                </div>

            </div>

            

            
        </div>
    )
}
