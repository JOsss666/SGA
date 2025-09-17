import { useState } from "react";
import { ButtonMenu } from "./ButtonMenu";
import './MoreOptions.css'

export function MoreOptions({options}){
    const [visibleOptions,setVisibleOptions] = useState(false);

    return(
        <div className="MoreOptions">
            <ButtonMenu onClick={()=>{
                setVisibleOptions(!visibleOptions)
            }} title={'más opciones'} noRotate={true}>
                <>
                    {!visibleOptions && (
                        <i className="fa-solid fa-ellipsis-vertical"/>
                    )}
                    {visibleOptions && (
                        <i className="fa-solid fa-xmark"/>
                    )}
                </>
            </ButtonMenu>
            {visibleOptions && (
                <ul className="options">
                    {options.map((element,index)=>(
                        <li onClick={()=>{
                            if(element.action){
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