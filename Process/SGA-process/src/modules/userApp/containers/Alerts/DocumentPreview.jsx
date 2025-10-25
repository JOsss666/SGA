import { useEffect, useRef, useState } from "react";
import { useNotifications, usePreview } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { ButtonMenu } from "../../components/ButtonMenu";
import './DocumentPreview.css'
import { ShareDocuments } from "./ShareDocument";
import { ChatSpace } from "../ChatSpace";
import { OpCard } from "../../components/OpCard";
import { DocumentCard } from "../../components/DocumentCard";
import { parseToCsv, parseToXlsx, componentToPdf, ScreenShotElement } from "../../../../utils/functions";
import { MoreOptions } from "../../components/MoreOptions";

export function DocumentPreview({children}){
    const [openTools,setOpenTools] = useState(false);
    const [activeTool, setActiveTool] = useState('Share')
    const {addNotification} = useNotifications();
    const {previewInfo,setOpenPreview} = usePreview();
    const spaceDoc = useRef();
    
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

    const handleFormatClick = async(format) => {
        console.log(`descargando en ${format}`)
        if(info != undefined){
            setActiveTool(false);
            switch (format){
                case "CSV": await parseToCsv(info,true,undefined); break;
                case "XLSX": await parseToXlsx(info,true,null,undefined);break;
                case "PDF": await componentToPdf(spaceDoc.current,true,{},undefined);break;
                case "JPG": await ScreenShotElement(spaceDoc.current,undefined);
            }
        }
    };

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
                    <MoreOptions title={'Descargar'} options={[
                        {text:"PDF",icon:<i className="fa-regular fa-file-pdf"/>,action:handleFormatClick},
                        {text:"JPG",icon:<i className="fa-regular fa-file-pdf"/>,action:handleFormatClick},
                        //{text:"CSV",icon:<i className="fa-regular fa-file-pdf"/>,action:handleFormatClick},
                        //{text:"XLSX",icon:<i className="fa-regular fa-file-pdf"/>,action:handleFormatClick},
                    ]}><i className="fa-solid fa-cloud-arrow-down"/></MoreOptions>
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
                        )}{activeTool == 'DownloadMenu' && (
                            <div className="DownloadMenu">
                                
                            </div>
                        )}
                    </div>
                )}
            </header>
            <div className="spaceDoc" ref={spaceDoc}>
                {info.type == 'Document' && (
                    <>
                        {info.docType == 'OP' && (
                            <OpCard data={info} />
                        )}
                        {info.docType != 'OP' && (
                            <DocumentCard data={info}/>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}