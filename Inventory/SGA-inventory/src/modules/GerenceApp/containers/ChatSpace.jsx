import {ChatMessage} from './../componets/ChatMessage'
import { InputBarChat } from './../componets/InputBarChat';
import './ChatSpace.css'

export function ChatSpace({chatInfo,icon,messages,state}){
    return(
        <div className="ChatSpace">
            <div className="headChat">
                <div className="infoChat">
                    <div className="logoContainer">
                        {icon}
                    </div>
                    <div className="descChat">
                        <strong>{chatInfo.name}</strong>
                        <span>{chatInfo.desc}Hello world</span>
                    </div>
                </div>
            </div>
            <div className="spaceChatText">
                {messages.length > 0 && messages.map((element,index)=>(
                    <ChatMessage info={element}/>
                ))}
            </div>
            <div className="inputChat">
                <InputBarChat placeholder={'Enviar un ménsaje'}/>
            </div>
        </div>
    )
}