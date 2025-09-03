import { useState } from "react";
import { useNotifications, usePreview } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import './DocumentPreview.css'
import { ShareDocuments } from "./ShareDocument";
import { ChatSpace } from "../ChatSpace";

export function DocumentPreview({children}){

    const [openTools,setOpenTools] = useState(false);
    const [activeTool, setActiveTool] = useState('Share')
    const {addNotification} = useNotifications();
    const {previewInfo,setOpenPreview} = usePreview();

    let info = previewInfo;

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

    return(
        <div className="DocumentPreview">
            <header>
                <div className="CloseDocPrev">
                    <i class="fa-solid fa-xmark" onClick={()=>{
                        setOpenPreview(false)
                    }}/>
                </div>
                <div className="docInfo">
                    {info.type == 'Document' && (
                        <>
                            <i class="fa-solid fa-file-code "/>
                            <strong>{info.docType}# {info.id}</strong>
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
                            <ChatSpace chatInfo={{
                                name:`Comentarios Documento`,
                                chatImg:'',
                                otherOptions:false
                            }} icon={<i className="fa-regular fa-comments"/>} />
                        )}
                    </div>
                )}
            </header>
        </div>
    )
}