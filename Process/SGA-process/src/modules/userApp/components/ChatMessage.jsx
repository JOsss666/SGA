import { useEffect, useRef, useState } from 'react';
import { useAppInfo, useNotifications } from '../../../context/context'
import { copyToClipBoard } from '../../../utils/functions';
import './ChatMessage.css'

export function ChatMessage({info}){

    const {userInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const [visibleOptions,setVisibleOptions] = useState(false);
    const messageBox = useRef()

    console.log(info)

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
        <div ref={messageBox} className={`ChatMessage ${userInfo.user_id == info.user_id? 'OwnMessage':''}`}>
            {info.user_id != userInfo.user_id && (
                <strong>{info.user_name}</strong>
            )}
            <div className="messageContent">
                <span>{info.text}</span>
                {info.children != undefined && (
                    <div className="childrenMess">{info.children}</div>
                )}
            </div>
            {visibleOptions &&(
                <div className="optionsMessage">
                    <ul>
                        <li onClick={()=>{
                            copyToClipBoard(info.text);
                            addNotification({
                                title:'Copiado al portapapeles',
                                type:'info',
                                description:`Se copío "${info.text}" en el porta papeles.`
                            })
                        }}><span>Copiar</span> <i className="fa-regular fa-copy"/></li>
                        <li><span>Responder</span> <i className="fa-solid fa-reply"/></li>
                        {info.user_id == userInfo.user_id && (
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