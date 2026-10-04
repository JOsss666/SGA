import { useEffect, useRef } from 'react'
import './FormInput.css'
import { moneyFormat } from '../../utils/functions';

export function FormInput({action,title,placeholder,children,type,disabled,textArea,value,moneyF,min,max,required,step}){

    const inRef = useRef();
    const moneyFspan = useRef();

    useEffect(()=>{
        if(inRef.current != undefined){
            if(value != undefined){
                inRef.current.value = value;
                if(action != undefined){
                    action(value);
                }
            }
        }
    },[inRef])

    return(
        <div className="FormInput">
            <label htmlFor="">{title}</label>
            <div className="inputContainer">
                {moneyF && (
                    <span onClick={()=>{
                        inRef.current.focus();
                    }} ref={moneyFspan} className='moneFHolder'>$ {moneyFormat(JSON.parse(inRef.current!= undefined? inRef.current.value != ""?inRef.current.value:0:0))}</span>
                )}
                {!textArea && (
                    <input required={required != undefined? required:true} step={step} value={value} min={min} max={max} ref={inRef} onChange={()=>{
                        if(action != null){
                            action(inRef.current.value)
                        }
                    }} disabled={disabled} type={type} placeholder={placeholder}/>
                )}
                {textArea && (
                    <textarea onChange={()=>{
                        if(action != null){
                            action(inRef.current.value)
                        }
                    }} ref={inRef} placeholder={placeholder} disabled={disabled}></textarea>
                )}
                {children}
            </div>
        </div>
    )
}