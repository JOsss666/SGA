import { useEffect, useRef, useState } from 'react'
import './SearchinList.css'

export function SearchinList({title,placeHolder,list,disabled,action,children,specialOption,noActVal}){
    
    const [searchValue,setSearchValue] = useState('');
    const [visibleList,setVisibleList] = useState(true);
    const [selectedOption,setSelectedOption] = useState(noActVal? undefined:"");
    const inRef = useRef();
    const listE = useRef();

    useEffect(()=>{
        if(inRef.current != undefined){
            inRef.current.addEventListener('focus', () => {
                setVisibleList(false)
            });
            if(list.length == 0){
                disabled = true;
                setVisibleList(true);
                inRef.current.placeHolder = "Sin opciones disponibles";
            }
        }
    },[inRef])

    const filterOptions = (value)=>{
        return(
            searchValue != ''? true:(value.toLowerCase()).includes((searchValue.toLowerCase()))
        )
    }

    useEffect(()=>{
        if(action != undefined){
            action(selectedOption);
        }
    },[selectedOption])

    return(
        <div className="SearchinList">  
            {title && (
                <label htmlFor="">{title}</label>
            )}
            <div className="SlistC">
                <input ref={inRef} type="text" placeholder={placeHolder} disabled={disabled} onChange={()=>{
                    setSelectedOption('')
                }}/>
                <ul ref={listE} hidden={visibleList} className="listElementsContainer">
                    {specialOption}
                    {list.length > 0 && list.map((element,index)=>(
                        <li onClick={()=>{
                            if(!noActVal){
                                inRef.current.value = element.text
                                if(element.value != undefined){
                                    setSelectedOption(element.value);
                                }else{
                                    setSelectedOption(element.text);
                                }
                            }else{
                                if(action != null){
                                    if(element.value != undefined){
                                    action(element.value);
                                    }else{
                                        action(element.text);
                                    }
                                }
                            }
                            setVisibleList(true);
                        }} key={index}>{element.text}</li>
                    ))}
                </ul>
            </div>
            {children}
        </div>
    )
}