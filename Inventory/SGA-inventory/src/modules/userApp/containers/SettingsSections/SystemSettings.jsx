
import { useAppInfo } from "../../../../context/context"
import { SettingsGroup } from "../../components/SettingsGroup";

import './AccountSettings.css'

export function SystemSettings(){

    const {appInfo,appConfig} = useAppInfo();
    const now = new Date();
    const formatted = now.toLocaleString('es-CO');

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

    const sec2 = [
        {text:'Mantenimiento',path:'BackUp',value:'Automatica',type:'system',icon:<i className="fa-solid fa-screwdriver-wrench"/>},
        {text:'Errores y estado de sistema',path:'AccessControl',value:'',type:'system',icon:<i className="fa-solid fa-bug"/>}
    ]

    return(
        <div className="AccountSettings">
            <SettingsGroup options={sec1}/>
            <SettingsGroup options={sec2}/>
        </div>
    )
}