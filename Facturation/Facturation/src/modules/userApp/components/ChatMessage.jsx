import { useEffect, useRef, useState } from 'react';
import { useAppInfo, useNotifications } from '../../../context/context'
import { copyToClipBoard } from '../../../utils/functions';
import { TextMessage } from './ChatBubbleTypes/TextMessage';
import { VoiceMessage } from './ChatBubbleTypes/VoiceMessage';
import { LinkPreviewMessage } from './ChatBubbleTypes/LinkPreviewMessage';
import './ChatMessage.css'

export function ChatMessage({info}){

    const {userInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const [visibleOptions,setVisibleOptions] = useState(false);
    const messageBox = useRef()
    const isOwn = userInfo.user_id == info.user_id;

    useEffect(()=>{
        if(messageBox.current != undefined){
            messageBox.current.addEventListener("mousedown", () => {
                setVisibleOptions(true);
            });

            messageBox.current.addEventListener("mouseleave", () => {
                setVisibleOptions(false)
            });
        }
    },[messageBox.current])

    return(
        <div ref={messageBox} className={`ChatMessage ${isOwn? 'OwnMessage':''}`}>
            {!isOwn && (
                <strong>{info.user_name}</strong>
            )}
            <div className="messageContent">
                {info.kind == 'voice' && (
                    <VoiceMessage duration={info.voice?.duration}/>
                )}
                {info.kind == 'link' && (
                    <LinkPreviewMessage icon={info.link?.icon} title={info.link?.title} subtitle={info.link?.subtitle}/>
                )}
                {(info.kind == undefined || info.kind == 'text') && (
                    <TextMessage text={info.text} children={info.children}/>
                )}
            </div>
            {info.timestamp != undefined && (
                <div className="messageFooter">
                    <span className="timestamp">{info.timestamp}</span>
                </div>
            )}
            {info.reaction != undefined && (
                <div className="reactionBadge">
                    <span>{info.reaction}</span>
                </div>
            )}
            {visibleOptions &&(
                <div className="optionsMessage">
                    <ul>
                        <li onClick={()=>{
                            copyToClipBoard(info.text != undefined? info.text:messageBox.current.innerText);
                            addNotification({
                                title:'Copiado al portapapeles',
                                type:'info',
                                description:`Se copío "${info.text != undefined? info.text:messageBox.current.innerText}" en el porta papeles.`
                            })
                        }}><span>Copiar</span> <i className="fa-regular fa-copy"/></li>
                        <li><span>Responder</span> <i className="fa-solid fa-reply"/></li>
                        {isOwn && (
                            <>
                                <li><span>Eliminar</span> <i className="fa-regular fa-trash-can"/></li>
                                <li><span>Editar</span> <i className="fa-solid fa-pen"/></li>
                                <li><span>Información</span> <i className="fa-solid fa-circle-info"/></li>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}
