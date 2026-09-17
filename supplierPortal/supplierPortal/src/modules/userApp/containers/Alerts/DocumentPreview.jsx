import { useEffect, useState } from "react";
import { useAlert, useNotifications, usePreview } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import './DocumentPreview.css'
import { ShareDocuments } from "./ShareDocument";
import { ChatSpace } from "../ChatSpace";
import { OpCard } from "../../components/OpCard";
import { DocumentCard } from "../../components/DocumentCard";
import { SellInvoiceRender } from "./documents render/SellInvoiceRender";
import { formatDate } from "../../../../utils/functions";
import { PreviewLinkedDocument } from "./documents render/PreviewLinkedDocuments";

export function DocumentPreview({data}){
    const {popInAlert,popOutAlert} = useAlert();
    const [openTools,setOpenTools] = useState(false);
    const [activeTool, setActiveTool] = useState('Share')
    const {addNotification} = useNotifications();
    const [info,setInfo] = useState(data != undefined ? data:{});

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
                    <ButtonMenu title={'Guardar'}><i className="fa-solid fa-floppy-disk"/></ButtonMenu>
                    <ButtonMenu title={'Descargar'} noRotate={true} ><i className="fa-solid fa-download"/></ButtonMenu>
                    <ButtonMenu title={'Imprimir'}><i className="fa-solid fa-print"/></ButtonMenu>
                    <ButtonMenu noRotate={true} onClick={()=>{handleToolChange('Share')}}  title={'Compartir'}><i className="fa-solid fa-share-nodes"/></ButtonMenu>
                    <ButtonMenu noRotate={true} onClick={()=>{handleToolChange('Comments')}} title={'Comentarios'}><i className="fa-regular fa-comments"/></ButtonMenu>
                    <ButtonMenu title={'Reportar'} onClick={()=>{handleToolChange('Report')}} ><i className="fa-regular fa-flag"/></ButtonMenu>
                    <ButtonMenu noRotate={true} title={'Fijar En Favoritos'}><i className="fa-regular fa-bookmark"/></ButtonMenu>
                    <ButtonMenu title={'Cerrar previsualización'} noRotate={true} onClick={()=>popOutAlert()}><i className="fa-solid fa-xmark"/></ButtonMenu>
                </div>
                {openTools && (
                    <div className="ToolsContainer">
                        {activeTool == 'linkedDocs' && (
                            <PreviewLinkedDocument id={info.doc_id}/>
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
                <SellInvoiceRender id={info.doc_id}/>
            </div>
        </div>
    )
}
