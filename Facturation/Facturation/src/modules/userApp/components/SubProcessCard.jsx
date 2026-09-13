import { useAlert } from "../../../context/context";
import { ProgressBar } from "./ProgressBar";
import { TagIndicator } from "./TagIndicator";
import './SubProcessCard.css'
import { ProcessStatusAlert } from "../containers/Alerts/ProcessStatusAlert";
import { formatDate } from "../../../utils/functions";

export function SubProcessCard({info,reloadFun}){
    // Requierements
    const {popInAlert} = useAlert();
    const order = info.order == null || info.order === '' ? NaN : Number(info.order);
    const maxOrder = info.max_order == null || info.max_order === '' ? NaN : Number(info.max_order);
    const isCompleted = Number.isFinite(order) && Number.isFinite(maxOrder) && order === maxOrder;
    const progress = Number.isFinite(order) && Number.isFinite(maxOrder) && maxOrder > 0
        ? Math.round(Math.min(100, Math.max(0, (order / maxOrder) * 100)))
        : isCompleted && maxOrder === 0 ? 100 : 0;
    const indicator = info.status === 'cancelled'
        ? {type:'disabled', icon:'fa-solid fa-ban'}
        : isCompleted
            ? {type:'green', icon:'fa-solid fa-circle-check'}
            : Number.isFinite(order) && order > 0
                ? {type:'blue', icon:'fa-solid fa-gears'}
                : {type:'suspended', icon:'fa-solid fa-clock'};

    return(
        <div className="SubProcessCard" onClick={()=>{
            popInAlert(<ProcessStatusAlert instance_id={info.id} reloadFun={reloadFun}/>);
        }}>
            <div className="headSubProcess">
                <i className="bi bi-arrow-return-right"/>
                <strong>{`${info.process_code}#${info.ownSerial} - ${info.thirdParty_name}`}</strong>
                <i className="bi bi-arrow-right"/>
                <TagIndicator {...indicator} title={info.step_name}/>
            </div>
            <div className="processStep">
                <ProgressBar
                    progress={progress}
                />
            </div>
            <span className="delivery_date">{`Vence: ${formatDate(info.created_at)}`}</span>
        </div>
    )
}
