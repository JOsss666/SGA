import { useState, useEffect } from 'react'
import './TreeOrganizer.css'

export function TreeOrganizer({list,allOpen,popNewOption}){
    const [openChildren,setOpenChildren] = useState(allOpen!= undefined? allOpen:false);
    useEffect(()=>{
        setOpenChildren(allOpen)
    },[allOpen])

    return(
        <div className="TreeOrganizer">
            {list.map((element,index)=>(
                <div key={index} className="treeItem">
                    <div className="listTitle">
                        <div className="identOrganizator"/>
                        <strong>
                            <i className={openChildren? `fa-regular fa-folder-open`:`fa-solid fa-folder`}/>
                            {element.name}
                        </strong>
                        <div className="despleChildren" onClick={()=>{setOpenChildren(!openChildren)}}>
                            <i className={`fa-solid fa-angle-${openChildren? 'up':'down'}`}></i>
                        </div>
                        <div className="NewChildrenCreation" title={`Crear subDivision de ${element.name}`} onClick={()=>{
                            if(popNewOption != undefined){
                                popNewOption(element)
                            }
                        }}>
                            <i className="fa-solid fa-folder-plus"/>
                        </div>
                    </div>
                    {openChildren && element.children != undefined && (
                        <div className="ChildrenContainer">
                            {element.children.map((element,index)=>(
                                <TreeOrganizer list={[element]} key={index} allOpen={allOpen} popNewOption={popNewOption}/>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}