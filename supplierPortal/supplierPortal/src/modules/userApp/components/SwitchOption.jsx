import { useEffect, useState } from "react"
import './SwitchOption.css'

export function SwitchOption({state1,state2,action,defaultValue}){

    const [switched,setSwitched] = useState(defaultValue??false);

    useEffect(()=>{
        if(action!= undefined){
            action(switched);
        }
    },[switched])

    return(
        <div onClick={()=>{setSwitched(!switched)}} className={`SwitchOption ${switched? 'switchedSwitch':''}`}>
            <div className="switch"/>
            <span>{state1}</span>
            <span>{state2}</span>
        </div>
    )
}