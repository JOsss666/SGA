
import { useLocation, useNavigate } from "react-router-dom"
import './PathLocation.css'

export function PathLocation(){
    const location = useLocation();
    const navigate = useNavigate();
    const filterRoute = location.pathname.split('/SGA/');
    const pathSections = filterRoute[1].split('/')

    const handlePathMovement = (path)=>{
        let elements = location.pathname.split('/');
        let newDestiny = location.pathname.split(elements[elements.indexOf(path)])[0];
        if((newDestiny + path)!= location.pathname){
            navigate(newDestiny + path)
        }
    }

    return(
        <div className="PathLocation">
            {pathSections.map((element,index)=>(
                <>{index != 0 ? '/':''}<span onClick={()=>{
                    handlePathMovement(element)
                }} key={index}>{element}</span></>
            ))}
        </div>
    )
}