import { useEffect, useState } from "react";
import { useNotifications, usePreview } from "../../../../context/context";
import {ButtonMenu} from '../../componets/ButtonMenu'
import './DocumentPreview.css'
import { ShareDocuments } from "./ShareDocument";
import { ChatSpace } from "../ChatSpace";

export function DocumentPreview({children}){
    const [openTools,setOpenTools] = useState(false);
    const [activeTool, setActiveTool] = useState('Share')
    const {addNotification} = useNotifications();
    const {previewInfo,setOpenPreview} = usePreview();

    let info = previewInfo;

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
        console.log(previewInfo)
    },[previewInfo])

    return(
        <div className="DocumentPreview">
            <header>
                <div className="CloseDocPrev" onClick={()=>{
                        setOpenPreview(false)
                    }}>
                    <i className="fa-solid fa-xmark" />
                </div>
                <div className="docInfo">
                    {info.type == 'Document' && (
                        <>
                            <i class="fa-solid fa-file-code "/>
                            <strong>{info.docType}#{info.id}</strong>
                        </>
                    )}
                </div>
                <div className="MenuPreviewOptions">
                    <ButtonMenu title={'Guardar'}><i className="fa-solid fa-floppy-disk"/></ButtonMenu>
                    <ButtonMenu title={'Descargar'}><i className="fa-solid fa-cloud-arrow-down"/></ButtonMenu>
                    <ButtonMenu title={'Imprimir'}><i className="fa-solid fa-print"/></ButtonMenu>
                    <ButtonMenu noRotate={true} onClick={()=>{handleToolChange('Share')}}  title={'Compartir'}><i className="fa-solid fa-share-nodes"/></ButtonMenu>
                    <ButtonMenu noRotate={true} onClick={()=>{handleToolChange('Comments')}} title={'Comentarios'}><i className="fa-regular fa-comments"/></ButtonMenu>
                    <ButtonMenu title={'Reportar'} onClick={()=>{handleToolChange('Report')}} ><i className="fa-regular fa-flag"/></ButtonMenu>
                    <ButtonMenu noRotate={true} title={'Fijar En Favoritos'}><i className="fa-regular fa-bookmark"/></ButtonMenu>
                </div>
                {openTools && (
                    <div className="ToolsContainer">
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
                <span>Doc prev</span>
            </div>
        </div>
    )
}