
import { useRef, useState, useEffect } from 'react';
import './ActionButton.css'

export function ActionButton({text,children,options,action}){

    const [loading,setLoading] = useState(false)
    const [selectedOption,setSelectedOption] = useState(options? options[0]:'');
    const [hideOptinos,setHideOptions] = useState(true);
    const ButtonContainer = useRef();

    const executeAction = async()=>{
        if(action != null && action != undefined){
            if(options){
                setLoading(true);
                await action(selectedOption);
                setLoading(false);
            }else{
                setLoading(true);
                await action();
                setLoading(false);
            }
        }
    }

    useEffect(()=>{
        ButtonContainer.current.addEventListener('mouseenter',()=>{
            setHideOptions(false)
        })
        ButtonContainer.current.addEventListener('mouseleave',()=>{
            setHideOptions(true);
        })
    },[])

    return(
        <div ref={ButtonContainer} className="ActionButton">
            <div title={`${text} ${selectedOption}`} className="contentButton">
                <button>{`${text} ${selectedOption}`}</button>
                {!loading? children:<i className="fa-solid fa-spinner fa-spin"></i>}
            </div>
            {options && (
                <ul hidden={hideOptinos} className="optionsBUtton">
                    {options.map((element,index)=>(
                        <li onClick={()=>{
                            setSelectedOption(element)
                            executeAction();
                            setHideOptions(true)
                        }} key={index}>{element}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}