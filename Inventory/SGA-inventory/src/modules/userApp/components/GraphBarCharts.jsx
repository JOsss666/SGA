import { useEffect, useRef } from "react";
import { createChart, HistogramSeries } from "lightweight-charts";
import { SelectOptions } from "./SelectOptions";
import { MoreOptions } from "./MoreOptions";
import "./GraphBarCharts.css";

export function GraphBarCharts({ title = "Total Sales", onChangePeriod, data = [] }) {
    const chartContainerRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 315,

        layout: {
            background: { color: "#ffffff" },
            textColor: "#6b7280",
        },

        grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
        },

        watermark: { visible: false },
        rightPriceScale: { visible: false },

        leftPriceScale: {
            visible: true,
            borderVisible: false,
        },

        timeScale: {
            borderVisible: false,
            fixLeftEdge: true,
            fixRightEdge: true,

            tickMarkFormatter: (_t, index) => String(index + 1),
        },

        handleScroll: false,
        handleScale: false,

        crosshair: {
            mode: 1,
            vertLine: { visible: false },
            horzLine: { visible: false },
        },
        });

        const barSeries = chart.addSeries(HistogramSeries, {
        
        color: "#d1d5db",
        priceLineVisible: false,
        lastValueVisible: false,

        priceFormat: {
            minMove: 1,
            formatter: value => COP.format(value),
        },
        });

        
        const chartData = (data.length ? data : [
        450, 280, 520, 460, 410, 820,
        500, 440, 600, 580, 390, 470
        ]).map((v, i) => {
        const month = String(i + 1).padStart(2, "0");
        return {
            time: Date.parse(`2025-${month}-01`) / 1000,
            value: v,
            index: i,
        };
        });

        let styledData = chartData.map(item => ({
        ...item,
        color: "#d1d5db",
        }));

        barSeries.setData(styledData);

        // HOVER EN VERDE
        chart.subscribeCrosshairMove(param => {
        if (!param.time) {
            barSeries.setData(styledData);
            return;
        }

        // CAPTURAMOS EL INDICE EN DONDE ESTA EL MOUSE
        const i = chartData.findIndex(d => d.time === param.time);
        if (i === -1) return;

        const newData = chartData.map((item, idx) => ({
            ...item,
            color: idx === i ? "#22c55e" : "#d1d5db",
        }));

        barSeries.setData(newData);
        });

        const resize = () => {
        chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
        });
        };

        window.addEventListener("resize", resize);

        return () => {
        window.removeEventListener("resize", resize);
        chart.remove();
        };
    }, [data]);

    return (


        <div className="GraphBarCharts">
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
                { text: "Reportar Problema", icon: <i className="fa-solid fa-flag" /> },
                ]}
            />
            </div>
        </div>

        <div ref={chartContainerRef} className="PlotGraph" />
        </div>

    );
}
