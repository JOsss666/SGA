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

export function Settings(){

    const navigate = useNavigate();
    const params = useParams();
    const [activeSection,setActiveSection] = useState(0);

    const menuOptions = [
        {title:'General',path:'',disabled:false,icon:<i className="fa-solid fa-building"/>},
        {title:'Cuenta',path:'Account',disabled:false,icon:<i className="fa-solid fa-user"/>},
        {title:'Notificaciónes',path:'Alerts',disabled:false,icon:<i className="fa-solid fa-bullhorn"/>},
        {title:'Personalización',path:'Styles',disabled:false,icon:<i className="fa-solid fa-palette"/>},
        {title:'Facturación',path:'Billing',disabled:false,icon:<i className="fa-solid fa-wallet"/>},
        {title:'Seguridad',path:'Security',disabled:false,icon:<i className="fa-solid fa-fingerprint"/>},
        {title:'Dispositivos',path:'devices',disabled:false,icon:<i className="fa-solid fa-mobile-screen"/>},
        {title:'Sistema',path:'System',disabled:false,icon:<i className="fa-solid fa-terminal"/>}
    ]

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/settings/${path}`)
    }


    return(
        <div className="Settings">
            <div className="asideMenu">
                <SearchBar placeholder={'Buscar'}/>
                {menuOptions.map((element,index)=>(
                    <strong className={`SettingsMenuOptions ${activeSection == index? 'activeSettigsSec':''}`} onClick={()=>{
                            handleNavigate(element.path);
                            setActiveSection(index);
                        }} key={index}>{element.icon}{element.title}
                        {activeSection == index && (
                            <div className="activeSecIndicator"/>
                        )}
                    </strong>
                ))}
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
                        <Route path="Devices" element={<NoResults title={'No es posible acceder a tus disposivos fisicos desde la nube'}/>} />
                        <Route path="System" element={<SystemSettings/>} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}