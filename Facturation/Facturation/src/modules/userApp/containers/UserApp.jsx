import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './UserApp.css'
import { SearchBar } from '../components/SearchBar';
import { ButtonMenu } from '../components/ButtonMenu';
import { UserCard } from '../components/UserCard';
import { MenuApp } from './MenuApp';
import { useAiAssistant, useAlert, useAppInfo, useNotifications, usePreview } from '../../../context/context';
import { useEffect, useRef, useState } from 'react';
import { ServiceSgaCard } from '../components/ServiceSgaCard';
import { LoadingAppDataPage } from './LoadingAppDataPage';
import { ServicesGrid } from './ServicesGrid';
import { HomeProcess } from './HomeProcess';
import { NotificationsApp } from './NotificationsApp';
import { AlertsHolder } from './AlertsHolder';
import { AcountsPlan } from './AcountsPlan';
import { TutorialAccountsPlan } from './tutorials/TutorialAccountsPlan';
import { Reports } from './Reports';
import { DocumentPreview } from './Alerts/DocumentPreview';
import { ConceptsPlan } from './ConceptsPlan';
import { ChatAi } from './ChatAi';
import { AiPet } from '../components/AiPet';
import { SwitchColorMode } from '../components/SwitchColorMode';
import { Analytics } from './Analytics'; 
import { AnalyticDocDetail } from './AnalyticDocDetail';
import { LogOut } from '../../Login/LogOut';
import { AppIcon } from '../components/AppIcon';
import { NotificationsMenuSpace } from './NotificationsMenuSpace';
import { Modules } from './Modules';
import { Users } from './Users';
import { DetailsUser } from './DetailsUser';
import { Services } from './Services';
import { PathLocation } from '../components/PathLocation';
import { ThirdPartyDetail } from './ThirdPartyDetail';
import { ThirdParties } from './ThirdParties';
import { MyBussines } from './MyBussines';
import { MyBussinesUnits } from './MyBussinesUnits';
import { Settings } from './Settings';
import { CostCenters } from './CostCenters';
import { StoreDetail } from './StoreDetail';
import { Bussines } from './Bussines';
import { New } from './New';
import { Messages } from './Messages';
import { Calendar } from './Calendar';
import { CellarDetail } from './CellarDetail';
import {NoAccess} from './NoAccess';
import {SuspendedAccount} from './SuspendedAcount'
import { CashBoxes } from './CashBoxes';
import { CashBoxesDeetail } from './CashBoxesDetail';
import { useRealtime } from '../../../utils/useRealTime';
import { ProcessStatusAlert } from './Alerts/ProcessStatusAlert';
import { ProcessInstanceAnalytics } from './Analytics/ProcessInstanceAnalycs';
import { Analytics2 } from './Analytics2';
import { QuickActions } from './QuickActions';
import { ElectronicDocuments } from './ElectronicDocuments';
import { SearchResultsPannel } from './Alerts/SearchResultsPannel';

export function UserApp(){

    // Context Info
    const {appInfo,userInfo,loadingAppData,darkMode,getAppData,optionsMenu,secondOptionsMenu,routesApp,userConfig} = useAppInfo();
    const {openPreview,setOpenPreview} = usePreview();
    const {addNotification} = useNotifications();
    const {openAlert,popInAlert,removeAlert} = useAlert();
    const {visibleChatAi,setVisibleChatAi} = useAiAssistant();
    const [statusPage,setStatusPage] = useState('loading');

    // Container Params
    const [visibleMenu,setVisibleMenu] = useState(false);
    const asideMenuC = useRef();
    const [visibleApps,setVisibleApps] = useState(false);
    const [quickSearch,setQuickSearch] = useState("");
    const [visibleNotifications,setVisibleNotifications] = useState(false)
    const [showAiPet,setShowAiPet] = useState(true);
    const [visibleResultsSearch,setVisibleResultsSearch] = useState(false);

    useEffect(()=>{
        getAppData();
    },[])

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

    useEffect(() => {
        const handlePreviewEscape = (event) => {
            if (event.key === 'Escape' && !openAlert && openPreview) {
                setOpenPreview(false);
            }
        };

        window.addEventListener('keydown', handlePreviewEscape);
        return () => window.removeEventListener('keydown', handlePreviewEscape);
    }, [openAlert, openPreview, setOpenPreview]);
        
    const filterOptions = (value) => {
        if (!quickSearch) return true; 
            return value.toLowerCase().includes(quickSearch.toLowerCase());
    }

    useEffect(() => {
        const root = document.documentElement; // <html>
        if (darkMode) root.classList.add('dark');
        else root.classList.remove('dark');
    }, [darkMode]);

    useEffect(()=>{
        if(quickSearch == "") return;

        const initialSearchValue = quickSearch;
        popInAlert(
            <SearchResultsPannel searchValue={initialSearchValue}/>,
            { id: 'quick-search', closeLabel: 'Cerrar búsqueda' }
        );
        setQuickSearch("");
    },[quickSearch, popInAlert])

    useEffect(() => () => {
        removeAlert('quick-search');
    }, [removeAlert]);

    useEffect(() => {
        if (visibleChatAi) {
            setVisibleNotifications(false);
            setShowAiPet(false);
            return undefined;
        }

        const showPetTimer = window.setTimeout(() => {
            setShowAiPet(true);
        }, 500);

        return () => window.clearTimeout(showPetTimer);
    }, [visibleChatAi]);

    useEffect(() => {
        if (visibleNotifications) {
            setVisibleChatAi(false);
        }
    }, [visibleNotifications]);

    useEffect(()=>{
        if(userConfig.access != undefined){
            if(!userConfig.access.suspended){
                if(userConfig.access.modules.
                    facturation.use == true){
                    setStatusPage('page')
                }else{
                    setStatusPage('noAccess');
                }
            }else{
                setStatusPage('suspended')
            }
        }
    },[userConfig])

    useRealtime(appInfo.company_id, (payload) => {
        const infoPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
        console.log("Payload procesado:", infoPayload);
        if (infoPayload.table === 'process_instance') {
            let handleOpenProcess = ()=>{
                popInAlert(<ProcessStatusAlert instance_id={infoPayload.data.id}/>)
            }
            addNotification({
                type: 'info',
                title: `Actualización en proceso #${infoPayload.data.ownSerial}`,
                description: `Instancia #${infoPayload.data.ownSerial} actualizada.`,
                onClick:handleOpenProcess
            });
        }
    });

    return(
        <div className={`UserApp`}>
            {!loadingAppData && statusPage=='page' &&(
                <>
                    <header className='headApp'>
                    <SearchBar placeholder={`Buscar en ${appInfo.legal_name} - Ventas`} value={quickSearch} action={setQuickSearch}/>
                    {visibleResultsSearch && (
                        <div className="resultsQuickSerch">
                            {quickSearch != "" && routesApp.map((element,index)=>(
                                <AppIcon onClick={()=>{
                                    setVisibleResultsSearch(false);
                                    if(element.action != undefined){
                                        element.action(element.path);
                                    }
                                }} hidden={!filterOptions(element.text)} key={index} title={element.text} visibleTitle={true}>
                                    {element.icon}
                                </AppIcon>
                            ))}
                        </div>
                    )}
                    <div className="subMenuHeader">
                        <ButtonMenu onClick={()=>{setVisibleNotifications(!visibleNotifications)}} title={"Notificaciones"} children={<i className="fa-regular fa-bell"></i>}/>
                        <div className="AiAssitantBtn" onClick={()=>{setVisibleChatAi(!visibleChatAi)}} title={"Asistente IA"}>
                            <img src={darkMode ? "https://cdnmain.sga360.co/Branding/TileAiAisstant.png":"https://cdnmain.sga360.co/Branding/AIAssistanLogo.png" } alt="" />
                        </div>
                        {false && <ButtonMenu onClick={()=>{setVisibleChatAi(!visibleChatAi)}} title={"Asistente IA"} children={<img src="https://cdnmain.sga360.co/Branding/AIAssistanLogo.png" alt="" />}/>}
                        <ButtonMenu noRotate={true} onClick={()=>{setVisibleApps(!visibleApps)}} title={"Mis aplicaciones"} children={<i className="bi bi-grid-3x3-gap-fill"/>}/>
                    </div>
                    {visibleApps && (
                        <ServicesGrid/>
                    )}
                    <NotificationsMenuSpace visible={visibleNotifications}/>
                    <UserCard name={userInfo.user_name} imgSrc={userInfo.img} desc={userInfo.user_roll} />
                    <SwitchColorMode/>
                </header>
                <aside ref={asideMenuC}  className='asideMenuApp'>
                    <div className={`menusHolder ${visibleMenu? 'activeMenusHolder':'hiddenAsideMenu'}`}>
                        {!visibleMenu && (
                            <div className='openMenuMobileIcon' onClick={()=>{
                                    setVisibleMenu(true)
                                }}>
                                <i className="fa-solid fa-bars"/>
                            </div>
                        )}
                        <div className='closeMenuMobileIcon' onClick={()=>{
                                setVisibleMenu(false)
                            }}>
                            <i className="fa-solid fa-xmark"/>
                        </div>
                        <ServiceSgaCard imgRef={'https://cdnmain.sga360.co/static/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.webp'} visbleInfo={visibleMenu} title={'Ventas'} desc={'SGA - Desarrollos'} />
                        <MenuApp setVisibleMenu={setVisibleMenu} visibleMenu={visibleMenu} title={'General'} options={optionsMenu}/>
                        <MenuApp setVisibleMenu={setVisibleMenu} visibleMenu={visibleMenu} title={'Ajustes'} options={secondOptionsMenu}/>
                    </div>
                </aside>
                <main className='bodyApp'>
                    <Routes>
                            <Route path='/' element={<HomeProcess/>} />
                            <Route path='/new' element={<New></New>} />
                            <Route path='/edocuments' element={<ElectronicDocuments/>} />
                            <Route path='/edocuments/:e_doc_id' element={<NoAccess 
                                title={'Seccion en construcción'}
                                description={`Estamos trabajando para ofrecer esta seccion lo mas pronto posible :)`}
                                img={'https://cdnmain.sga360.co/static/Gemini_Generated_Image_hqrv0mhqrv0mhqrv-2_lne97l.webp'}
                                noExit={true}
                                />} />
                            <Route path='quickActions' element={<QuickActions/>} />
                            <Route path='/myBussines/' element={<MyBussines/>}/>
                            <Route path='/myBussines/costCenters' element={<CostCenters/>}/>
                            <Route path='/myBussines/Bussines' element={<Bussines/>}/>
                            <Route path='/myBussines/Bussines/:bussines_id' element={<PathLocation/>}/>
                            <Route path='/myBussines/Units' element={<MyBussinesUnits/>}/>
                            <Route path='/myBussines/Units/:store_id' element={<StoreDetail/>}/>
                            <Route path='/myBussines/Units/:store_id/:cellar_id' element={<CellarDetail/>}/>
                            <Route path='/controlPanel/' element={<span>controlPanel</span>}/>
                            <Route path='/modules/*' element={<Modules/>}/>
                            <Route path='/services' element={<Services/>}/>
                            <Route path='/cashBoxes' element={<CashBoxes/>}/>
                                <Route path='/cashBoxes/:cashBox_id' element={<CashBoxesDeetail/>}/>
                            <Route path='/services/:serviceRequierd' element={<PathLocation/>}/>
                            <Route path='/billing' element={<span>Facturación</span>}/>
                            <Route path='/messages/*' element={<Messages/>} />
                            <Route path='/thirdparties/*' element={<ThirdParties/>} />
                            <Route path='/thirdparties/:thirdparty_id' element={<ThirdPartyDetail/>} />
                            {userConfig.access != undefined && userConfig.access.sections.users.overAll && (
                                <Route path='/users/' element={<Users/>} />
                            )}
                            <Route path='/users/:user_id' element={<DetailsUser/>} />
                            <Route path='/reports/*' element={<Reports/>} />
                            <Route path='/analytics/*' element={<Analytics2/>} />
                            <Route path='/calendar' element={<Calendar/>} />
                            <Route path='/concepts' element={<ConceptsPlan/>} />
                            <Route path='/accounts' element={!appInfo.accountPlanId != null? <AcountsPlan/>:<TutorialAccountsPlan/>} />
                            <Route path='/settings/*' element={<Settings/>} />
                            <Route path='/tutorials' element={<NoAccess 
                                title={'Seccion no disponible'}
                                description={`Estamos trabajando para ofrecer esta seccion lo mas pronto posible :)`}
                                img={'https://cdnmain.sga360.co/static/Grupo5logos_4_rhapbp.webp'}
                                noExit={true}
                                />} />
                            <Route path='/help' element={<NoAccess 
                                title={'Seccion no disponible'}
                                description={`Estamos trabajando para ofrecer esta seccion lo mas pronto posible :)`}
                                img={'https://cdnmain.sga360.co/static/AyudaLogo1_v362of.webp'}
                                noExit={true}
                                />} />
                            <Route path='/logOut' element={<LogOut/>} />
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
                {/* Mascota IA oculta temporalmente. Reactivar: */}
                {/* {!visibleChatAi && showAiPet && <AiPet/>} */}
                </>
            )}
            {loadingAppData && (
                <LoadingAppDataPage/>
            )}
            {!loadingAppData && statusPage == 'noAccess' && (
                <NoAccess/>
            )}
            {!loadingAppData && statusPage == 'suspended' && (
                <SuspendedAccount/>
            )}
        </div>
    )
}
