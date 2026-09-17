
import { useAppInfo } from "../../../../context/context"
import { SettingsGroup } from "../../components/SettingsGroup";

import './AccountSettings.css'

export function SecuritySettings(){

    const {userInfo} = useAppInfo();

    const sec1 = [
        {text:'Inicion de sesión y seguridad',path:'logIn',value:'',type:'functionality',icon:<i className="fa-solid fa-key"/>},
        {text:'Autentificación',path:'Autentification',value:userInfo.user_name,type:'functionality',icon:<i className="fa-solid fa-fingerprint"/>},
        {text:'Dispositivos vinculados',path:'Devices',value:'',type:'device',icon:<img src="https://www.aiho.es/img/cms/home/macbook-reacondicionado.png"/>},
        {text:'Registro de actividad',path:'ActivityRegister',value:'',type:'general',icon:<i className="fa-solid fa-user-clock"/>}
    ]

    const sec3 = [
        {text:'Copias de seguridad',path:'BackUp',value:'Automatica',type:'functionality',icon:<i className="fa-regular fa-clock"/>},
        {text:'Control de acceso',path:'AccessControl',value:'',type:'functionality',icon:<i className="fa-solid fa-user-shield"/>}
    ]

    return(
        <div className="AccountSettings">
            <SettingsGroup options={sec1}/>
            <SettingsGroup options={sec3}/>
        </div>
    )
}