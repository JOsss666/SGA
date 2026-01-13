
import { useAppInfo } from "../../../../context/context"
import { SettingsGroup } from "../../components/SettingsGroup";
import { UserCard } from "../../components/UserCard";

import './AccountSettings.css'

export function AccountSettings(){

    const {userInfo,userConfig} = useAppInfo();

    const sec1 = [
        {text:'Información personal',path:'personalInfo',value:userInfo.user_name,type:'functionality',icon:<i className="fa-solid fa-circle-info"/>},
        {text:'Inicion de sesión y seguridad',path:'logIn',value:'',type:'functionality',icon:<i className="fa-solid fa-key"/>},
        {text:'Actividad',path:'activity',value:'',type:'general',icon:<i className="fa-solid fa-user-clock"/>},
        {text:'Grabar sesiónes',path:'recodSession',value:
            `${userConfig.account.recordSesion}`
            ,type:'functionality',icon:<i className="fa-solid fa-video"/>}
    ]

    const sec3 = [
        {text:'Dispostivo principal',path:'deviceId',value:'',type:'device',icon:<img src="https://www.aiho.es/img/cms/home/macbook-reacondicionado.png"/>},
        {text:'Dispostivo secundario',path:'deviceId',value:'',type:'device',icon:<img src="https://exitocol.vtexassets.com/arquivos/ids/24795805/image-e6de4bf97b544cb1a6d0d779ed0331dd.jpg?v=638622661899270000"/>}
    ]

    return(
        <div className="AccountSettings">
            <div className="UserContainer">
                <UserCard
                    imgSrc={userInfo.img != undefined? userInfo.img:'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png'}
                    name={userInfo.user_name}
                    desc={userInfo.user_mail}
                />
            </div>
            <SettingsGroup options={sec1}/>
            <SettingsGroup options={sec3}/>
        </div>
    )
}