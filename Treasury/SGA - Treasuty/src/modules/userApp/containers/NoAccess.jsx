import { useNavigate, useParams } from "react-router-dom"
import { useAppInfo } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle"
import { DescriptionSpan } from "../components/DescriptionSpan"
import './NoAccess.css'

export function NoAccess({title,description,img,noExit,noRedirect}){

    const {appInfo} = useAppInfo()
    const navigate = useNavigate();
    const params = useParams();

    const handleRedirect = ()=>{
        navigate(`/SGA_treasury/login`)
    }

    const handleGoHome = ()=>{
        navigate(`/SGA_treasury/${params.company_key}/${params.user_key}`)
    }

    return(
        <div className="NoAccess">
            <img src={img? img:"https://res.cloudinary.com/djjxugmni/image/upload/v1772826198/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.png"}/>
            <div className="descriptionMessage">
                <BoldTitle text={title? title:'No tiene acceso a este modulo'}/>
                <DescriptionSpan text={description? description:`${appInfo.legal_name} ha limitado su acceso al modulo de Facturación`}/>
            </div>
            {!noRedirect && !noExit && (
                <span className="redirect" onClick={()=>{
                    handleRedirect();
                }}>
                    <i className="fa-solid fa-arrow-right-from-bracket"/>
                    Salir de este modulo
                </span>
            )}
            {!noRedirect && noExit && (
                <span className="redirect" onClick={()=>{
                    handleGoHome();
                }}>
                    <i className="fa-solid fa-arrow-right-from-bracket"/>
                    Salir de esta sección
                </span>
            )}
            {noRedirect && (
                <span className="redirect"/>
            )}
        </div>
    )
}