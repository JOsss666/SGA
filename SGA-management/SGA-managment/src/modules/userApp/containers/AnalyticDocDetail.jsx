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
                <div className="ContainerData">
                    <div className="Graph">
                        <LightChart title={docName} doc_type={docType} type={'number'}/>
                    </div>

                    <div className="TableValues">
                        <AnalyticDocDetailTable tableData={{
                            headers: ['Fecha', 'Cantidad de documentos'],
                            rows: [
                                ['2024-01-01', 120],
                                ['2024-01-02', 150],
                                ['2024-01-03', 100],
                                ['2024-01-04', 180],
                                ['2024-01-05', 200],
                            ]
                        }}/>
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
                    <FormInput placeholder={"Fecha Inicio"} type={"date"}/>
                    <BoldTitle text={"Fecha Fin"} />
                    <FormInput placeholder={"Fecha Fin"} type={"date"}/>
                    <div className="SearchElements">
                        <div>
                            <BoldTitle text={"Estado"} />
                            <FormInput placeholder={"Estado"} type={"text"}/>
                        </div>
                        <div>
                            <BoldTitle text={"Filtro"} />
                            <FormInput placeholder={"Filtro"} type={"text"}/>
                        </div>
                    </div>
                    <BoldTitle text={"Orden"} />
                    <FormInput placeholder={"Orden"} type={"text"}/>
                    <BoldTitle text={"Cantidad"} />
                    <FormInput placeholder={"Cantidad"} type={"number"}/>
                    <FormButton text={"Aplicar filtros"} action={()=>{}}/>
                </div>

            </div>

            

            
        </div>
    )
}
