import { useState, useEffect } from "react";
import { CardReportBody } from "../components/CardReportBody";
import { postInfo } from "../../../utils/functions";
import './ReportBody.css';

export function ReportBody({ storeInfo, companyId }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const getReports = async () => {
        setLoading(true);
        // Datos de ejemplo
        setTimeout(() => {
            const exampleReports = [
                {
                    id: 1,
                    title: "Reporte de Ventas Mensual",
                    description: "Resumen detallado de ventas del último mes",
                    type: "ventas"
                },
                {
                    id: 2,
                    title: "Estado de Inventario Actual",
                    description: "Inventario completo y alertas de stock",
                    type: "inventario"
                },
                {
                    id: 3,
                    title: "Análisis Financiero Trimestral",
                    description: "Balance e informe financiero completo",
                    type: "financiero"
                },
                {
                    id: 4,
                    title: "Estadísticas de Clientes",
                    description: "Comportamiento y preferencias de clientes",
                    type: "estadisticas"
                },
                {
                    id: 5,
                    title: "Reporte de Productividad",
                    description: "Métricas de rendimiento del equipo",
                    type: "general"
                },
                {
                    id: 6,
                    title: "Proyección de Ventas",
                    description: "Pronóstico para próximo trimestre",
                    type: "ventas"
                }
            ];
            setReports(exampleReports);
            setLoading(false);
        }, 500);
    };

    const handleReportClick = (reportId) => {
        console.log('Ver reporte completo:', reportId);
    };

    useEffect(() => {
        if (storeInfo && storeInfo.id) {
            getReports();
        }
    }, [storeInfo]);

    return (
        <div className="ReportBody">
            <div className="ReportHeader">
                <button className="GenerateReportButton">
                    <i className="fa-solid fa-plus"></i> Generar Nuevo Informe
                </button>
            </div>
            
            {loading ? (
                <div className="ReportLoading">
                    <p>Cargando informes...</p>
                </div>
            ) : (
                <div className="ReportGrid">
                    {reports.map((report) => (
                        <CardReportBody
                            key={report.id}
                            title={report.title}
                            description={report.description}
                            type={report.type}
                            onClick={() => handleReportClick(report.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}