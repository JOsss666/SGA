import { useState } from "react"
import './CollapsableItem.css'

export function CollapsableItem({title,children}){

    // Control
    const [visible,setVisible] = useState(false);

    return(
        <div className="CollapsableItem">
            <div className="head" onClick={()=>{
                    setVisible(!visible)
                }}>
                <h6>{title}</h6>
                <i className={`fa-solid fa-angle-${visible ? 'up':'down'}`} />
            </div>
            {visible && (
                <div className={`body colapsable${visible? 'Open':'Closed'}`}>
                    {children}
                </div>
            )}
        </div>
    )
}