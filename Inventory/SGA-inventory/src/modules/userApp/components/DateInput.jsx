
import { useEffect, useRef, useState } from 'react'
import './DateInput.css'

export function DateInput({updateDate,min,max}){

    const inputDate = useRef();

    const openC = ()=>{
        if(inputDate.current != null){
            inputDate.current.showPicker();
        }
    }

    return(
        <div className="DateInput">
            <input ref={inputDate} type="date" min={min} max={max} onChange={()=>{
                if(updateDate != undefined){
                    updateDate(inputDate.current.value)
                }
            }}/>
            <i onClick={()=>{openC()}} title='Ver calendario' className="fa-regular fa-calendar"/>
        </div>
    )
}
