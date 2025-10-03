import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import {SearchBar} from '../componets/SearchBar'
import './GerenceApp.css'
import { UserCard } from '../componets/UserCard';
import {BigTitle} from './../componets/BigTitle'
import { ButtonMenu } from '../componets/ButtonMenu';
import { useEffect, useRef, useState } from 'react';
import { HomeGerence } from './HomeGerence';
import { Analytics } from './Analytics';
import { PricesList } from './PricesList';
import { PricesListDetails } from './PricesListDetails';
import { GerenceUsers } from './GerenceUsers';
import { useAlert } from '../../../context/context';
import { useAppInfo, usePreview, useNotifications } from '../../../context/context';
import {NotificationsApp} from './NotificationsApp'
import { Stores } from './Stores';
import { MovementsInventory } from './MovementsInventory';
import { DocumentPreview } from './alerts/DocumentPreview';
import { RecordMovents } from './RecordMovements';
import { ReferenceAnalitics } from './ReferenceAnalitics';
import {ChatAi} from './ChatAi'
import {MenuApp} from './MenuApp'
import {ServiceSgaCard} from './../componets/ServiceSgaCard'
import {LoadingAppDataPage} from './LoadingAppDataPage'
import {ServicesGrid} from './ServicesGrid'
import {AlertsHolder} from './AlertsHolder'

export function GerenceApp(){
    
// Context Info
    const {appInfo,userInfo,loadingAppData} = useAppInfo();
    const {previewInfo,openPreview,setOpenPreview} = usePreview();
    const {tailAlerts,openAlert,popOutAlert} = useAlert();
    const [visibleChatAi,setVisibleChatAi] = useState(false);

    // Container Params
    const [visibleMenu,setVisibleMenu] = useState(false);
    const asideMenuC = useRef();
    const [visibleApps,setVisibleApps] = useState(false);

    const optionsMenu = [
        {text:'Inicio',path:'',icon:<i className="fa-solid fa-display"/>},
        {text:'Estadisticas',path:'Analytics',icon:<i className="fa-solid fa-chart-bar"/>},
        {text:'Listas de precios',path:'PricesList',icon:<i className="fa-solid fa-clipboard-list"/>},
        {text:'Usuarios',path:'Users',icon:<i className="fa-solid fa-user-tie"/>},
        {text:'Tiendas',path:'Stores',icon:<i className="fa-solid fa-store"/>},
        {text:'Movimientos',path:'Movements',icon:<i className="fa-solid fa-cart-arrow-down"/>}
    ]

    const setingsPage = [
        {text:'Tutoriales',path:'help',icon:<i className="fa-brands fa-youtube"/>},
        {text:'Ayuda',path:'help',icon:<i className="fa-solid fa-question"/>},
        {text:'Configuración',path:'settings',icon:<i className="fa-solid fa-gear"/>},
        {text:'Cerrar Sesión',path:'../../logIn',icon:<i className="fa-solid fa-arrow-right-from-bracket"/>}
    ]

    useEffect(()=>{
        if(asideMenuC.current != null){
            asideMenuC.current.addEventListener("mouseenter", () => {
                setVisibleMenu(true);
            });
            asideMenuC.current.addEventListener("mouseleave", () => {
                setVisibleMenu(false);
            });
        }
    }),[asideMenuC.current];

    useEffect(()=>{
        console.log(loadingAppData);
    },[loadingAppData])

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if(openAlert){
                popOutAlert();
            }
            if(openPreview){
                setOpenPreview(false);
            }
        }
    });


    return(
        <div className="GerenceApp">
            {!loadingAppData && (
            <>
                <header className='headApp'>
                    <BigTitle title={appInfo.legal_name}/>
                    <SearchBar placeholder={"Buscar en SGA - Inventarios"}/>
                    <div className="subMenuHeader">
                        <ButtonMenu title={"Notificaciones"} children={<i className="fa-regular fa-bell"></i>}/>
                        <ButtonMenu onClick={()=>{setVisibleChatAi(!visibleChatAi)}} title={"Asistente IA"} children={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M260.4 249.8L260.4 201.2C260.4 197.1 261.9 194 265.5 192L363.3 135.7C376.6 128 392.5 124.4 408.9 124.4C470.3 124.4 509.3 172 509.3 222.7C509.3 226.3 509.3 230.4 508.8 234.5L407.3 175.1C401.2 171.5 395 171.5 388.9 175.1L260.4 249.8zM488.7 439.2L488.7 323C488.7 315.8 485.6 310.7 479.5 307.1L351 232.4L393 208.3C396.6 206.3 399.7 206.3 403.2 208.3L501 264.7C529.2 281.1 548.1 315.9 548.1 349.7C548.1 388.6 525.1 424.5 488.7 439.3L488.7 439.3zM230.2 336.8L188.2 312.2C184.6 310.2 183.1 307.1 183.1 303L183.1 190.4C183.1 135.6 225.1 94.1 281.9 94.1C303.4 94.1 323.4 101.3 340.3 114.1L239.4 172.5C233.3 176.1 230.2 181.2 230.2 188.4L230.2 336.9L230.2 336.9zM320.6 389L260.4 355.2L260.4 283.5L320.6 249.7L380.8 283.5L380.8 355.2L320.6 389zM359.3 544.7C337.8 544.7 317.8 537.5 300.9 524.7L401.8 466.3C407.9 462.7 411 457.6 411 450.4L411 301.9L453.5 326.5C457.1 328.5 458.6 331.6 458.6 335.7L458.6 448.3C458.6 503.1 416.1 544.6 359.3 544.6L359.3 544.6zM237.8 430.5L140.1 374.2C111.9 357.8 93 323 93 289.2C93 249.8 116.6 214.4 152.9 199.6L152.9 316.3C152.9 323.5 156 328.6 162.1 332.2L290.1 406.4L248.1 430.5C244.5 432.5 241.4 432.5 237.9 430.5zM232.2 514.5C174.3 514.5 131.8 471 131.8 417.2C131.8 413.1 132.3 409 132.8 404.9L233.7 463.3C239.8 466.9 246 466.9 252.1 463.3L380.6 389.1L380.6 437.7C380.6 441.8 379.1 444.9 375.5 446.9L277.7 503.2C264.4 510.9 248.5 514.5 232.1 514.5L232.1 514.5zM359.2 575.4C421.2 575.4 472.9 531.4 484.6 473C541.9 458.1 578.8 404.4 578.8 349.6C578.8 313.8 563.4 278.9 535.8 253.9C538.4 243.1 539.9 232.4 539.9 221.6C539.9 148.4 480.5 93.6 411.9 93.6C398.1 93.6 384.8 95.6 371.5 100.3C348.5 77.8 316.7 63.4 281.9 63.4C219.9 63.4 168.2 107.4 156.5 165.8C99.2 180.6 62.3 234.4 62.3 289.2C62.3 325 77.7 359.9 105.3 384.9C102.7 395.7 101.2 406.4 101.2 417.2C101.2 490.4 160.6 545.2 229.2 545.2C243 545.2 256.3 543.2 269.6 538.5C292.6 561 324.4 575.4 359.2 575.4z"/></svg>}/>
                        <ButtonMenu onClick={()=>{setVisibleApps(!visibleApps)}} title={"Mis aplicaciones"} children={<div className='appsDots'>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>}/>
                    </div>
                    {visibleApps && (
                        <ServicesGrid/>
                    )}
                    <UserCard name={userInfo.user_name} imgSrc={'https://i.pinimg.com/736x/fc/55/78/fc557891f4587e03e4eaaea18a4bc9c3.jpg'} desc={userInfo.user_roll} />
                </header>
                <aside ref={asideMenuC}  className='asideMenuApp'>
                    <div className={`menusHolder ${visibleMenu? 'activeMenusHolder':''}`}>
                        <ServiceSgaCard imgRef={'https://res.cloudinary.com/djjxugmni/image/upload/v1759182004/ChatGPT_Image_29_sept_2025_16_39_52_osso5g.png'} visbleInfo={visibleMenu} title={'Inventarios'} desc={'SGA - Desarrollos'} />
                        <MenuApp visibleMenu={visibleMenu} title={'General'} options={optionsMenu}/>
                        <MenuApp visibleMenu={visibleMenu} title={'Ajustes'} options={setingsPage}/>
                    </div>
                </aside>
                <main>
                        <Routes>
                            <Route path="/" element={<HomeGerence notifications={[]}/>}/>
                            <Route path="Analytics" element={<Analytics/>}/>
                            <Route path="Analytics/:product_id" element={<ReferenceAnalitics/>}/>
                            <Route path="PricesList" element={<PricesList setActualist={{}}/>}/>
                            <Route path="PricesList/:priceListName" element={<PricesListDetails info={{}}/>}/>
                            <Route path="Users" element={<GerenceUsers/>}/>
                            <Route path="Stores" element={<Stores/>}/>
                            <Route path="Movements" element={<MovementsInventory/>}/>
                            <Route path="Movements/record" element={<RecordMovents/>}/>
                        </Routes>
                </main>
                {openPreview && (
                        <DocumentPreview/>
                    )}
                    <NotificationsApp/>
                    {openAlert && (
                        <AlertsHolder/>
                    )}
                    <ChatAi visible={visibleChatAi}/>
                    </>
                )}
                {loadingAppData && (
                    <LoadingAppDataPage/>
                )}
        </div>
    )
}
