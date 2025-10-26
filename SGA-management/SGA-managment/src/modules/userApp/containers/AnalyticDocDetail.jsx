import { useLocation } from "react-router-dom";
import { PathLocation } from "../components/PathLocation";
import { LightChart } from "./LightChart";
import './AnalyticDocDetail.css'
import { AiButton } from "../components/ChatAiComponents/AiButton";
import { SearchBar } from "../components/SearchBar";
import { CardRankingAnalytics } from "../components/CardRankingAnalytics";

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
                <div className="Graph">
                    <LightChart title={docName} doc_type={docType} type={'number'}/>
                </div>

                <div className="Search">
                    <SearchBar placeholder={"Buscar"} />
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
        </div>
    )
}
