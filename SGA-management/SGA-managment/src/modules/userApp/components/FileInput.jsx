import { useRef, useState } from "react"
import {uploadFiles} from '../../../utils/functions'
import './FileInput.css'
import { useAppInfo } from "../../../context/context";

export function FileInput({action,disabled,setDisabled,placeholder,children,multiple}){

    const {appInfo,userInfo} = useAppInfo();
    const inRef = useRef();
    const [loading,setLoading] = useState(false);
    const [urls,setUrls] = useState([]);

    const getUrl = (fileInfo) => fileInfo?.url ?? fileInfo;

    const uplF = async(files)=>{
        setDisabled?.(true);
        console.log('Accion')
        setLoading(true);
        let res = await uploadFiles(files,{
            company_id:appInfo?.company_id,
            user_id:userInfo?.user_id
        });
        console.log(res)
        if(action != undefined){
            if(multiple){
                action(res.urls);
            }else{
                action(getUrl(res.urls[0]));
            }
        }
        setUrls(res.urls)
        setLoading(false);
        setDisabled?.(false);
    }

    return(
        <div className="FileInput">
            {!loading && urls.length == 0 && (
                <>
                    <div className="spaceInput" onClick={()=>{
                        inRef.current.click();
                    }}>
                        {children? children:(
                            <i className="fa-regular fa-folder-open"/>
                        )}
                        <strong>{placeholder? placeholder:'Seleccionar archivo'}</strong>
                    </div>
                    <input disabled={disabled} ref={inRef} type="file" hidden multiple={multiple} onChange={(e)=>{
                        if(action != undefined){
                            uplF(inRef.current.files)
                        }
                    }}/>
                </>
            )}
            {loading && (
                <div className="LoadingUpload">
                    <i className="fa-solid fa-spinner fa-spin"/>
                    <strong>Subiendo archivo...</strong>
                </div>
            )}
            {!loading && urls.length > 0 && (
                <div className="urlsContainer">
                    <h5>{urls.length} Archivos subidos</h5>
                    <ul className="gridUrl">
                        {urls.map((element,index)=>(
                            <li key={index}>
                                <a href={getUrl(element)} target="NBLANK">{getUrl(element)}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
