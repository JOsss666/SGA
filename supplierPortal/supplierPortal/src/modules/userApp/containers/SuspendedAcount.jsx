import { useNavigate } from "react-router-dom"
import { useAppInfo } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle"
import { DescriptionSpan } from "../components/DescriptionSpan"
import './NoAccess.css'

export function SuspendedAccount(){

    const {appInfo} = useAppInfo()
    const navigate = useNavigate();

    const handleRedirect = ()=>{
        navigate(`/SGA_management/login`)
    }

    return(
        <div className="NoAccess">
            <img src="https://cdnmain.sga360.co/static/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.webp"/>
            <div className="descriptionMessage">
                <BoldTitle text={'Acceso denegado'}/>
                <DescriptionSpan text={`${appInfo.legal_name} ha suspendido temporalmente su cuenta`}/>
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