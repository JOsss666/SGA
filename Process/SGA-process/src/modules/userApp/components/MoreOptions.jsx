import { useState } from "react";
import { ButtonMenu } from "./ButtonMenu";
import './MoreOptions.css'

export function MoreOptions({options,children,title}){
    const [visibleOptions,setVisibleOptions] = useState(false);

    return(
        <div className="MoreOptions">
            <ButtonMenu onClick={()=>{
                setVisibleOptions(!visibleOptions)
            }} title={title? title:'más opciones'} noRotate={true}>
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
            </ButtonMenu>
            {visibleOptions && (
                <ul className="options">
                    {options.map((element,index)=>(
                        <li onClick={()=>{
                            if(element.action){
                                element.action(element.text);
                            }
                            setVisibleOptions(false);
                        }} key={index}>{element.icon}{element.text}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}