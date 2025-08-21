import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import {SearchBar} from '../componets/SearchBar'
import './GerenceApp.css'
import { UserCard } from '../componets/UserCard';
import { MenuList } from '../componets/MenuList';
import { useEffect, useRef, useState } from 'react';
import { VoiceAsistant } from './VoiceAsistant';
import { Notifications } from './Notifications';
import { HomeGerence } from './HomeGerence';
import { Analytics } from './Analytics';
import { PricesList } from './PricesList';
import { PricesListDetails } from './PricesListDetails';
import { GerenceUsers } from './GerenceUsers';
import { Categories } from './Categories';
import { AlertsApp } from './AlertsApp';
import { useAlert } from '../../../context/context';
import {postInfo} from '../../../utils/functions'
import { useAppinfo } from '../../../context/context';
import { Stores } from './Stores';
import { MovementsInventory } from './MovementsInventory';
import { RecordMovents } from './RecordMovements';
import { ReferenceAnalitics } from './ReferenceAnalitics';

export function GerenceApp(){

    // APP info
    const {appInfo,setAppInfo,userInfo,setUserInfo} = useAppinfo();
    const {openAlert} = useAlert();

    // Sections
    const subSections = [
        {text:'Inicio',icon:'fa-solid fa-display',path:''},
        {text:'Estadisticas',icon:'fa-solid fa-chart-bar',path:'Analytics'},
        {text:'Listas de precios',icon:'fa-solid fa-clipboard-list',path:'PricesList'},
        {text:'Usuarios',icon:'fa-solid fa-user-tie',path:'Users'},
        {text:'Tiendas',icon:'fa-solid fa-store',path:'Stores'},
        {text:'Movimientos',icon:'fa-solid fa-cart-arrow-down',path:'Movements'}
    ]

    const settingsSections = [
        {text:'Tutoriales',icon:'fa-brands fa-youtube'},
        {text:'Ayuda',icon:'fa-solid fa-question'},
        {text:'Configuración',icon:'fa-solid fa-gear'},
        {text:'Cerrar Sesión',icon:'fa-solid fa-arrow-right-from-bracket'},
    ]

    // Prices List
    const [actualList,setActualList] = useState({})

    // Menu Settings and Dependences
    const [openMenu,setOpenMenu] = useState(false);
    const [openHeadComplement,setOpenHeadComplement] = useState(false);
    const [activeComplement,setActiveComplement] = useState('');
    const [activeSec,setActiveSec] = useState('Inicio');
    const asideMenu = useRef();

    // Notifications
    const [userNotifications,setUserNotifications] = useState([
        {title:'Producto Agotado',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Nueva Compra',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Producto Agotado',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Nueva Compra',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Producto Agotado',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Nueva Compra',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Producto Agotado',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Nueva Compra',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Producto Agotado',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'},
        {title:'Nueva Compra',description:'"Resma 30" a llegado a sus niveles minimos',created_at:'31/05/2025'}
    ]);

    const getCompanyInfo = async()=>{
        let res = await postInfo('/getCompanyInfo',1);
        if(res[0]){
            setAppInfo(res[1][0])
        }
    }

    const getUserInfo = async()=>{
        let res = await postInfo('/getUserInfo',1);
        console.log(res)
        if(res[0]){
            setUserInfo(res[1][0]);
        }
    }



    // Previous Actions
    useEffect(()=>{
        getUserInfo();
        getCompanyInfo();
    },[])


    useEffect(()=>{
        console.log(userInfo)
        console.log(appInfo)
    },[userInfo,appInfo])

    useEffect(()=>{
        if(asideMenu.current != null){
            asideMenu.current.addEventListener('mouseenter',()=>{
                setOpenMenu(true);
            })
            asideMenu.current.addEventListener('mouseleave',()=>{
                setOpenMenu(false);
            })
        }
    })

    useEffect(()=>{
        console.log(openHeadComplement? 'openHeadComplemet':'closedHeadComplemet')
    },[openHeadComplement])

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setOpenMenu(false)
        }
    });


    return(
        <div className="GerenceApp">
            <header>
                <div className="headPage">
                    <h3>{appInfo.legal_name}</h3>
                    <SearchBar placeholder={'Buscar en SGA - Inventarios'}/>
                    <div className="headPageOptions">
                        <i onClick={()=>{
                            if(openHeadComplement && activeComplement == 'voiceAsistant'){
                                setOpenHeadComplement(false);
                            }else{
                                setOpenHeadComplement(true)
                            }
                            setActiveComplement('voiceAsistant')
                        }} title='Asistente de voz' className={"fa-solid fa-microphone " + (openHeadComplement && activeComplement == 'voiceAsistant'? 'activeOptionMenu':'')}></i>
                        <i onClick={()=>{
                            if(openHeadComplement && activeComplement == 'notifications'){
                                setOpenHeadComplement(false);
                            }else{
                                setOpenHeadComplement(true)
                            }
                            setActiveComplement('notifications')
                        }} title='Notificaciones' className={"fa-solid fa-bell " + (openHeadComplement && activeComplement == 'notifications'? 'activeOptionMenu':'')}></i>
                    </div>
                    <UserCard name={userInfo.user_name} roll={userInfo.user_roll}/>
                </div>
            </header>
            <div className={'headComplement ' + (openHeadComplement? 'openHeadComplemet':'closedHeadComplemet')}>
                {activeComplement == 'voiceAsistant' && (
                    <VoiceAsistant/>
                )}{activeComplement == 'notifications' && (
                    <Notifications title={'S'} notifications={userNotifications}/>
                )}
            </div>
            <aside ref={asideMenu} className={openMenu? '':'colapsedMenu'}>
                <div className="logoContainer">
                    <img title='SGA - Inventarios' src="https://i.pinimg.com/736x/65/86/a4/6586a4ed5a9bd2be7f43b69f71df4dd3.jpg" alt="" />
                    {openMenu && (
                        <div className="infoLogo">
                            <strong>INVENTARIOS</strong>
                            <span>SGA - Desarrollos</span>
                        </div>
                    )}
                </div>
                <MenuList openMenu={openMenu} items={subSections} setActiveSec={setActiveSec} activeSec={activeSec}/>
                <MenuList openMenu={openMenu} items={settingsSections} setActiveSec={setActiveSec} activeSec={activeSec}/>
            </aside>
            <main>
                    <Routes>
                        <Route path="/" element={<HomeGerence notifications={userNotifications}/>}/>
                        <Route path="Analytics" element={<Analytics/>}/>
                        <Route path="Analytics/:product_id" element={<ReferenceAnalitics/>}/>
                        <Route path="PricesList" element={<PricesList setActualist={setActualList}/>}/>
                        <Route path="PricesList/:priceListName" element={<PricesListDetails info={actualList}/>}/>
                        <Route path="Users" element={<GerenceUsers/>}/>
                        <Route path="Stores" element={<Stores/>}/>
                        <Route path="Movements" element={<MovementsInventory/>}/>
                        <Route path="Movements/record" element={<RecordMovents/>}/>
                    </Routes>
            </main>
            {openAlert && (
                <AlertsApp/>
            )}
        </div>
    )
}
