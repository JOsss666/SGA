import { useEffect, useState } from 'react'
import './CheckSquare.css'

export function CheckSquare({title,action,checked}){

    const [active,setActive] = useState(checked != undefined? checked:false);

    useEffect(()=>{
        if(action != undefined){
            action(active);
        }
    },[active])

    return(
        <div className="CheckSquare">
            <div onClick={()=>{
                setActive(!active)
            }} className={`square ${active? 'activeSquare':'normalSquare'}`}>
                {active && (
                    <i className="fa-solid fa-check"/>
                )}
            </div>
            <span>{title}</span>
        </div>
    )
}