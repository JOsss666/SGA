import { useState, useEffect } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormButton } from "../components/FormButton";
import { CardAnalytics2, reportTypeConfig } from "../components/CardAnalytics2";
import { useAlert } from "../../../context/context";
import "./Analytics2.css";

const recentReportsData = [
    { title: "Balance General Anual", time: "Hace 2 horas", type: "contabilidad" },
    { title: "Cierre de Caja - Sucursal Norte", time: "Hace 5 horas", type: "caja" },
    { title: "Proyección Ventas Q4", time: "Ayer", type: "ventas" }
];

const fetchReportCounts = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                documentos: 12,
                transacciones: 10,
                inventarios: 8,
                contabilidad: 15,
                procesos: 6,
                usuarios: 5
            });
        }, 500);
    });
};

const FormNewAnalytics = ({ reloadFun }) => (
    <div style={{ padding: "2vh" }}>
        <h3>Generar nuevo reporte</h3>
        <p>Formulario en construcción</p>
        <button onClick={reloadFun}>Cerrar</button>
    </div>
);

export function Analytics2() {
    const { popInAlert } = useAlert();
    const [viewMode, setViewMode] = useState("grid");
    const [reportCounts, setReportCounts] = useState({
        documentos: 0,
        transacciones: 0,
        inventarios: 0,
        contabilidad: 0,
        procesos: 0,
        usuarios: 0
    });
    const [loading, setLoading] = useState(true);

    const loadCounts = async () => {
        setLoading(true);
        try {
            const counts = await fetchReportCounts();
            setReportCounts(counts);
        } catch (error) {
            console.error("Error al cargar conteos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCounts();
        const interval = setInterval(loadCounts, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleNew = () => {
        popInAlert(<FormNewAnalytics reloadFun={loadCounts} />);
    };

    return (
        <div className="Analytics2 appSection">
            <div className="headSection">
                <BoldTitle text="Estadisticas" />
                <DescriptionSpan text="Panel centralizado para seguimiento y analisis de datos" />
            </div>

            <div className="menuBar">
                <div className="optionsBar">
                    <div className="search-wrapper">
                        <SearchBar placeholder="Buscar caja o cuenta" />
                    </div>
                    <div className="actions-wrapper">
                        <i
                            className={`fa-solid fa-bars IconList ${viewMode === "list" ? "active" : ""}`}
                            onClick={() => setViewMode("list")}
                            title="Vista lista"
                        />
                        <i
                            className={`fa-solid fa-table-cells-large IconList ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Vista cuadrícula"
                        />
                        <SelectOptions title="Filtro" options={["ninguno", "documentos", "transacciones", "inventarios", "contabilidad", "procesos", "usuarios"]} />
                        <FormButton text="Generar nuevo" onClick={handleNew}>
                            <i className="fa-solid fa-plus" />
                        </FormButton>
                    </div>
                </div>
            </div>

            <div className={`galleryAnalytics ${viewMode}`}>
                <CardAnalytics2
                    type="documentos"
                    title="Documentos"
                    description="Administra y consulta todos los documentos del sistema."
                    reportsCount={reportCounts.documentos}
                    loading={loading}
                />
                <CardAnalytics2
                    type="transacciones"
                    title="Transacciones"
                    description="Movimientos financieros y operativos detallados."
                    reportsCount={reportCounts.transacciones}
                    loading={loading}
                />
                <CardAnalytics2
                    type="inventarios"
                    title="Inventarios"
                    description="Control de stock, valoración y rotación."
                    reportsCount={reportCounts.inventarios}
                    loading={loading}
                />
                <CardAnalytics2
                    type="contabilidad"
                    title="Contabilidad"
                    description="Balance general, estados de resultados y libros contables."
                    reportsCount={reportCounts.contabilidad}
                    loading={loading}
                />
                <CardAnalytics2
                    type="procesos"
                    title="Procesos"
                    description="Eficiencia, tiempos de ejecución y productividad."
                    reportsCount={reportCounts.procesos}
                    loading={loading}
                />
                <CardAnalytics2
                    type="usuarios"
                    title="Usuarios"
                    description="Gestión de usuarios, roles y permisos."
                    reportsCount={reportCounts.usuarios}
                    loading={loading}
                />
            </div>

            <div className="recent-section">
                <div className="recent-header">
                    <BoldTitle text="Vistos recientemente" />
                    <button className="recent-history-button">
                        Ver historial completo <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
                <DescriptionSpan text="Tus últimos reportes generados" />
                <div className="recent-cards">
                    {recentReportsData.map((item, index) => {
                        const config = reportTypeConfig[item.type] || reportTypeConfig.documentos;
                        return (
                            <div key={index} className="recent-card">
                                <div className="recent-card-icon" style={{ backgroundColor: config.bgColor }}>
                                    <i className={config.icon} style={{ color: config.iconColor }}></i>
                                </div>
                                <div className="recent-card-content">
                                    <span className="recent-item-title">{item.title}</span>
                                    <span className="recent-item-time">{item.time}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}