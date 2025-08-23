
import { useState } from 'react'
import './DespleList.css'

export function DespleList({options,father,children}){

    const [visibleChildren,setVisibleChildren] = useState(false);

    return(
        <div className="DespleList">
            <h6>
                {children}
                {father.title}{options.length>0 && (
                <i onClick={()=>{setVisibleChildren(!visibleChildren)}} className={`fa-solid fa-angle-${visibleChildren? 'up':'down'}`}/>
            ) }</h6>
            {visibleChildren && (
                <div className="childrenSpan">
                    {options.length > 0 && options.map((element,index)=>(
                        <>
                            {element.options ==  null && (
                                <span onClick={()=>{alert('Redirigiendo ')}} key={index}>{element.children}{element.title}</span>
                            )}
                            {element.options != null && (
                                <DespleList father={element} options={element.options} children={element.children} />
                            )}
                        </>
                    ))}
                </div>
            )}
        </div>
    )
}