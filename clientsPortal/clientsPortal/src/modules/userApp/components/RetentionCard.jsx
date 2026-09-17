import { TagIndicator } from "./TagIndicator";
import './RetentionCard.css'
import { moneyFormat } from "../../../utils/functions";

export function RetentionCard({setAplyRetention,aply,info = {
    name:'--',
    value:0,
    rate:0
}}){
    // Solo las retenciones (info.retention) son interactivas: muestran el checkbox
    // controlado por `aply`. Los impuestos se renderizan sin checkbox, como antes.
    const toggleable = info.retention == true && setAplyRetention != undefined;
    return(
        <div className={`RetentionCard ${toggleable && !aply? 'notApplied':''}`}>
            <h6>
                {toggleable && (
                    <input
                        type="checkbox"
                        className="checkBox"
                        checked={aply}
                        onChange={setAplyRetention}
                        title={`${aply? 'No aplicar':'Aplicar'} ${info.name}`}
                    />
                )}
                {info.name}
            </h6>
            <div className="rateIndicator">
                <span>Tasa: </span>
                <TagIndicator title={`${info.rate}%`}/>
            </div>
            <span className="value">{info.retention? '-':''} $ {moneyFormat(info.total)}</span>
        </div>
    )
}
