import { useAppInfo } from "../../../../context/context";
import { SettingsGroup } from "../../components/SettingsGroup"
import './GeneralSettings.css'

export function GeneralSettings(){

    const {userInfo,appInfo} = useAppInfo();
    const now = new Date();
    const formatted = now.toLocaleString('es-CO');


    const sec1 = [
        {text:'Información personal',path:'info',value:userInfo.user_name,type:'functionality',icon:<i className="fa-solid fa-circle-info"/>},
        {text:'Actualización de software',path:'softwareUpdate',value:'',type:'system',icon:<i className="fa-solid fa-code"/>},
        {text:'Almacenamiento en la nube',path:'cloudStorage',value:'',type:'functionality',icon:<i className="fa-solid fa-cloud"/>}
    ]

    const sec2 = [
        {text:'Fecha y hora',path:'time',value:formatted,type:'functionality',icon:<i className="fa-solid fa-clock"/>},
        {text:'Idioma y regíon',path:'language',value:appInfo.country,type:'functionality',icon:<i className="fa-solid fa-earth-americas"/>},
        {text:'Tipo y tamaño de letra',path:'letterSize',value:'Normal',type:'functionality',icon:<i className="fa-solid fa-t"/>}
    ]

    const sec3 = [
        {text:'Politica de servicio y privacidad',path:'policy',value:'',type:'general',icon:<i className="fa-solid fa-building-shield"/>},
        {text:'Reestablecer ajustes predeterminados',path:'resetSettings',value:'',type:'general',icon:<i className="fa-solid fa-triangle-exclamation"/>}
    ]

    return(
        <div className="GeneralSettings">
            <SettingsGroup options={sec1}/>
            <SettingsGroup options={sec2}/>
            <SettingsGroup options={sec3}/>
        </div>
    )
}