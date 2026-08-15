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

    const messageTest = {
        user_name:'Nombre Usuario1',
        text:'Este es el contenido del mensaje',
        user_id:0
    }

    const messageTest2 = {
        user_name:'Nombre Usuario2',
        text:'Este es un mensaje própio ',
        user_id:1
    }

    const messages = [messageTest,messageTest2,messageTest,messageTest,messageTest2,messageTest];

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
