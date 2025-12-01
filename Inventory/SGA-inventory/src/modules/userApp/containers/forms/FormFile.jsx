import { useRef, useState } from 'react'
import { FormButton } from '../../components/FormButton'
import './FormFile.css'
import { useEffect } from 'react';

export function FormFile({info}){

    const [files,setSelectedFiles] = useState([]);
    const inRef = useRef();

    return(
        <div className="FormFile">
            <div className="spaceVisibleInput" onClick={()=>{
                inRef.current.click();
            }}>
                <i className="fa-solid fa-file-circle-plus"/>
                <span>Seleccionar archivo</span>
            </div>
            <FormButton text={"Subir archivo"} />
            <FormButton text={"Cancelar"} negative={true}/>
            <input ref={inRef} hidden type="file" />
        </div>
    )
}