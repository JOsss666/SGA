import { useState } from 'react'
import'./AiButton.css'
import { useAiAssistant } from '../../../../context/context';

export function AiButton({sugerence,attached,text}){
    const [loading,setLoading] = useState(false);
    const {sendPrompt} = useAiAssistant();
    const [visibleSugerences,setVisibleSugerences] = useState(false);

    const procesPromt = async(element)=>{
        setLoading(true)
        let res = await sendPrompt(`${element.text} ${element.context}`,attached)
        setLoading(false)
    }

    return(
        <div className="AiButton">
            <button disabled={loading} title='Preguntar a la IA' onClick={()=>{setVisibleSugerences(!visibleSugerences)}}>
                <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1772826198/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.png" alt="" />
            </button>
            {visibleSugerences && (
                <ul className="sugerencesList">
                    {sugerence != undefined && sugerence.map((element,index)=>(
                        <li style={{animationDelay:`.${index}s`}} onClick={()=>{
                            setVisibleSugerences(false)
                            procesPromt(element);
                        }} key={index}>{element.text}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}