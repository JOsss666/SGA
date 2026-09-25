import { useEffect, useRef, useState } from 'react';
import { urlSer } from '../../../../App';
import { downloadAttachment, getAttachmentUrl, openAttachmentInNewTab, printAttachment, shareAttachment } from '../../../../utils/attachmentActions';
import './PreviewFile.css'
import { useAlert, useAppInfo } from '../../../../context/context';
import { LoadingSpace } from '../LoadingSpace';
import { MoreOptions } from '../../components/MoreOptions';

export function PreviewFile({id}){

    // Requirements
    const {appInfo} = useAppInfo();
    const {popOutAlert} = useAlert();

    // Control
    const [info,setInfo] = useState(null);
    const [loading,setLoading] = useState(true);
    const [busy,setBusy] = useState(false);
    const [error,setError] = useState('');
    const [message,setMessage] = useState('');
    const actionInProgress = useRef(null);

    // utils

    const iconDocsContainer = {
        "image/jpeg": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/png": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/gif": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/webp": <i className="fa-solid fa-file-image fileIcon"/>,
        "image/svg+xml": <i className="fa-solid fa-file-image fileIcon"/>,
        "application/pdf": <i className="fa-solid fa-file-pdf fileIcon"/>,
        "application/msword": <i className="fa-regular fa-file-word fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <i className="fa-regular fa-file-word fileIcon"/>,
        "application/vnd.ms-excel": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": <i className="fa-regular fa-file-excel fileIcon"/>,
        "application/vnd.ms-powerpoint": <i className="fa-solid fa-file-powerpoint fileIcon"/>,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": <i className="fa-solid fa-file-powerpoint fileIcon"/>,
        "text/plain": <i className="fa-solid fa-file-lines fileIcon"/>,
        "text/csv": <i className="fa-solid fa-file-image fileIcon"/>,
        "application/zip": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "application/x-rar-compressed": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "application/x-7z-compressed": <i className="fa-solid fa-file-zipper fileIcon"/>,
        "video/mp4": <i className="fa-solid fa-photo-film fileIcon"/>,
        "video/mpeg": <i className="fa-solid fa-photo-film fileIcon"/>,
        "video/quicktime": <i className="fa-solid fa-photo-film fileIcon"/>,
        "audio/mpeg":<i className="fa-solid fa-file-audio fileIcon"/>,
        "audio/wav": <i className="fa-solid fa-file-audio fileIcon"/>,
        "application/json": <i className="fa-solid fa-code fileIcon"/>
    };


    // Functions
    
    const handleAction = async(action)=>{
        if(!info?.url || actionInProgress.current) return;
        const actionToken = Symbol('attachmentAction');
        actionInProgress.current = actionToken;
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const result = await action(info);
            if(actionInProgress.current === actionToken) setMessage(result);
        } catch(actionError) {
            if(actionInProgress.current === actionToken) {
                setError(actionError instanceof TypeError
                    ? 'No se pudo acceder al archivo. Revisa tu conexión o ábrelo en una nueva pestaña.'
                    : actionError.message || 'No se pudo completar la acción.');
            }
        } finally {
            if(actionInProgress.current === actionToken) {
                actionInProgress.current = null;
                setBusy(false);
            }
        }
    };

    const canPrint = info?.type === 'application/pdf' || info?.type?.startsWith('image/');
    const actions = [
        {text:'Descargar', icon:<i className="fa-solid fa-cloud-arrow-down"/>, action:()=>handleAction(downloadAttachment)},
        ...(canPrint ? [{text:'Imprimir', icon:<i className="fa-solid fa-print"/>, action:()=>handleAction(printAttachment)}] : []),
        {text:'Compartir', icon:<i className="fa-solid fa-arrow-up-from-bracket"/>, action:()=>handleAction(shareAttachment)},
        {text:'Abrir en nueva pestaña', icon:<i className="fa-solid fa-up-right-from-square"/>, action:()=>handleAction(openAttachmentInNewTab)}
    ];

    const renderContent = () => {
        if (!info?.url) return <div className="no-file">No se pudo cargar el recurso</div>;

        const type = info.type;

        // Si es imagen, usamos <img> para mejor escalado
        if (type?.startsWith('image/')) {
            return (
                <div className="img-container">
                    <img src={info.url} alt={info.name} className="img-preview" />
                </div>
            );
        }

        // Si es PDF, usamos iframe
        if (type === 'application/pdf') {
            return (
                <iframe
                    src={`${info.url}#toolbar=0`}
                    title={info.name}
                    frameBorder="0"
                    width="100%"
                    height="100%"
                />
            );
        }

        // Fallback para otros archivos
        return (
            <div className="unsupported-file">
                <i className="fa-solid fa-file-circle-exclamation fa-3x"></i>
                <p>La previsualización no está disponible para este tipo de archivo.</p>
                <a href={info.url} target="_blank" rel="noreferrer" className="btn-download-alt">
                    Abrir en nueva pestaña
                </a>
            </div>
        );
    };

    // Events triggers

    useEffect(()=>{
        const controller = new AbortController();
        actionInProgress.current = null;
        setInfo(null);
        setLoading(true);
        setError('');
        setMessage('');
        setBusy(false);
        const loadFile = async()=>{
            try {
                const response = await fetch(`${urlSer}/getAttachedFiles`, {
                    method:'POST',
                    credentials:'include',
                    headers:{'Content-Type':'application/json', 'X-SGA-Company-Id':String(appInfo.company_id)},
                    body:JSON.stringify({company_id:appInfo.company_id, allowedDocs:[id]}),
                    signal:controller.signal
                });
                if(!response.ok) throw new Error('No se pudo cargar el archivo.');
                const result = await response.json();
                const file = result[0] === true && result[1]?.find(item => String(item.id) === String(id));
                if(!file?.url) throw new Error('No se encontró el archivo adjunto.');
                const url = getAttachmentUrl(file);
                if(!controller.signal.aborted) setInfo({...file, url});
            } catch(loadError) {
                if(!controller.signal.aborted) setError(loadError.message || 'No se pudo cargar el archivo.');
            } finally {
                if(!controller.signal.aborted) setLoading(false);
            }
        };
        if(id != null && appInfo.company_id != null) loadFile();
        else setLoading(false);
        return ()=>{
            controller.abort();
            actionInProgress.current = null;
        };
    },[id, appInfo.company_id]);


    return(
        <div className="PreviewFile">
            {!loading && (
                <>
                    <div className="headPreview">
                        <div className="nameIconContainer">
                            {iconDocsContainer[info?.type] || <i className="fa-solid fa-file fileIcon"/>}
                            <strong>{info?.name || 'Archivo adjunto'}</strong>
                        </div>
                        <div className="optionsDoc">
                            {actions.map(action => (
                                <button key={action.text} type="button" className="previewAction" title={action.text} aria-label={action.text} disabled={busy || !info?.url} onClick={action.action}>
                                    {action.icon}
                                </button>
                            ))}
                            {info?.url && !busy && (
                                <div className="moreOptC"><MoreOptions options={actions}/></div>
                            )}
                        </div>
                        <button type="button" className="previewAction" title="Cerrar previsualización" aria-label="Cerrar previsualización" onClick={popOutAlert}>
                            <i className="fa-solid fa-xmark"/>
                        </button>
                    </div>
                    <div className="contentContainer">
                        <div className="fileC">
                            {busy && <p role="status">Preparando archivo…</p>}
                            {error && <p role="alert">{error}</p>}
                            {message && <p role="status">{message}</p>}
                            {renderContent()}
                        </div>
                    </div>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando archivo'}/>
            )}
        </div>
    )
}
