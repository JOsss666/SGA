// ChartComponent.jsx
import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import './ChartComponent.css';

export function ChartComponent({ data }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const resizeObserverRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Limpiar gráfico anterior si existe
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        // Crear gráfico
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight || 100,
            grid: {
                vertLines: { color: '#ffffff' },
                horzLines: { color: '#ffffff' },
            },
            timeScale: {
                borderColor: '#ccc',
                textColor: '#333',
            },
            rightPriceScale: {
                borderColor: '#ccc',
                textColor: '#333',
            },
        });

        chartRef.current = chart;

        // Asegúrate de que esto exista
        if (typeof chart.addAreaSeries !== 'function') {
        console.error("addLineSeries no está definido — verifica si 'createChart' es correcto");
        return;
        }
        const lineSeries = chart.addAreaSeries({
            topColor: 'rgba(0, 150, 255, 0.4)',    
            bottomColor: 'rgba(0, 150, 255, 0)',   
            lineColor: 'rgba(0, 150, 255, 1)',     
            lineWidth: 2, 
        });
        lineSeries.setData(data);

        // Resize handling
        resizeObserverRef.current = new ResizeObserver(() => {
            chart.applyOptions({
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight || 100,
            });
        });
        resizeObserverRef.current.observe(chartContainerRef.current);

        // Cleanup
        return () => {
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data]);

    return (
        <div
            ref={chartContainerRef}
            className="ChartComponent"
            style={{ width: '100%', height: '120px' }}
        />
    );
}
