
import { AutoResizeTextArea } from '../components/AutoResizeTextArea'
import './ChatActive.css'

export function ChatActive({info,setOpenChat}){
    return(
        <div className="ChatActive">
            <div className="headChat">
                <i title='Volver a chats' onClick={()=>{setOpenChat({})}} className="fa-solid fa-arrow-left exitChat"></i>
                <strong>{info.chatName}</strong>
            </div>
            <div className="contentChat">


            </div>
            <div className="chatToogles">
                <AutoResizeTextArea placeholder={'Enviar Mensaje'}/>
                <button title='Enviar mensaje' className='sendMessage'>
                    <i className="fa-solid fa-arrow-up"></i>
                </button>
            </div>
        </div>
    )
}