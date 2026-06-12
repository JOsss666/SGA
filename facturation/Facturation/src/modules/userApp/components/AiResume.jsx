import { BoldTitle } from "./BoldTitle";
import './AiResume.css'
import { useAiAssistant, useNotifications } from "../../../context/context";
import { useEffect, useState } from "react";
import { TextPlainAi } from "./ChatAiComponents/TextPlainAi";

export function AiResume(){
    const {addNotification} = useNotifications();
    const {sendPrompt} = useAiAssistant();
    const [contentResume,setContentResume] = useState([]);
    const [loading,setLoading] = useState(false);
    // Ordenes de producción
    // mensajes
    // notificaciones
    
    const getAiResume = async()=>{
        let res = await sendPrompt(`Dame una frase de 4 maximo 5 palabras motivacionales realcionadas con el trabajo como mainTitle,Que es el modulo de inventarios,se breve un parrafo corto como mucho`,[],true);
        console.log(res)
        if(res[0]){
            setContentResume(res[1]);
            addNotification({
                type:'AI',
                title:'Resumen IA diario listo',
                description:'Tu resumen díario generado por la IA esta listo'
            })
        }
    }

    useEffect(()=>{
        getAiResume();
    },[])

    return(
        <div className="AiResume">
            <div className="headResume">
                <img src="https://i.pinimg.com/1200x/c0/1a/9c/c01a9c2c1663ee8e03632fa7e11571aa.jpg" alt="" />
                <strong>Resumen Ai</strong>
            </div>
            <div className="contentResume">
                {contentResume.map((element,index)=>(
                    <TextPlainAi text={element.content} key={index} />
                ))}
            </div>
        </div>
    )
}