import { useRef, useState } from "react"
import {uploadFiles} from '../../../utils/functions'
import './FileInput.css'
import { useAppInfo } from "../../../context/context";

export function FileInput({
    action,
    disabled,
    setDisabled,
    placeholder,
    children,
    multiple,
    includeFiles = false,
    category = 'others',   // carpeta destino en R2: assets | files | thirdPartiesDocs | others
    storeId,               // opcional: sube bajo la tienda en vez del nivel compañía
}){
    const {appInfo,userInfo} = useAppInfo();
    const inRef = useRef();
    const [loading,setLoading] = useState(false);
    const [urls,setUrls] = useState([]);
    const [error, setError] = useState('');

    const uplF = async(files)=>{
        if (disabled || loading || !files?.length) return;
        setDisabled?.(true);
        setLoading(true);
        setError('');
        try {
            if (!userInfo?.responsable) throw new Error('El acceso necesita un responsable interno para subir archivos.');
            const res = await uploadFiles(files, {
                company_id: appInfo.company_id,
                user_id: userInfo.responsable,
                category,
                ...(storeId != undefined ? { store_id: storeId } : {})
            });
            if (!Array.isArray(res?.urls) || res.urls.length !== files.length
                || res.urls.some(file => !file?.id || !file?.url)) {
                throw new Error('No se pudieron registrar todos los adjuntos. Intenta nuevamente.');
            }
            const actionValues = includeFiles
                ? res.urls.map((file, index) => ({ ...file, file: files[index] }))
                : res.urls;
            action?.(multiple ? actionValues : [actionValues[0]]);
            setUrls(res.urls);
        } catch (err) {
            setError(err?.message || 'No se pudieron subir los archivos.');
            if (inRef.current) inRef.current.value = '';
        } finally {
            setLoading(false);
            setDisabled?.(false);
        }
    }

    return(
        <div className="FileInput">
            {error && <p role="alert">{error}</p>}
            {!loading && urls.length == 0 && (
                <>
                    <button type="button" disabled={disabled} className="spaceInput" onClick={()=>{
                        inRef.current.click();
                    }}>
                        {children? children:(
                            <i className="fa-regular fa-folder-open"/>
                        )}
                        <strong>{placeholder? placeholder:'Seleccionar archivo'}</strong>
                    </button>
                    <input disabled={disabled} ref={inRef} type="file" hidden multiple={multiple} onChange={()=>{
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
                                <a href={element.url} target="_blank" rel="noopener noreferrer">{element.url}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
