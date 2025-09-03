import { InputBarChat } from "../components/InputBarChat";
import './ChatSpace.css'

export function ChatSpace({chatInfo,icon,messages,state}){
    return(
        <div className="ChatSpace">
            <div className="headChat">
                <div className="infoChat">
                    <div className="logoContainer">
                        {icon}
                    </div>
                </div>
            </div>
            <div className="spaceChatText">

            </div>
            <div className="inputChat">
                <InputBarChat placeholder={'Enviar un ménsaje'}/>
            </div>
        </div>
    )
}