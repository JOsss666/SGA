import { useAlert } from "../../../context/context";
import './MovementsInventory.css'
import { postInfo } from "../../../utils/functions";
import { useAppInfo } from "../../../context/context";
import { useEffect, useState, useRef  } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { NormalCard } from "../components/NormalCard";
import { TableReport } from "./TableReport";
import Chart from "react-apexcharts";
import { createChart, HistogramSeries } from "lightweight-charts";
import { FormButton } from "../components/FormButton";
import { SelectOptions } from "../components/SelectOptions";
import { MoreOptions } from "../components/MoreOptions";



export function MovementsInventory(){

    const navigate = useNavigate();
    const location = useLocation()
    const {appInfo} = useAppInfo();
    const {popInAlert,setOpenAlert} = useAlert();
    const [movements,setMovements] = useState([]);

    const {info, setInfo} = useState([]);

    // GRAFICA DE BARRAS 
    const [period, setPeriod] = useState("MONTH");
    const chartContainerRef = useRef(null);
    const changePeriod = (value) => {
    const dicper = {
            "Por día": "DAY",
            "Por mes": "MONTH",
            "Por año": "YEAR",
        };
        setPeriod(dicper[value]);
    };

    useEffect(() => {
        const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 250,
        layout: {
            background: { color: "#ffffff" },
            textColor: "#6b7280",
        },
        grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
        },
        rightPriceScale: {
            visible: false,
        },
        timeScale: {
            borderVisible: false,
        },
        crosshair: {
            vertLine: { visible: false },
            horzLine: { visible: false },
        },
        });

        // ✅ API CORRECTA
        const barSeries = chart.addSeries(HistogramSeries, {
        color: "#22c55e",
        priceFormat: {
            type: "volume",
        },
        });

        // 📊 DATA
        barSeries.setData([
        { time: "2025-01-01", value: 120 },
        { time: "2025-01-02", value: 180 },
        { time: "2025-01-03", value: 90 },
        { time: "2025-01-04", value: 220 },
        { time: "2025-01-05", value: 160 },
        { time: "2025-01-06", value: 200 },
        { time: "2025-01-07", value: 140 },
        ]);

        const handleResize = () => {
        chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
        });
        };

        window.addEventListener("resize", handleResize);

        return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
        };
    }, []);

    // FIN GRAFICA DE BARRAS


    // GRAFICA CALENDARIO
    
    const series = [
        {
        name: "Mon",
        data: [
            { x: "W1", y: 2 }, { x: "W2", y: 0 }, { x: "W3", y: 3 },
            { x: "W4", y: 1 }, { x: "W5", y: 5 }, { x: "W6", y: 0 },
            { x: "W7", y: 2 }, { x: "W8", y: 4 }
        ]
        },
        {
        name: "Tue",
        data: [
            { x: "W1", y: 1 }, { x: "W2", y: 2 }, { x: "W3", y: 0 },
            { x: "W4", y: 3 }, { x: "W5", y: 1 }, { x: "W6", y: 4 },
            { x: "W7", y: 0 }, { x: "W8", y: 2 }
        ]
        },
        {
        name: "Wed",
        data: [
            { x: "W1", y: 0 }, { x: "W2", y: 1 }, { x: "W3", y: 4 },
            { x: "W4", y: 0 }, { x: "W5", y: 3 }, { x: "W6", y: 2 },
            { x: "W7", y: 5 }, { x: "W8", y: 1 }
        ]
        },
        {
        name: "Thu",
        data: [
            { x: "W1", y: 3 }, { x: "W2", y: 0 }, { x: "W3", y: 1 },
            { x: "W4", y: 4 }, { x: "W5", y: 2 }, { x: "W6", y: 0 },
            { x: "W7", y: 3 }, { x: "W8", y: 5 }
        ]
        },
        {
        name: "Fri",
        data: [
            { x: "W1", y: 2 }, { x: "W2", y: 3 }, { x: "W3", y: 0 },
            { x: "W4", y: 1 }, { x: "W5", y: 4 }, { x: "W6", y: 2 },
            { x: "W7", y: 0 }, { x: "W8", y: 3 }
        ]
        },
        {
        name: "Sat",
        data: [
            { x: "W1", y: 0 }, { x: "W2", y: 1 }, { x: "W3", y: 2 },
            { x: "W4", y: 0 }, { x: "W5", y: 1 }, { x: "W6", y: 3 },
            { x: "W7", y: 2 }, { x: "W8", y: 0 }
        ]
        },
        {
        name: "Sun",
        data: [
            { x: "W1", y: 1 }, { x: "W2", y: 0 }, { x: "W3", y: 1 },
            { x: "W4", y: 2 }, { x: "W5", y: 0 }, { x: "W6", y: 1 },
            { x: "W7", y: 0 }, { x: "W8", y: 2 }
        ]
        }
    ];

    const options = {
        chart: {
        type: "heatmap",
        toolbar: { show: false }
        },
        dataLabels: {
        enabled: false
        },
        plotOptions: {
        heatmap: {
            radius: 2,
            enableShades: false,
            colorScale: {
            ranges: [
                { from: 0, to: 0, color: "#ebedf0" },
                { from: 1, to: 2, color: "#9be9a8" },
                { from: 3, to: 4, color: "#40c463" },
                { from: 5, to: 10, color: "#216e39" }
            ]
            }
        }
        },
        xaxis: {
        labels: { show: false }
        },
        yaxis: {
        labels: {
            style: {
            fontSize: "10px"
            }
        }
        },
        tooltip: {
        y: {
            formatter: (val) => `${val} actividades`
        }
        },
        grid: {
        padding: {
            left: 0,
            right: 0
        }
        }
    };
    
    // FIN GRAFICA CALENDARIO

    const getMovements = async()=>{
        let res = await postInfo('/getMovements',{company_id:appInfo.company_id,limit:10})
        console.log(res);
        if(res[0]){
            setMovements(res[1]);
        }
    }

    const handleNavigate = (path)=>{
        console.log(location)
        navigate(location.pathname + path)
    }


    {/*useEffect(()=>{
        //getMovements();
    },[])*/}
    
    
    return(
        <div className="MovementsInventory appSection">
            <div className="BodyAnalyticsIndicators">
                <div className="SectionTitle">
                    <BoldTitle text={'Movimientos'}/>
                    <DescriptionSpan text={'Esta es la descripción de la categoría actual '}/>
                </div>
                <div className="AnalyticsIndicators">
                    <div className="Graphics">
                        <div className="BarCharts">
                            <div className="Graph">
                                <div className="HeadGraph">
                                    <h3 className="TitleGraph">Total Sales</h3>
                                    <div className="OpionsGraph">
                                        <SelectOptions action={changePeriod} options={["Por día", "Por mes", "Por año"]} />
                                
                                        <MoreOptions
                                            options={[
                                            { text: "Refrescar", icon: <i className="fa-solid fa-rotate-right" />, action: {/*loadData*/} },
                                            { text: "Descargar", icon: <i className="fa-solid fa-arrow-down" />, action: {/*handleDownload*/} },
                                            { text: "Compartir", icon: <i className="fa-solid fa-share-nodes" /> },
                                            { text: "Reportar Problema", icon: <i className="fa-solid fa-flag" /> },
                                            ]}
                                        />
                                    </div>
                                </div>
                                <div className="PlotGraph">
                                    <div className="GraphChart" ref={chartContainerRef} />
                                </div>
                            </div>

                        </div>
                        <div className="CalendarChart">
                            <div className="Graph">
                                <div className="HeadGraph">
                                    <h3 className="TitleGraph">Sales Trend</h3>
                                    <div className="OpionsGraph">
                                        <SelectOptions action={changePeriod} options={["Por día", "Por mes", "Por año"]} />
                                
                                        <MoreOptions
                                            options={[
                                            { text: "Refrescar", icon: <i className="fa-solid fa-rotate-right" />, action: {/*loadData*/} },
                                            { text: "Descargar", icon: <i className="fa-solid fa-arrow-down" />, action: {/*handleDownload*/} },
                                            { text: "Compartir", icon: <i className="fa-solid fa-share-nodes" /> },
                                            { text: "Reportar Problema", icon: <i className="fa-solid fa-flag" /> },
                                            ]}
                                        />
                                    </div>
                                </div>
                                <div className="PlotGraph">
                                    <Chart
                                        className="GraphChart"
                                        options={options}
                                        series={series}
                                        type="heatmap"
                                        height={200}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="TableMovements">
                        {/*<TableReport info={Info} />*/}
                        <h3>Tabla de Movimientos</h3>
                    </div>
                </div>
            </div>
            <div className="CardsAnalytics">
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Entradas'}/>
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Salidas'}/>
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Translados'}/>
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Consumos'}/>
            </div>
        </div>
    )
}

