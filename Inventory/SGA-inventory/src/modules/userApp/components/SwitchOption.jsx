import { useEffect, useState } from "react"
import './SwitchOption.css'

export function SwitchOption({state1,state2,action,value,defaultValue,disabled=false}){

    const isControlled = value !== undefined;
    const [switched,setSwitched] = useState(Boolean(value ?? defaultValue ?? false));

    useEffect(()=>{
        if(isControlled){
            setSwitched(Boolean(value));
        }
    },[isControlled,value])

    useEffect(()=>{
        if(action!= undefined && !isControlled){
            action(switched);
        }
    },[switched,isControlled])

    const toggle = ()=>{
        if(disabled) return;
        const nextValue = !switched;
        if(isControlled){
            action?.(nextValue);
        }else{
            setSwitched(nextValue);
        }
    };

    return(
        <div
            onClick={toggle}
            onKeyDown={event=>{
                if(event.key === 'Enter' || event.key === ' '){
                    event.preventDefault();
                    toggle();
                }
            }}
            role="switch"
            aria-checked={switched}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            className={`SwitchOption ${switched? 'switchedSwitch':''}`}
        >
            <div className="switch"/>
            <span>{state1}</span>
            <span>{state2}</span>
        </div>
    )
}
