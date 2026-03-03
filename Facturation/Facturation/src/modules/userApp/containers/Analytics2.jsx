import { useState, useEffect } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormButton } from "../components/FormButton";
import { CardAnalytics2, reportTypeConfig } from "../components/CardAnalytics2";
import { useAlert } from "../../../context/context";
import { useMemo } from 'react';

import "./Analytics2.css";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ProcessInstanceAnalytics } from "./Analytics/ProcessInstanceAnalycs";

const recentReportsData = [
    { title: "Instancias de procesos", time: "Hace 2 horas", type: "contabilidad" },
    { title: "Cierres de Caja", time: "Hace 5 horas", type: "caja" },
    { title: "Transacciones", time: "Ayer", type: "ventas" }
];


const availableReports = [
    {
        type: 'documentos',
        title: 'Documentos',
        description: 'Administra y consulta todos los documentos del sistema.',
        count: 12
    },
    {
        type: 'transacciones',
        title: 'Transacciones',
        description: 'Movimientos financieros y operativos detallados.',
        count: 10
    },
    {
        type: 'inventarios',
        title: 'Inventarios',
        description: 'Control de stock, valoración y rotación.',
        count: 8
    },
    {
        type: 'contabilidad',
        title: 'Contabilidad',
        description: 'Balance general, estados de resultados y libros contables.',
        count: 15
    },
    {
        type: 'procesos',
        title: 'Procesos',
        description: 'Eficiencia, tiempos de ejecución y productividad.',
        count: 6,
        path:'processInstances'
    },
    {
        type: 'usuarios',
        title: 'Usuarios',
        description: 'Gestión de usuarios, roles y permisos.',
        count: 5
    },
    {
        type: 'transacciones',
        title: 'Tesoreria',
        description: 'Estadistica en construcción',
        count: 10
    },
    {
        type: 'transacciones',
        title: 'Facturación',
        description: 'Estadistica en construcción',
        count: 4
    }
];


const FormNewAnalytics = ({ reloadFun }) => (
    <div style={{ padding: "2vh" }}>
        <h3>Generar nuevo reporte</h3>
        <p>Formulario en construcción</p>
        <button onClick={reloadFun}>Cerrar</button>
    </div>
);

export function Analytics2() {
    // Requirements
    const { popInAlert } = useAlert();
    const [viewMode, setViewMode] = useState("grid");
    const navigate = useNavigate();
    const params = useParams();

    // Control
    const [searchValue,setSearchValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [typeFilter,setTypeFilter] = useState('ninguno');

    const handleNew = () => {
        popInAlert(<FormNewAnalytics reloadFun={loadCounts} />);
    };

    const filteredReports = useMemo(() => {
        if (!searchValue && typeFilter == 'ninguno') return availableReports;

        const query = searchValue.toLowerCase();

        return availableReports.filter(report => {
            return (
                report.title.toLowerCase().includes(query) || 
                report.description.toLowerCase().includes(query) ||
                typeFilter != 'ninguno'? report.type == typeFilter:true
            );
        });
    }, [searchValue,typeFilter]);


    // Functions

   const handleNavigate = (path) => {
        if (path) {
            navigate(path);
        }
    };

    return (
        <Routes>
            <Route path="/" element={
                <>
                    <div className="Analytics2 appSection">
                        <div className="headSection">
                            <BoldTitle text="Estadisticas" />
                            <DescriptionSpan text="Panel centralizado para seguimiento y analisis de datos" />
                        </div>

                        <div className="menuBar">
                            <div className="optionsBar">
                                <div className="search-wrapper">
                                    <SearchBar placeholder="Buscar caja o cuenta" action={setSearchValue} />
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
                                    <SelectOptions action={setTypeFilter} title="Filtro" options={["ninguno", "documentos", "transacciones", "inventarios", "contabilidad", "procesos", "usuarios"]} />
                                    <FormButton text="Generar nuevo">
                                        <i className="fa-solid fa-plus" />
                                    </FormButton>
                                </div>
                            </div>
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
                        <div className={`galleryAnalytics gallAn_${viewMode}`}>
                            {filteredReports.map((element,index)=>(
                                <CardAnalytics2
                                    key={index}
                                    title={element.title}
                                    type={element.type}
                                    description={element.description}
                                    reportsCount={element.count}
                                    onClick={()=>{
                                        console.log(element.path)
                                        handleNavigate(element.path)
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </>
            }/>
            <Route path="processInstances" element={<ProcessInstanceAnalytics/>}/>
        </Routes>
    );
}