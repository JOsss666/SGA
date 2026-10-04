import { useState } from "react";
import './ButtonMenu.css'
import './MoreOptions.css'

export function MoreOptions({options,children,stopPropagation=false}){
    const [visibleOptions,setVisibleOptions] = useState(false);

    return(
        <div className="MoreOptions" onClick={stopPropagation ? event=>event.stopPropagation() : undefined}>
            <button
                type="button"
                className="ButtonMenu"
                aria-label="Más opciones"
                aria-expanded={visibleOptions}
                onClick={()=>{
                setVisibleOptions(!visibleOptions)
            }} title={'Más opciones'}>
                <>
                    {!visibleOptions && children == undefined &&(
                        <i className="fa-solid fa-ellipsis-vertical"/>
                    )}
                    {!visibleOptions && children != undefined && (
                        children
                    )}
                    {visibleOptions && (
                        <i className="fa-solid fa-xmark"/>
                    )}
                </>
            </button>
            {visibleOptions && (
                <ul className="options" role="menu">
                    {options.map((element,index)=>(
                        <li
                            role="menuitem"
                            tabIndex={element.disabled ? -1 : 0}
                            aria-disabled={element.disabled || undefined}
                            onKeyDown={event=>{
                                if(!element.disabled && (event.key === 'Enter' || event.key === ' ')){
                                    event.preventDefault();
                                    element.action?.();
                                    setVisibleOptions(false);
                                }
                            }}
                            onClick={()=>{
                            if(!element.disabled && element.action){
                                element.action();
                            }
                            setVisibleOptions(false);
                        }} key={index}>{element.icon}{element.text}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}
