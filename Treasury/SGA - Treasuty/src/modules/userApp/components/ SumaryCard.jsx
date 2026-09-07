import { PercentTimeIndicator } from "./PercentTimeIndicator";
import './SumaryCard.css'

export function SumaryCard({title,desc,value,percent,onClick,currency}){
    return(
        <div className="SumaryCard">
            <div className="head">
                <h6>{title}</h6>
                <span>{desc}</span>
            </div>
            <div className="redirectIcon">
                <i className="bi bi-box-arrow-up-right"/>
            </div>
            <h3 className="valueSumaryCard">
                {value}
                <span>{currency}</span>
            </h3>
            <div className="percentC">
            </div>
        </div>
    )
}
