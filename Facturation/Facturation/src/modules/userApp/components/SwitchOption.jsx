import { useEffect, useState } from "react"
import './SwitchOption.css'

export function SwitchOption({state1,state2,action,defaultValue,value}){

    const [switched,setSwitched] = useState(defaultValue??false);
    const isControlled = value !== undefined;
    const displayedValue = isControlled ? value === true : switched;

    useEffect(()=>{
        if(!isControlled && action!= undefined){
            action(switched);
        }
    },[switched,isControlled])

    const toggleSwitch = ()=>{
        const nextValue = !displayedValue;
        if(!isControlled){
            setSwitched(nextValue);
        }
        action?.(nextValue);
    };

    return(
        <div onClick={toggleSwitch} className={`SwitchOption ${displayedValue? 'switchedSwitch':''}`}>
            <div className="switch"/>
            <span>{state1}</span>
            <span>{state2}</span>
        </div>
    )
}
