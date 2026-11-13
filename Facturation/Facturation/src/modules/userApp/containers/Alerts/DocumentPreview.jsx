import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications, usePreview } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import './DocumentPreview.css'
import { ShareDocuments } from "./ShareDocument";
import { ChatSpace } from "../ChatSpace";
import { OpCard } from "../../components/OpCard";
import { DocumentCard } from "../../components/DocumentCard";
import { DocumentRender } from "./documents render/DocumentRender";
import { formatDate, postInfo } from "../../../../utils/functions";
import { PreviewLinkedDocument } from "./documents render/PreviewLinkedDocuments";
import { ActionsPannel } from "../../components/actionsPannel";

// Acciones del documento que ya tienen endpoint (/documents/<kind>).
const DOCUMENT_ACTIONS = {
    activate:{
        confirm:'¿Activar este documento? Sus transacciones en borrador pasarán a contabilizadas.',
        success:'Documento activado',
        failure:'No se pudo activar el documento'
    },
    cancel:{
        confirm:'¿Cancelar este documento? Sus transacciones contables también quedarán canceladas.',
        success:'Documento cancelado',
        failure:'No se pudo cancelar el documento'
    }
};

export function DocumentPreview({data}){
    const {popInAlert,popOutAlert} = useAlert();
    const [openTools,setOpenTools] = useState(false);
    const [activeTool, setActiveTool] = useState('Share')
    const {addNotification} = useNotifications();
    const {appInfo,userInfo} = useAppInfo();
    const [info,setInfo] = useState(data != undefined ? data:{});
    const [docStatus,setDocStatus] = useState(null);
    const [statusLoading,setStatusLoading] = useState(true);
    const [busy,setBusy] = useState(false);

    const messages = [
        {
            user_name:'Ana Torres',
            text:'Hola! Ya revisé la factura, se ve todo correcto por ahora.',
            user_id:0,
            timestamp:'9:32'
        },
        {
            user_name:'Ana Torres',
            kind:'voice',
            voice:{duration:'00:35'},
            user_id:0,
            timestamp:'9:32'
        },
        {
            text:'Aquí está el enlace para la reunión de revisión, revísala por favor',
            user_id:1,
            timestamp:'9:33'
        },
        {
            kind:'link',
            link:{title:'Revisión de factura',subtitle:'meet.google.com/factura-review'},
            reaction:'👍',
            user_id:1,
            timestamp:'9:33'
        }
    ];

    const handleToolChange = (tool)=>{
        if(openTools){
            if(activeTool == tool){
                setOpenTools(false)
            }
        }else{
            setOpenTools(true)
        }
        setActiveTool(tool);
    }

    useEffect(()=>{
        console.log(info)
    },[info])

    // Los llamadores del preview no pasan el estado: se lee el vigente del documento.
    useEffect(()=>{
        if(!info.doc_id || !appInfo?.company_id){
            setStatusLoading(false);
            return undefined;
        }
        let active = true;
        setStatusLoading(true);
        postInfo('/getDocuments',{company_id:appInfo.company_id,id:info.doc_id})
            .then(res=>{
                if(active) setDocStatus(res?.[0] ? res[1]?.[0]?.status ?? null : null);
            })
            .catch(()=>{
                if(active) setDocStatus(null);
            })
            .finally(()=>{
                if(active) setStatusLoading(false);
            });
        return ()=>{ active = false; };
    },[info.doc_id,appInfo?.company_id])

    const runDocumentAction = async(kind)=>{
        const copy = DOCUMENT_ACTIONS[kind];
        if(busy || !info.doc_id || !copy) return;
        if(!window.confirm(copy.confirm)) return;
        setBusy(true);
        try{
            const res = await postInfo(`/documents/${kind}`,{
                company_id:appInfo.company_id,
                user_id:userInfo.user_id,
                doc_id:info.doc_id
            });
            if(res?.current_status) setDocStatus(res.current_status);
            addNotification({
                type:'aproved',
                title:copy.success,
                description:`${info.doc_type} # ${info.ownSerial}${res?.changed === false ? ': ya estaba en ese estado.' : '.'}${res?.ledgerRefreshPending ? ' Los saldos contables se actualizarán en breve.' : ''}`
            });
        }catch(error){
            addNotification({
                type:'error',
                title:copy.failure,
                description:error?.message ?? 'Intenta nuevamente.'
            });
        }finally{
            setBusy(false);
        }
    }

    const actionsLocked = busy || statusLoading || !info.doc_id;

    return(
        <div className="DocumentPreview">
            <header>
                <div className="docInfo">
                    <i class="fa-solid fa-file-code "/>
                    <strong>{`${info.doc_type} # ${info.ownSerial}`}</strong>
                    <span>{formatDate(info.created_at)}</span>
                </div>
                <div className="MenuPreviewOptions">
                    <ButtonMenu title={'Documentos asociados'} noRotate={true} onClick={()=>handleToolChange('linkedDocs')}><i className="fa-regular fa-folder-open"/></ButtonMenu>
                    <ButtonMenu title={'Acciones'} noRotate={true} onClick={()=>handleToolChange('actionsPannel')}><i className="bi bi-hand-index-thumb"/></ButtonMenu>
                    <ButtonMenu title={'Guardar'}><i className="fa-solid fa-floppy-disk"/></ButtonMenu>
                    <ButtonMenu title={'Descargar'} noRotate={true} ><i className="fa-solid fa-download"/></ButtonMenu>
                    <ButtonMenu title={'Imprimir'}><i className="fa-solid fa-print"/></ButtonMenu>
                    <ButtonMenu noRotate={true} onClick={()=>{handleToolChange('Share')}}  title={'Compartir'}><i className="fa-solid fa-share-nodes"/></ButtonMenu>
                    <ButtonMenu noRotate={true} onClick={()=>{handleToolChange('Comments')}} title={'Comentarios'}><i className="fa-regular fa-comments"/></ButtonMenu>
                    <ButtonMenu title={'Reportar'} onClick={()=>{handleToolChange('Report')}} ><i className="fa-regular fa-flag"/></ButtonMenu>
                    <ButtonMenu noRotate={true} title={'Fijar En Favoritos'}><i className="fa-regular fa-bookmark"/></ButtonMenu>
                </div>
                {openTools && (
                    <div className="ToolsContainer">
                        {activeTool == 'linkedDocs' && (
                            <PreviewLinkedDocument id={info.doc_id}/>
                        )}
                        {activeTool == 'actionsPannel' && (
                            <ActionsPannel actions={[
                                {
                                    title:'Acciones',
                                    actions:[
                                        {icon:<i className="bi bi-x-circle"/>,name:'Cancelar',
                                            action:()=>runDocumentAction('cancel'),
                                            disabled:actionsLocked || docStatus === 'cancelled'},
                                        {icon:<i className="bi bi-check-circle"/>,name:'Activar',
                                            action:()=>runDocumentAction('activate'),
                                            disabled:actionsLocked || docStatus === 'active'},
                                        {icon:<i className="bi bi-pen"/>,name:'Editar',disabled:true},
                                    ]
                                },
                                (true && (
                                    {
                                        title:'Proceso',
                                        actions:[
                                            {icon:<i className="bi bi-x-circle"/>,name:'Cancelar proceso'},
                                            {icon:<i className="bi bi-arrow-up"/>,name:'Avanzar proceso'},
                                            {icon:<i className="bi bi-arrow-down"/>,name:'Retrocede proceso'},
                                            {icon:<i className="bi bi-pen"/>,name:'Editar proceso'},
                                        ]
                                    }
                                ))
                            ]}/>
                        )}
                        {activeTool == 'Share' && (
                            <ShareDocuments info={info}/>
                        )}{activeTool == 'Comments' && (
                            <ChatSpace messages={messages} chatInfo={{
                                name:`Comentarios Documento`,
                                chatImg:'',
                                otherOptions:false
                            }} icon={<i className="fa-regular fa-comments"/>} />
                        )}
                    </div>
                )}
            </header>
            <div className="spaceDoc">
                <DocumentRender id={info.doc_id} docType={info.doc_type} />
            </div>
        </div>
    )
}
