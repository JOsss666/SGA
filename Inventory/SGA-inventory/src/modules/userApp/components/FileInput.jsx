import { useRef } from "react"
import {uploadFiles} from '../../../utils/functions'
import './FileInput.css'

export function FileInput({action,disabled,placeholder,children,multiple}){

    const inRef = useRef();

    const uplF = async(files)=>{
        let res = await uploadFiles(files);
        console.log(res)
        if(action != undefined){
            if(multiple){
                action(res.urls);
            }else{
                action(res.urls[0]);
            }
        }
    }

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
            <input disabled={disabled} ref={inRef} type="file" hidden multiple={multiple} onChange={(e)=>{
                console.log(inRef.current.files)
                if(action != undefined){
                    uplF(inRef.current.files)
                }
            }}/>
        </div>
    )
}