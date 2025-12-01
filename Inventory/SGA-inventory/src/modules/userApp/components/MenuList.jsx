import { useNavigate, useParams } from 'react-router-dom'
import './MenuList.css'

export function MenuList({items,openMenu,activeSec,setActiveSec,title}){
    const params = useParams();
    const navigate = useNavigate();
    const handleNavigate = (path)=>{
        if(params.gerenceKey){
            navigate(`/SGA_INVENTORY/${params.companyKey}/${params.gerenceKey}/${params.userKey}/SGA/${path}`);
        }
    }
    return(
        <ul className="MenuList">
            <strong>{title}</strong>
            {items.map((element,index)=>(
                <li onClick={()=>{
                    element.path != undefined ? handleNavigate(element.path):alert('404');
                    setActiveSec(element.text)
                }} title={element.text} className={activeSec == element.text? 'activeLi':''} key={index}><i className={element.icon} />
                    <span>{openMenu? element.text:''}</span>
                </li>
            ))}
        </ul>
    )
}