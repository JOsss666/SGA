
import { useState } from 'react'
import './ChartIndicator.css'
import { ChartComponent } from './ChartComponent';

export function ChartIndicator({title,data}){
    const [selectedPeriod,setSelectedPeriod] = useState();

    const dataPrueba = [
    { time: '2025-08-01', value: 100 },
    { time: '2025-08-02', value: 105 },
    { time: '2025-08-03', value: 102 },
    { time: '2025-08-04', value: 108 },
    { time: '2025-08-05', value: 110 },
    { time: '2025-08-06', value: 107 },
    { time: '2025-08-07', value: 115 },
    { time: '2025-08-08', value: 112 },
    { time: '2025-08-09', value: 118 },
    { time: '2025-08-10', value: 120 },
    ];


    return(
        <div className="ChartIndicator">
            <div className="titleChart">
                <strong>{title}</strong>
                <span>24/05/2025 - 28/05/2025</span>
            </div>
            <div className="timeLapseControl">
                <span>1D</span>
                <span>5D</span>
                <span>1M</span>
                <span>3M</span>
                <span>6M</span>
                <span>1A</span>
                <span>5A</span>
                <span>Todo</span>
            </div>
            <div className="spaceChart">
                <ChartComponent data={dataPrueba} />
            </div>
        </div>
    )
}