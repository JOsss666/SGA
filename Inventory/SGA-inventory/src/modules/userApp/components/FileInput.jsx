import { useRef } from "react"
import {uploadFiles} from '../../../utils/functions'
import './FileInput.css'

export function FileInput({action,disabled,placeholder,children,pendingUpload}){

    const inRef = useRef();

    const uplF = async(files)=>{
        let res = await uploadFiles(files);
        console.log(res);
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
            <input disabled={disabled} ref={inRef} type="file" hidden multiple={true} onChange={(e)=>{
                console.log(inRef.current.files)
                if(action != undefined){
                    //action(inRef.current.files)
                    uplF(inRef.current.files)
                }
            }}/>
        </div>
    )
}