import { useState } from "react";
import { ActionTab } from "../components/ActionTab";
import { CentralPanelCard } from "../components/CentralPanelCard";
import { ChartCard } from "../components/ChartCard";
import { SideItem } from "../components/SideItem";
import { IndicatorsPanel } from "../components/IndicatorsPanel";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormInput } from "../components/FormInput";
import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
import { GeneralSettings } from "./SettingsSections/GeneralSettings";
import { AccountSettings } from "./SettingsSections/AccountSettings";
import { AlertsSettings } from "./SettingsSections/AlertsSettings";
import { StylesSettings } from "./SettingsSections/StylesSettings";
import { BillingSettings } from "./SettingsSections/BillingSettings";
import { SecuritySettings } from "./SettingsSections/SecuritySettings";
import { NoResults } from "./NoResults";
import { SystemSettings } from "./SettingsSections/SystemSettings";

import "./ControlPanel.css";

function BarChartMock() {
    return <div>📊 Gráfica de barras</div>;
}

function LineChartMock() {
    return <div>📈 Gráfica de líneas</div>;
}

export function ControlPanel() {

    const [searchValue, setSearchValue] = useState("");

    const chartsConfigCentral = [
        {
            id: 1,
            title: "Ventas por mes",
            component: <BarChartMock />
        },
        {
            id: 2,
            title: "Ingresos por categoría",
            component: <LineChartMock />
        },
        {
            id: 3,
            title: "Ingresos por categoría",
            component: <LineChartMock />
        },
        {
            id: 4,
            title: "Ingresos por categoría",
            component: <LineChartMock />
        }
    ];

    const chartsConfigIndicators = [
        {
            id: 1,
            title: "Ventas por mes",
            component: <BarChartMock />
        },
        {
            id: 2,
            title: "Ingresos por categoría",
            component: <LineChartMock />
        }
    ];

    const indicators = [
        { name: "Indicador 1", value: 1200000000, color: "#4CAF50" },
        { name: "Indicador 2", value: 3000000000, color: "#2196F3" },
        { name: "Indicador 3", value: 4000000000, color: "#FFC107" },
        { name: "Indicador 4", value: 5000000000, color: "#FF5722" },
        { name: "Indicador 5", value: 599000000, color: "#9C27B0" },
        { name: "Indicador 6", value: 2560000000, color: "#00BCD4" }
    ];

    return (
        <div className="ControlPanel">

            <div className="CentralPanel">

                <div className="TopActions">
                    <ActionTab label="Movimientos" />
                    <ActionTab label="Estadísticas" />
                    <ActionTab label="Alertas y avisos" />
                    <ActionTab label="Terceros" />
                    <ActionTab label="Acciones rápidas" />
                    <ActionTab label="Personal" />
                </div>

                <div className="PanelCards">
                    <CentralPanelCard title="Usuarios Activos" value="54/60" delta="+2%" />
                    <CentralPanelCard title="Pedidos Completados" value="124/200" delta="+12%" />
                    <CentralPanelCard title="Transacciones diarias" value="1000" delta="+2%" />
                    <CentralPanelCard title="Productos en mínimos" value="100" delta="+2%" />
                    <CentralPanelCard title="Nuevos pedidos" value="200" delta="+2%" />
                </div>

                <div className="ContentGraph">

                    <div className="ContentGraphLeft">
                        <div className="Graph">
                            {chartsConfigCentral.map(chart => (
                                <div key={chart.id} className="Charts">
                                    <ChartCard title={chart.title}>
                                        {chart.component}
                                    </ChartCard>
                                </div>
                            ))}
                        </div>

                        <div className="GraphSearchBar">
                            <SearchBar placeholder="Buscar" action={setSearchValue} />
                            <div className="rangeInput">
                                <FormInput type="date" />
                                <span>-</span>
                                <FormInput type="date" />
                            </div>
                            <SelectOptions
                                options={[
                                    "Ascendente (fecha)",
                                    "Descendente (fecha)",
                                    "Ascendente (Nombre)",
                                    "Descendente (Nombre)",
                                ]}
                                title="Orden"
                            />
                        </div>
                    </div>

                    <div className="ContentGraphRight">
                        <div className="GraphBars">
                            {chartsConfigIndicators.map(chart => (
                                <div key={chart.id} className="Charts">
                                    <ChartCard title={chart.title}>
                                        {chart.component}
                                    </ChartCard>
                                </div>
                            ))}
                        </div>

                        <div className="SidePanel">
                            <Routes>
                                <Route path="" element={<GeneralSettings/>} />
                            </Routes>
                        </div>
                    </div>

                </div>

            </div>

            <IndicatorsPanel indicators={indicators} />

        </div>
    );
}
