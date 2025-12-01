
import { useState } from 'react'
import './TitleValue.css'

export function TitleValue({title,value,children}){

    const [visibleValue,setVisibleValue] = useState(true);

    return(
        <div className="TitleValue">
            <strong className='titlVal'>{title}
                <div title={`${visibleValue? 'Ocultar':'Mostrar'} ${title}`} className="iconDespleContainer" onClick={()=>{setVisibleValue(!visibleValue)}}>
                    <i className={`fa-solid fa-angle-${visibleValue? 'up':'down'}`}/>
                </div>
            </strong>
            <div hidden={!visibleValue} className="spaceChildren">
                {value != undefined && (
                    <span>{value}</span>
                )}
                {children}
            </div>
        </div>
    )
}