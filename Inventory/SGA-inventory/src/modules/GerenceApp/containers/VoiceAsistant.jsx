
import { AutoResizeTextArea } from '../componets/AutoResizeTextArea'
import './voiceAsistant.css'


export function VoiceAsistant(){

    return(
        <div className="VoiceAsistat">
            <div className="logosContainer">
                <div className="SGALogo">
                    <img title='SGA - Inventarios' src="https://i.pinimg.com/736x/65/86/a4/6586a4ed5a9bd2be7f43b69f71df4dd3.jpg" alt="" />
                    <strong>Asistente IA</strong>
                </div>
                <span>powered by <a title='https://chat.deepseek.com' href="https://chat.deepseek.com" target='NBLANk'>DeepSeek</a></span>
            </div>
            <div className="chatInput">
                <AutoResizeTextArea placeholder={'En que puedo ayudarte hoy?'}/>
                <button title='Enviar'><i className="fa-solid fa-arrow-up"></i></button>
            </div>
        </div>
    )
}