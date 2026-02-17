import { useNavigate } from "react-router-dom"
import { BoldTitle } from "../components/BoldTitle"
import { DescriptionSpan } from "../components/DescriptionSpan"
import './NoAccess.css'
import { useAppInfo } from "../../../context/context"

export function NoAccess(){

    const {appInfo} = useAppInfo();
    const navigate = useNavigate();
    console.log(appInfo)

    const handleRedirect = ()=>{
        navigate(`/`)
    }
    return(
        <div className="NoAccess">
            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png"/>
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