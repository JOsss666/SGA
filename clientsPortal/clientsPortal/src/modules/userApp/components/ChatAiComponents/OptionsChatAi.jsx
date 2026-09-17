import { useEffect, useState } from "react"
import './OptionsChatAi.css'

export function OptionsChatAi({options,action,children}){

    const [visibleOptions,setVisisbleOptions] = useState(false)
    const [selectedOption,setSelectedOption] = useState(options? options[0]:undefined)

    useEffect(()=>{
        action?.(selectedOption?.value);
    },[selectedOption])

    return(
        <div className="OptionsChatAi" 
            //onMouseLeave={()=>setVisisbleOptions(false)}
            //onMouseOver={()=>setVisisbleOptions(true)}
            onClick={()=>{
                setVisisbleOptions(!visibleOptions)
            }}
            >
            {selectedOption && (
            <strong className="selectedOptionHolder">
                {children && (
                    <div className="childrenIndicator">
                        {children}
                    </div>
                )}
                <strong className="selectedOption">
                    <span>{selectedOption.text}</span>
                    <div className="selIC">
                        {selectedOption.children}
                    </div>
                </strong>
            </strong>
            )}
            {visibleOptions &&  options.length > 1 && (
                <ul className="listOptions">
                    {options.map((element,index)=>(
                        <li key={index} onClick={()=>setSelectedOption(element)}>
                            {element.children}
                            <span>
                                {element.text}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}