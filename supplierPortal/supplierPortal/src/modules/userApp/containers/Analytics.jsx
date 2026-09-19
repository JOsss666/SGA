
import "./Analytics.css";
import { Route, Routes } from 'react-router-dom';
import { LightChart } from "./LightChart";
import { DespleList } from "../components/DespleList";
import { useLocation, useNavigate } from "react-router-dom";
import { SearchBar } from "../components/SearchBar";
import { CardRankingAnalytics } from "../components/CardRankingAnalytics";
import { useEffect } from "react";
import { PathLocation } from "../components/PathLocation";
import { AnalyticDocDetail } from "./AnalyticDocDetail";
import { ProcessInstanceAnalytics } from "./Analytics/ProcessInstanceAnalycs";

export function Analytics() {
    const navigate = useNavigate();
    const location = useLocation();

    // 🔍 Depuración: ver si el componente se monta correctamente
    useEffect(() => {
        console.log("🧩 Analytics.jsx montado correctamente");
    }, []);

    const handleNavigate = (path) => {
        console.log("📍 Navegando a:", path);
        navigate(`${location.pathname}/${path}`);
    };

    const loadLastOp = () => {
        console.log("🔁 Ejecutando loadLastOp()");
        // Aquí iría la lógica para recargar datos si aplica
    };

    const popInAlert = (content) => {
        console.log("🚨 popInAlert ejecutado con contenido:", content);
        // Simula la función de alerta para pruebas
    };

    return (
        <div className="Analytics">
            <Routes>
                <Route path='/' element={
                    <>
                        <div className="ContainerAnalitycs">
                        <div className="Graph">
                            <LightChart 
                                title="Compras" 
                                doc_type="Purchase Document" 
                                type="Purchase Document" 
                            />
                        </div>
                        <div className="Search">
                            <SearchBar placeholder={"Buscar"} />
                            <div className="spaceSelectReports">
                                <DespleList children={<i className="fa-solid fa-book" />} father={{title: "Documentos",}}
                                    options={[
                                        {
                                            title: "Ordenes de cliente (OC)",
                                            children: <i className="fa-solid fa-file-contract" />,
                                            action: handleNavigate,
                                            path: "Client_Order",
                                        },
                                        {
                                            title: "Ordenes de producción (OP)",
                                            children: <i className="fa-solid fa-file-lines" />,
                                            action: handleNavigate,
                                            path: "Production_Order",
                                        },
                                        {
                                            title: "Documentos de compra (DC)",
                                            children: <i className="fa-solid fa-file-lines" />,
                                            action: handleNavigate,
                                            path: "Purchase_Document",
                                        },
                                        {
                                            title: "Consumos de inventario (CI)",
                                            children: <i className="fa-solid fa-file-lines" />,
                                            action: handleNavigate,
                                            path: "Inventory_Consume",
                                        },
                                        {
                                            title: "Facturas de venta (FV)",
                                            children: <i className="fa-solid fa-file-invoice" />,
                                            action: handleNavigate,
                                            path: "Sell_Invoice",
                                        },
                                        {
                                            title: "Transacciones (TR)",
                                            children: <i className="fa-solid fa-magnifying-glass-chart" />,
                                            action: handleNavigate,
                                            path: "Transaction",
                                        },
                                        {
                                            title: "Informes adicionales",
                                                options: [
                                                    {
                                                    title: "Informe Costos Operativos",
                                                    children: <i className="fa-solid fa-book" />,
                                                    },
                                                ],
                                        },
                                    ]}
                                />
                            </div>
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
                    </>
                } />
                <Route path='/Client_Order' element={<AnalyticDocDetail/>}/>
                <Route path='/Production_Order' element={<AnalyticDocDetail/>}/>
                <Route path='/Purchase_Document' element={<AnalyticDocDetail/>}/>
                <Route path='/Inventory_Consume' element={<AnalyticDocDetail/>}/>
                <Route path='/Sell_Invoice' element={<AnalyticDocDetail/>}/>
                <Route path='/Transaction' element={<AnalyticDocDetail/>}/>
                <Route path='/ProcessInstances' element={<ProcessInstanceAnalytics/>}/>
            </Routes>
        </div>
    );
}
