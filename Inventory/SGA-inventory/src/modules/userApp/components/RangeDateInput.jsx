import { useEffect, useState } from "react";
import { DateInput } from "./DateInput";

import'./RangeDateInput.css'

export function RangeDateInput({updateRange}){

    const [minDate,setMinDate] = useState('');
    const [maxDate,setMaxDate] = useState('');

    const rangeDate = {
        minDate,
        maxDate
    }

    useEffect(()=>{
        if(updateRange != undefined){
            updateRange(rangeDate)
        }
    },[rangeDate])

    return(
        <div className="RangeDateInput">
            <DateInput updateDate={setMinDate} max={maxDate}/>
            <span>-</span>
            <DateInput updateDate={setMaxDate} min={minDate}/>
        </div>
    )
}