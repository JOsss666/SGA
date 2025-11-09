import { useRef } from "react"
import './FileInput.css'

export function FileInput({action,disabled,placeholder,children}){

    const inRef = useRef();


    return(
        <div className="FileInput">
            <div className="spaceInput" onClick={()=>{
                inRef.current.click();
            }}>
                {children? children:(
                    <i className="fa-regular fa-folder-open"/>
                )}
                <strong>{placeholder? placeholder:'Seleccionar archivo'}</strong>
            </div>
            <input disabled={disabled} ref={inRef} type="file" hidden onChange={()=>{
                if(action != undefined){
                    action(inRef.current.value)
                }
            }}/>
        </div>
    )
}