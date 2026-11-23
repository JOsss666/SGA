import { useNavigate, useParams } from "react-router-dom";
import { useAlert } from "../../../context/context";
import { BoldTitle } from "./BoldTitle";

import { FormButton } from "./FormButton";
import './WarningOpenCashBox.css'
import { WarningForm } from "./WarningForm";

export function WarningOpenCashBox({name}){

    const {popOutAlert} = useAlert();
    const navigate = useNavigate();
    const params = useParams();

    const handleNavigate = ()=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/cashBoxes`);
        popOutAlert();
    }


    return(
        <div className="WarningOpenCashBox">
            <BoldTitle text={'Advertencia de caja cerrada'} children={<i className="bi bi-exclamation-circle"/>}/>
            <img src="https://cdnmain.sga360.co/static/Gemini_Generated_Image_ddi13yddi13yddi1-2_cehfsk.webp" alt="" />
            <WarningForm tittle={'Para continuar'} desc={`Para crear "${name}" debe haber al menos una caja POS abierta, si tiene los permisos pulse en abrir caja POS para registrar un nuevo cierre de caja.`}/>
            <div className="actions">
                <FormButton negative={true} text={'Cerrar'} onClick={()=>{
                    popOutAlert();
                }}/>
                <FormButton text={'Abrir cajas POS'} onClick={()=>{
                    handleNavigate();
                }}/>
            </div>
        </div>
    )
}