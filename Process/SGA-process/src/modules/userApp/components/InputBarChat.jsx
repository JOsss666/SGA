import { ButtonMenu } from "./ButtonMenu";
import './InputBarChat.css'

export function InputBarChat({settings,searchAction,sendAction,files,placeholder,disabled,loading}){
    return(
        <div className="InputBarChat">
            {settings != undefined && (
                <ButtonMenu onClick={()=>{
                    if(settings.action != undefined){
                        settings.action();
                    }
                }} title={'Ajustar parametros de busqueda'} noRotate={true} children={<i className="fa-solid fa-sliders"/>}/>
            )}
            <input onChange={(e)=>{
                if(searchAction != undefined){
                    searchAction(e.target.value);
                }
            }} type="text" placeholder={placeholder} disabled={disabled}/>
            <ButtonMenu title={'Dictar'} noRotate={true} children={<i className="fa-solid fa-microphone"/>}/>
            <ButtonMenu onClick={()=>{
                if(sendAction != undefined){
                    sendAction();
                }
            }} title={'Buscar documento'} noRotate={true} children={
                loading? <i className="fa-solid fa-spinner fa-spin"/>:<i className="fa-solid fa-arrow-up"/>
            
            }/>
        </div>
    )
}