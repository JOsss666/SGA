import { useRef } from 'react'
import './FormInput.css'
import { moneyFormat } from '../../../utils/functions';

export function FormInput({action,title,defaultValue,placeholder,children,type,disabled,textArea,value,moneyF,min,max,required,step,onSubmit}){

    const inRef = useRef();
    const moneyFspan = useRef();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && onSubmit != undefined) {
            if (required && !inRef.current.value) return;
            onSubmit?.(inRef.current.value);
            if(value === undefined){
                inRef.current.value = "";
            }
            action?.('');
        }
    };

    return(
        <div className="FacturationFormInput">
            <label htmlFor="">{title}</label>
            <div className="inputContainer">
                {moneyF && (
                    <span onClick={()=>{
                        inRef.current.focus();
                    }} ref={moneyFspan} className='moneFHolder'>$ {moneyFormat(JSON.parse(inRef.current!= undefined? inRef.current.value != ""?inRef.current.value:0:0))}</span>
                )}
                {!textArea && (
                    <input
                        required={required != undefined? required:true}
                        step={step}
                        min={min}
                        max={max}
                        ref={inRef}
                        value={value !== undefined ? value : undefined}
                        defaultValue={value === undefined ? defaultValue : undefined}
                        onChange={(event)=>action?.(event.target.value)}
                        disabled={disabled}
                        onKeyDown={handleKeyDown}
                        type={type}
                        placeholder={placeholder}
                    />
                )}
                {textArea && (
                    <textarea
                        value={value !== undefined ? value : undefined}
                        defaultValue={value === undefined ? defaultValue : undefined}
                        onChange={(event)=>action?.(event.target.value)}
                        ref={inRef}
                        placeholder={placeholder}
                        disabled={disabled}
                    />
                )}
                {children}
            </div>
        </div>
    )
}
