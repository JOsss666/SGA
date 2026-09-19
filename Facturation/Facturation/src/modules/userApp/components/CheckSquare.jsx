import { useEffect, useState } from 'react'
import './CheckSquare.css'

export function CheckSquare({title,action,checked}){

    const controlled = checked !== undefined;
    const [active,setActive] = useState(checked != undefined? checked:false);

    useEffect(()=>{
        if(controlled) setActive(Boolean(checked));
    },[checked, controlled])

    return(
        <div className="CheckSquare">
            <div onClick={()=>{
                const next = !active;
                if(!controlled) setActive(next);
                action?.(next);
            }} className={`square ${active? 'activeSquare':'normalSquare'}`}>
                {active && (
                    <i className="fa-solid fa-check"/>
                )}
            </div>
            <span>{title}</span>
        </div>
    )
}
