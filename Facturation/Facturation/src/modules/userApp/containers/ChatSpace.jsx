import { ChatMessage } from "../components/ChatMessage";
import { ChatDateDivider } from "../components/ChatDateDivider";
import { ChatInputBar } from "../components/ChatInputBar";
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
                {messages.length > 0 && (
                    <ChatDateDivider label={'Hoy'}/>
                )}
                {messages.length > 0 && messages.map((element,index)=>(
                    <ChatMessage info={element} key={index}/>
                ))}
            </div>
            <div className="inputChat">
                <ChatInputBar placeholder={'Escribe un mensaje'}/>
            </div>
        </div>
    )
}