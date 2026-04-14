import { useNavigate } from "react-router-dom"
import { useAppInfo } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle"
import { DescriptionSpan } from "../components/DescriptionSpan"
import './NoAccess.css'

export function NoAccess(){

    const {appInfo} = useAppInfo()
    const navigate = useNavigate();

    const handleRedirect = ()=>{
        navigate(`/SGA_management/login`)
    }

    return(
        <div className="NoAccess">
            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1772826198/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.png"/>
            <div className="descriptionMessage">
                <BoldTitle text={'No tiene acceso a este modulo'}/>
                <DescriptionSpan text={`${appInfo.legal_name} ha limitado su acceso al modulo de Facturación`}/>
            </div>
            <span className="redirect" onClick={()=>{
                handleRedirect();
            }}>
                <i className="fa-solid fa-arrow-right-from-bracket"/>
                Salir de este modulo
            </span>
        </div>
    )
}