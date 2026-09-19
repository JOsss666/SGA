import { ButtonMenu } from './ButtonMenu';
import './ChatInputBar.css'

export function ChatInputBar({placeholder}){
    return(
        <div className="ChatInputBar">
            <ButtonMenu title={'Adjuntar archivo'} noRotate={true}><i className="fa-solid fa-paperclip"/></ButtonMenu>
            <input type="text" placeholder={placeholder}/>
            <ButtonMenu title={'Emoji'} noRotate={true}><i className="fa-regular fa-face-smile"/></ButtonMenu>
            <ButtonMenu title={'Mensaje de voz'} noRotate={true}><i className="fa-solid fa-microphone"/></ButtonMenu>
        </div>
    )
}
