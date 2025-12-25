import Chart from "react-apexcharts";
import { SelectOptions } from "./SelectOptions";
import { MoreOptions } from "./MoreOptions";
import "./GraphHeatMap.css";

// DATOS DE PRUEBA
const mockSeries = [
    { name: "", data: [0, 1, 2, 3, 0, 4, 2, 2, 3, 0, 4, 2,] },
    { name: "", data: [1, 0, 0, 2, 3, 1, 0, 0, 2, 3, 1, 0,] },
    { name: "", data: [0, 2, 4, 1, 0, 3, 2, 4, 1, 0, 3, 2,] },
    { name: "", data: [3, 1, 0, 0, 2, 4, 1, 0, 0, 2, 4, 1,] },
    { name: "", data: [2, 3, 1, 0, 0, 2, 4, 1, 0, 0, 2, 4,] },
    { name: "", data: [0, 1, 0, 2, 3, 1, 0, 0, 2, 3, 1, 0,] },
    { name: "", data: [1, 0, 2, 3, 1, 0, 2, 2, 3, 1, 0, 2,] }
    ];

    export function GraphHeatMap({title = "Total Sales", onChangePeriod, series,}) {
    const finalSeries =
        Array.isArray(series) && series.length > 0 ? series : mockSeries;

    // Tamaño para hacer celdas cuadradas
    const cellSize = 46;
    const height = cellSize * finalSeries.length;

    const colorScale = [
        { from: 0, to: 0, color: "#ebedf0" },
        { from: 1, to: 2, color: "#9be9a8" },
        { from: 3, to: 3, color: "#40c463" },
        { from: 4, to: 4, color: "#30a14e" },
        { from: 5, to: 10, color: "#216e39" }
    ];

    const options = {
        chart: {
        type: "heatmap",
        toolbar: { show: false },
        background: "#ffffff",
        animations: { enabled: false }
        },

        dataLabels: { enabled: false },

        legend: {
        formatter: () => "",
        labels: { colors: "transparent" }
        },

        plotOptions: {
        heatmap: {
            radius: 0,
            enableShades: false,
            colorScale: { ranges: colorScale }
        }
        },

        xaxis: {
        categories: [
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"
        ],
        axisBorder: { show: false },
        axisTicks: { show: false }
        },

        yaxis: {
        labels: { show: false }
        },

        tooltip: {
        theme: "light",
        y: {
            formatter: v =>
            v === 0 ? "No activity" : `${v} activities`
        }
        },

        grid: {
        padding: { left: 0, right: 0, top: 10, bottom: 0 }
        }
    };

    return (
        <div className="GraphHeatMap">
            <div className="HeadGraph">
                <h3 className="TitleGraph">{title}</h3>

                <div className="OptionsGraph">
                <SelectOptions
                    action={onChangePeriod}
                    options={["Por día", "Por mes", "Por año"]}
                />

                <MoreOptions
                    options={[
                    { text: "Refrescar", icon: <i className="fa-solid fa-rotate-right" /> },
                    { text: "Descargar", icon: <i className="fa-solid fa-arrow-down" /> },
                    { text: "Compartir", icon: <i className="fa-solid fa-share-nodes" /> },
                    { text: "Reportar Problema", icon: <i className="fa-solid fa-flag" /> }
                    ]}
                />
                </div>
            </div>

            <div className="PlotGraph">
                <Chart
                options={options}
                series={finalSeries}
                type="heatmap"
                height={height}
                />
            </div>
        </div>
    );
}
