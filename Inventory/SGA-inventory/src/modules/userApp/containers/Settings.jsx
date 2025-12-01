import { useNavigate, useParams } from "react-router-dom";
import { BoldTitle } from "../components/BoldTitle";
import { PathLocation } from "../components/PathLocation";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './Settings.css'
import { useState } from "react";
import { AccountSettings } from "./SettingsSections/AccountSettings";

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
        navigate(`/SGA_INVENTORY/${params.company_key}/${params.user_key}/settings/${path}`)
    }


    return(
        <div className="Settings">
            <div className="asideMenu">
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
                        <Route path="" element={<span>General</span>} />
                        <Route path="Account" element={<AccountSettings/>} />
                        <Route path="Alerts" element={<span>Notificaciónes</span>} />
                        <Route path="Styles" element={<span>Personalización</span>} />
                        <Route path="Billing" element={<span>Facturación</span>} />
                        <Route path="Security" element={<span>Seguridad</span>} />
                        <Route path="Devices" element={<span>Dispositivos vinculados</span>} />
                        <Route path="System" element={<span>Sistema</span>} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}