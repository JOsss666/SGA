import { useState } from "react";
import { useAppInfo } from "../../../../context/context";
import { SettingsGroup } from "../../components/SettingsGroup";
import './AlertsSettings.css'

export function AlertsSettings(){

    const {userInfo} = useAppInfo();

    const [typeNotifications,setTypeNotifications] = useState('Flotante');

    const sec1 = [
        {text:'Enfoque',path:'focus',value:'Desactivado',type:'functionality',icon:<i className="fa-solid fa-circle-info"/>},
        {text:'Sonidos y efectos',path:'sounds&effects',value:'',type:'functionality',icon:<i className="fa-solid fa-key"/>},
        {text:'Duración y tiempo en pantalla',path:'alertsDuration',value:'',type:'general',icon:<i className="fa-solid fa-hourglass-half"/>},
    ]

    const sec3 = [
        {text:'Resumen programado',path:'alertsResume',value:'',type:'functionality',icon:<i className="fa-regular fa-calendar"/>},
        {text:'Agrupar notificaciones',path:'groupNotifications',value:'',type:'general',icon:<i className="fa-solid fa-layer-group"/>}
    ]
    
    const typesNoti = [
        {title:'Flotante',icon:<i className="fa-solid fa-bars"/>},
        {title:'Pestaña',icon:<div className="sideBar"/>},
        {title:'Burbujas',icon:<i className="fa-solid fa-ellipsis-vertical"/>},
        {title:'Ocultas',icon:<i className="fa-solid fa-arrow-pointer"/>},
    ]

    return(
        <div className="AlertsSettings">
            <div className="gridTypesNotifications">
                {typesNoti.map((element,index)=>(
                    <div className={`typeNoti ${typeNotifications == element.title? 'activeSec':''}`} key={index} onClick={()=>{
                        setTypeNotifications(element.title)
                    }}>
                        <div className={`imgC`}>
                            {element.icon}
                        </div>
                        <strong>{element.title}</strong>
                    </div>
                ))}
            </div>
            <SettingsGroup options={sec1}/>
            <SettingsGroup options={sec3}/>
        </div>
    )
}