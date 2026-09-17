
import { useNavigate, useParams } from 'react-router-dom'
import './MenuApp.css'

export function MenuApp({visibleMenu,setVisibleMenu,title,options}){

    const navigate = useNavigate();
    const params = useParams();

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/` + path);
    }

    return(
        <div className={`MenuApp ${visibleMenu? 'visibleMenu':'HiddenMenu'}`}>
            {title != undefined && (
                <h3>{visibleMenu? title:''}</h3>
            )}
            <ul className='listOptions'>
                {options.length > 0 && options.map((element,index)=>(
                    <li onClick={()=>{
                            handleNavigate(element.path)
                            setVisibleMenu?.(false);
                        }} key={index}>
                        {element.icon}
                        <span>{visibleMenu? element.text:''}</span>
                        {element.subSections != undefined? <i className="fa-solid fa-angle-down despleSiubMe"/>:''}
                    </li>
                ))}
            </ul>
        </div>
    )
}