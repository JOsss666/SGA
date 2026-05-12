import { useNavigate, useParams } from "react-router-dom";
import { BoldTitle } from "../components/BoldTitle";
import { PathLocation } from "../components/PathLocation";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './Settings.css'
import { useState } from "react";
import { AccountSettings } from "./SettingsSections/AccountSettings";
import { SearchBar } from "../components/SearchBar";
import { GeneralSettings } from "./SettingsSections/GeneralSettings";
import { AlertsSettings } from "./SettingsSections/AlertsSettings";
import { StylesSettings } from "./SettingsSections/StylesSettings";
import { BillingSettings } from "./SettingsSections/BillingSettings";
import { SecuritySettings } from "./SettingsSections/SecuritySettings";
import { SystemSettings } from "./SettingsSections/SystemSettings";
import { NoResults } from "./NoResults";
import { SettingsGroup } from "../components/SettingsGroup";
import { UserCard } from "../components/UserCard";
import { useAppInfo } from "../../../context/context";
import { DevicesSettings } from "./SettingsSections/DevicesSettings";

export function Settings(){
    const {userInfo,userConfig} = useAppInfo();
    const navigate = useNavigate();
    const params = useParams();

    const sec1 = [
        {text:'General',path:'',value:``,type:'general',icon:<i className="fa-solid fa-building"/>},
        {text:'Cuenta',path:'Account',value:``,type:'functionality',icon:<i className="fa-solid fa-user"/>},
        {text:'Notificaciónes',path:'Alerts',value:'',type:'functionality',icon:<i className="fa-solid fa-bullhorn"/>},
        {text:'Personalización',path:'Styles',value:'',type:'accesibility',icon:<i className="fa-solid fa-palette"/>},
        {text:'Facturación',path:'Billing',value:'',type:'functionality',icon:<i className="fa-solid fa-wallet"/>},
        {text:'Seguridad',path:'Security',value:'',type:'functionality',icon:<i className="fa-solid fa-fingerprint"/>},
        {text:'Dispositivos',path:'devices',value:'',type:'functionality',icon:<i className="fa-solid fa-mobile-screen"/>},
        {text:'Sistema',path:'System',value:'',type:'system',icon:<i className="fa-solid fa-terminal"/>}
    ]

    const sec3 = [
        {text:'Politica de servicio y privacidad',path:'policy',value:'',type:'general',icon:<i className="fa-solid fa-building-shield"/>},
        {text:'Reestablecer ajustes',path:'resetSettings',value:'',type:'general',icon:<i className="fa-solid fa-triangle-exclamation"/>}
    ]

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/settings/${path}`)
    }


    return(
        <div className="Settings">
            <div className="asideMenu">
                <SearchBar placeholder={'Buscar'}/>
                <UserCard name={userInfo.user_name} desc={userInfo.user_mail} imgSrc={userInfo.img} onClick={()=>{
                    handleNavigate('account')
                }}/>
                <SettingsGroup options={sec1} onClick={handleNavigate}/>
                <SettingsGroup options={sec3} onClick={handleNavigate}/>
            </div>
            <div className="spaceSettings">
                <div className="headSpace">
                    <BoldTitle text={'Configuración'}/>
                    <PathLocation/>
                </div>
                <div className="spaceSectionsSettings">
                    <Routes>
                        <Route path="" element={<GeneralSettings/>} />
                        <Route path="Account" element={<AccountSettings/>} />
                        <Route path="Alerts" element={<AlertsSettings/>} />
                        <Route path="Styles" element={<StylesSettings/>} />
                        <Route path="Billing" element={<BillingSettings/>} />
                        <Route path="Security" element={<SecuritySettings/>} />
                        <Route path="Devices" element={<DevicesSettings/>} />
                        <Route path="System" element={<SystemSettings/>} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}