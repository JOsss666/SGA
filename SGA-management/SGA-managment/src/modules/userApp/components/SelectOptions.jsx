import { useEffect, useRef, useState } from "react"
import './SelectOptions.css'

export function SelectOptions({title,options,action}){

    // 
    const [selectedOption,setSelectedOption] = useState(options[0]);
    const [openOptions,setOpenOptions] = useState(false);
    const optionsContainer = useRef();
    useEffect(()=>{
        optionsContainer.current.addEventListener('mouseenter',()=>{
            setOpenOptions(true)
        })
        optionsContainer.current.addEventListener('mouseleave',()=>{
            setOpenOptions(false);
        })
    },[])

    useEffect(()=>{
        if(action != undefined){
            action(selectedOption);
        }
    },[selectedOption])

    return(
        <div ref={optionsContainer} className="SelectOptions">
            <div className="contentOptions">
                <span>{title? (title + ': '):''}{selectedOption}</span>
                <i onClick={()=>{setOpenOptions(!openOptions)}} title={openOptions? 'Ocultar opciones':'Ver opciones'} className={`despleOptions fa-solid fa-chevron-${openOptions? 'up':'down'}`}/>
            </div>
            {openOptions && (
                <ul className={`listOptions`}>
                    {options.map((element,index)=>(
                        <li title={element} key={index} onClick={()=>{setSelectedOption(element);setOpenOptions(false)}}>{element}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}