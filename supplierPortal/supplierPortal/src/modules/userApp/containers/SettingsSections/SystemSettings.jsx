
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useAppInfo } from "../../../../context/context"
import { SettingsGroup } from "../../components/SettingsGroup";

import './AccountSettings.css'
import { ElectronicFacturationSettingsControl } from "./ElectronicFacturationSettingsControl";

export function SystemSettings(){
    const navigate = useNavigate();
    const params= useParams();
    const {appInfo,appConfig} = useAppInfo();
    const now = new Date();
    const formatted = now.toLocaleString('es-CO');

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/settings/System/${path}`)
    }

    const sec1 = [
        {text:'Información del sistema',path:'SystemInfo',value:'',type:'functionality',icon:<i className="fa-solid fa-circle-info"/>},
        {text:'Fecha y hora',path:'time',value:formatted,type:'functionality',icon:<i className="fa-solid fa-clock"/>},
        {text:'Idioma y regíon',path:'language',value:appInfo.country,type:'functionality',icon:<i className="fa-solid fa-earth-americas"/>},
        {text:'Actualización de software',path:'SoftwareUpdate',value:
            `${appConfig.system.software["version-name"]}    V_${appConfig.system.software["version"]}`,
            type:'system',icon:<i class="fa-solid fa-code"/>},
        {text:'Integraciones',path:'Devices',value:'',type:'functionality',icon:<i className="fa-solid fa-plug"/>},
        {text:'Automatizaciones',path:'ActivityRegister',value:'',type:'system',icon:<i className="fa-solid fa-robot"/>}
    ]

    const secF = [
        {text:'Facturación electronica',path:'e_fact',value:'',type:'functionality',icon:<i className="fa-solid fa-plug"/>},
    ]

    const sec2 = [
        {text:'Mantenimiento',path:'BackUp',value:'Automatica',type:'system',icon:<i className="fa-solid fa-screwdriver-wrench"/>},
        {text:'Errores y estado de sistema',path:'AccessControl',value:'',type:'system',icon:<i className="fa-solid fa-bug"/>}
    ]

    return(
        <div className="AccountSettings">
            <Routes>
                <Route path="" element={
                    <>
                    <SettingsGroup options={sec1}/>
                    <SettingsGroup options={secF} onClick={handleNavigate}/>
                    <SettingsGroup options={sec2}/>
                    </>
                }/>
                <Route path="e_fact/*" element={<ElectronicFacturationSettingsControl/>}/>
            </Routes>
        </div>
    )
}