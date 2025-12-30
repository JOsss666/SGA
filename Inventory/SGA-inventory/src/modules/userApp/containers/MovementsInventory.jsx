import { useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { NormalCard } from "../components/NormalCard";
import { GraphHeatMap } from "../components/GraphHeatMap";
import { GraphBarCharts } from "../components/GraphBarCharts";
import { useAppInfo } from "../../../context/context";
import './MovementsInventory.css'

export function MovementsInventory() {

    const { darkMode } = useAppInfo();
    const [period, setPeriod] = useState("MONTH");

    const changePeriod = (value) => {
        const dicper = {
        "Por día": "DAY",
        "Por mes": "MONTH",
        "Por año": "YEAR",
        };
        setPeriod(dicper[value]);
    };

    return (
        <div className={`MovementsInventory ${darkMode ? "mi-dark" : "mi-light"} appSection`}>
            <div className="SectionTitle">
                <BoldTitle text="Movimientos" />
                <DescriptionSpan text="Esta es la descripción de la categoría actual" />
            </div>

            <div className="Graphics">
                <div className="Graph">
                    <div className="BarCharts">
                        <GraphBarCharts  onChangePeriod={changePeriod}/>
                    </div>
                </div>

                <div className="Graph">
                    <div className="HeatMap">
                        <GraphHeatMap />
                    </div>
                </div>
            </div>

            <div className="CardsAnalytics">
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Entradas'}/>
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Salidas'}/>
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Translados'}/>
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Consumos'}/>
                <NormalCard onlyTitle={true} e img={'https://i.pinimg.com/736x/00/2c/13/002c13c1b24794d3fd202c2a184c46d3.jpg'} title={'Consumos'}/>
            </div>
        </div>
    );
}
