import { useNavigate } from "react-router-dom"
import './FooterSugerence.css'

export function FooterSugerence({title,options}){

    const navigate = useNavigate();
    const handleNavigate = (path)=>{
        if(path != undefined){
            navigate(`/SGA_Inventarios/${path}`)
        }
    }

    return(
        <div className="FooterSugerence">
            <strong>{title}</strong>
            <div className="gridOptions">
                {options.map((element,index)=>(
                    <span onClick={()=>{
                        handleNavigate(element.path)
                    }} key={index}>{element.text}</span>
                ))}
            </div>
        </div>
    )
}