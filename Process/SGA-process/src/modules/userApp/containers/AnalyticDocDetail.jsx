import { useLocation } from "react-router-dom";
import { PathLocation } from "../components/PathLocation";
import { LightChart } from "./LightChart";
import './AnalyticDocDetail.css'
import { AiButton } from "../components/ChatAiComponents/AiButton";

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
            <PathLocation />
            <AiButton sugerence={[
                {text:'¿Que representa esta estadistica?'},
                {text:'Realiza un analisis de esta estadistica'},
                {text:'¿Que acciones me recomiendas basado en esta estadistica?'}
            ]}/>
            <div className="Graph">
                <LightChart title={docName} doc_type={docType} type={'number'}/>
            </div>
        </div>
    )
}
