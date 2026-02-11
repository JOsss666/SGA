import { createContext, useContext, useEffect, useState } from 'react';
import { postInfo } from '../utils/functions';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const AppInfo = createContext();
const AppNotifications = createContext();
const AppAlerts = createContext();
const PreviewDocs = createContext();
const AiAssistant = createContext();

export function useAppInfo(){
    return useContext(AppInfo);
}

export function useNotifications(){
    return useContext(AppNotifications);
}

export function useAlert(){
    return useContext(AppAlerts);
}

export function usePreview(){
    return useContext(PreviewDocs);
}

export function useAiAssistant(){
    return useContext(AiAssistant);
}

export function NotificationsProvider({children}){
    const [notifications,setNotifications] = useState([]);
    
    const addNotification = (newNotification)=>{
        let C = []
        notifications.map((element)=>{
            C.push(element)
        })
        C.push(newNotification)
        setNotifications(C);
    }

    const deleteNotification = (indexDel)=>{
        let C = []
        notifications.map((element,index)=>{
            if(index != indexDel){
                C.push(element)
            }
        })
        setNotifications(C);
    }

    const value = {
        notifications,
        addNotification,
        deleteNotification
    }

    useEffect(()=>{
        console.log(notifications);
    },[notifications])

    return(
        <AppNotifications.Provider value={value}>
            {children}  
        </AppNotifications.Provider>
    )
}

export function AiAssistanProvider({children}){
    const [visibleChatAi,setVisibleChatAi] = useState(false);
    const [loading,setLoading] = useState();
    const [usedTokens,setUsedTokens] = useState(0);
    const {userInfo} = useAppInfo();
    const [chat,setChat] = useState([]);

    const addMessage = (newMessage) => {
        setChat(prev => [...prev, newMessage]);
    };

    const sendPrompt = async(text,attached,onlyResponse)=>{
        setLoading(true)
        if(!onlyResponse){
            setVisibleChatAi(true);
                addMessage({
                    text:text,
                    user_id:userInfo.user_id,
                    user_name:userInfo.user_name
                })
                let res = await postInfo('/processAiRequest',{
                    text:text,
                    attached,
                    userInfo
                })
                if(res.AI_response[0]){
                    addMessage({
                        children:JSON.parse(res.AI_response[1]),
                        user_id:0
                        })
                    }else{
                        addMessage({
                            text:`❌ Error, hubo un problema al intentar procesar tu solicitud, intentalo de nuevo.`,
                            user_id:0,
                            user_name:'Asistente AI'
                        })
                }
        }else{
            let res = await postInfo('/processAiRequest',{
                text:text,
                attached,
                userInfo
            })
            console.log(res.AI_response)
            if(res.AI_response[0]){
                return([true,JSON.parse(res.AI_response[1])])
            }else{
                return([false,[]])
            }
        }
        setLoading(false)
    }

    const value = {
        chat,
        usedTokens,
        addMessage,
        setChat,
        setUsedTokens,
        sendPrompt,
        visibleChatAi,
        setVisibleChatAi,
        loading,
        setLoading
    }

    useEffect(()=>{
        console.log(chat)
    },[chat])

    return (
        <AiAssistant.Provider value={value}>
        {children}
        </AiAssistant.Provider>
    );
}

export function AlertProvider({ children }) {
    const [openAlert, setOpenAlert] = useState(false);
    const [tailAlerts, setTailAlerts] = useState([]);
    
    const popInAlert = (child) => {
        console.log('Abriendo alerta')
        setTailAlerts(prev => [...prev, {alert:child}]);
        setOpenAlert(true);
    }

    const popOutAlert = () => {
        if(tailAlerts.length >1){
            let C = []
            tailAlerts.map((element,index)=>{
                if(index != tailAlerts.length -1){
                    C.push(element);
                }
            });
            setTailAlerts(C);
        }else{
        setOpenAlert(false)
        setTailAlerts([])
        }
    }

    const value = {
        openAlert,
        setOpenAlert,
        tailAlerts,
        setTailAlerts,
        popInAlert,
        popOutAlert
    };

    useEffect(()=>{
        if(openAlert == false){
            setTailAlerts([])
        }
    },[openAlert])

    return (
        <AppAlerts.Provider value={value}>
        {children}
        </AppAlerts.Provider>
    );
}

export function PreviewProvider({children}){

    const [openPreview,setOpenPreview] = useState(false);
    const [previewInfo,setPreviewInfo] = useState({});

    const value = {
        openPreview,
        setOpenPreview,
        previewInfo,
        setPreviewInfo
    }

    return(
        <PreviewDocs.Provider value={value}>
        {children}
        </PreviewDocs.Provider>
    )
}


export function AppInfoProvider({children}){
    const [appInfo,setAppInfo] = useState({});
    const [appConfig,setAppConfig] = useState({});
    const [darkMode,setDarkMode] = useState(false);
    const [userInfo,setUserInfo] = useState({});
    const [userConfig,setUserConfig] = useState({});
    const [loadingAppData,setLoadingAppData] = useState(true);
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();

    const handleRedirect = ()=>{
        navigate('/SGA_INVENTORY/logIn')
    }

    const handleNavigate = (path)=>{
        navigate(`/SGA_INVENTORY/${params.company_key}/${params.user_key}/${path}`)
    }

    const optionsMenu = [
        {text:'Inicio',path:'',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914614/LogoInicio1_nsuzaj.png' />,action:handleNavigate},
        ...(userConfig.access != undefined && userConfig.access.sections.search.overAll ? [{text:'Busqueda',path:'Search',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760909160/BuscarLogo1_jf8ij8.png'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.stores.overAll ? [{text:'Tienda',path:'Stores',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1764436577/ChatGPT_Image_29_nov_2025_12_15_47_kxqs81.png'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.products.overAll ? [{text:'Productos',path:'Products',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1764620093/ChatGPT_Image_1_dic_2025_15_04_38_3_hcdqxl.png'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.categories.overAll ? [{text:'Categorías',path:'Categories',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1764619633/ChatGPT_Image_1_dic_2025_15_04_38_2_hwmmk5.png'/>,action:handleNavigate},]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.users.overAll ? [{text:'Usuarios',path:'users',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760910902/CuentaLogo1_aqqot5.png'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.pricesList.overAll ? [{text:'Listas de precios',path:'PricesList',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1764363272/ChatGPT_Image_28_nov_2025_15_54_16_tl5bv3.png'/>,action:handleNavigate},]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.movements.overAll ? [{text:'Movimientos',path:'Movements',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913629/DocumentosLogo_fuofdc.png'/>,action:handleNavigate},]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.reports.overAll ? [{text:'Informes',path:'reports',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.analytics.overAll ? [{text:'Estadisticas',path:'analytics',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate}]:[]),
        {text:'Mensajes',path:'messages',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913446/MensajesLogo2_y4fjoa.png'/>,action:handleNavigate},
        {text:'Calendario',path:'calendar',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913184/LogoCalendario1_ig0avt.png'/>,action:handleNavigate},
    ]

    const secondOptionsMenu = [
        {text:'Configuración',path:'settings',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579057/ChatGPT_Image_27_oct_2025_10_28_59_1_vfix8g.png'/>,action:handleNavigate},
        {text:'Tutoriales',path:'tutorials',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515342/Grupo5logos_4_rhapbp.png'/>,action:handleNavigate},
        {text:'Ayuda',path:'help',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760911291/AyudaLogo1_v362of.png'/>,action:handleNavigate},
        {text:'Cerrar Sesión',path:'logOut',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760911296/CerrarSesionLogo1_moghr7.png'/>,action:handleNavigate},
        //{text:'Registro',path:'../../signUp',icon:<i className="fa-solid fa-user-plus"/>},
    ]

    const routesApp = [
        {text:'Inicio',path:'',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914614/LogoInicio1_nsuzaj.png' />,action:handleNavigate},
        {text:'Mensajes',path:'messages',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913446/MensajesLogo2_y4fjoa.png'/>,action:handleNavigate},
        ...(userConfig.access != undefined && userConfig.access.sections.users.overAll ? [{text:'Usuarios',path:'users',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760910902/CuentaLogo1_aqqot5.png'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.users.overAll ? [{text:'Terceros',path:'users',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.reports.overAll ? [{text:'Informes',path:'reports',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate}]:[]),
            {text:'Informe Ordenes de Cliente',path:'reports/OCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Ordenes de Producción',path:'reports/OPS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Documentos de Compra',path:'reports/DCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Facturas de Venta',path:'reports/FVS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Consumos de Inventario',path:'reports/CIS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Transacciónes',path:'reports/TRS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
        ...(userConfig.access != undefined && userConfig.access.sections.analytics.overAll ? [{text:'Estadisticas',path:'analytics',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate}]:[]),
            {text:'Estadisticas Ordenes de Cliente (OCS)',path:'analytics/OCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas Ordenes de Producción (OPS)',path:'analytics/OPS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas Documentos de Compra (DCS)',path:'analytics/DCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas Facturas de Venta (FVS)',path:'analytics/FVS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas  Consumos de inventarios (CIS)',path:'analytics/CIS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
        {text:'Calendario',path:'calendar',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913184/LogoCalendario1_ig0avt.png'/>,action:handleNavigate},
    ]


    const getAppData = async()=>{
        let data = location.pathname.split('/')
        setLoadingAppData(true);
        let appI = await postInfo('/getCompanyInfo',data[2]);
        if(appI[0]){
            setAppInfo(appI[1][0]);
            setAppConfig(appI[1][0].config);
        }else{
            handleRedirect();
        }
        let userI = await postInfo('/getUserInfo',data[3]);
        console.log(userI);
        if(userI[0] && userI[1][0].user_session == 1){
            setUserInfo(userI[1][0])
            if(userI[1][0].config != undefined){
                setUserConfig(userI[1][0].config)
            }
        }else{
            handleRedirect();
        }
        setLoadingAppData(false);
    }

    useEffect(()=>{
        if(userConfig.account != undefined){
            setDarkMode(userConfig.styles.theme.default != 'light')
        }
    },[userConfig])

    useEffect(()=>{
        if(location.pathname != '/SGA_INVENTORY/logIn' && location.pathname != '/SGA_INVENTORY/SignUp' && location.pathname != '/'){
            getAppData();
        }
    },[])

        const value = {
        appInfo,
        appConfig,
        setAppInfo,
        userInfo,
        userConfig,
        setUserInfo,
        darkMode,
        setDarkMode,
        loadingAppData,
        setLoadingAppData,
        getAppData,
        optionsMenu,
        secondOptionsMenu,
        routesApp
    }

    return(
        <AppInfo.Provider value={value}>
        {children}
        </AppInfo.Provider>
    )
}

