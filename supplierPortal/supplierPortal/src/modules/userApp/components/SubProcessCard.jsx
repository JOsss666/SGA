import { TagIndicator } from "./TagIndicator";


export function SubProcessCard({info}){
    return(
        <div className="SubProcessCard">
            <div className="headSubProcess">
                <i class="fa-solid fa-hammer"></i>
                <strong>{`${info.process_code}#${info.ownSerial} - ${info.thirdParty_name}`}</strong>
                <div className="statusContainer">
                    <TagIndicator title={info.step_name}/>
                </div>
            </div>
            <div className="processStep">
                
            </div>
        </div>
    )
}