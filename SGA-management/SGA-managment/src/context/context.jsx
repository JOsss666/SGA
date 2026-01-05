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

    const clearNotifications = ()=>{
        setNotifications([])
    }

    const value = {
        notifications,
        addNotification,
        deleteNotification,
        clearNotifications
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
    const [darkMode,setDarkMode] = useState(false);
    const [userInfo,setUserInfo] = useState({});
    const [loadingAppData,setLoadingAppData] = useState(true);
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();

    const handleRedirect = ()=>{
        navigate('/SGA_management/logIn')
    }

    const handleNavigate = (path)=>{
        navigate(`/SGA_management/${params.company_key}/${params.user_key}/${path}`)
    }

    const optionsMenu = [
        {text:'Inicio',path:'',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914614/LogoInicio1_nsuzaj.png' />,action:handleNavigate},
        {text:'Crear',path:'new',icon:<i className="fa-solid fa-plus"/>,action:handleNavigate},
        {text:'Mi empresa',path:'myBussines',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515331/Grupo5logos_1_ypuddp.png'/>,action:handleNavigate},
        {text:'Panel de control',path:'controlPanel',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515365/Grupo5logos_2_kjgapy.png'/>,action:handleNavigate},
        {text:'Modulos',path:'modules',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515340/Grupo5logos_3_qp85tn.png'/>,action:handleNavigate},
        {text:'Servicios',path:'services',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761514434/descarga_1_ih8bdx.png'/>,action:handleNavigate},
        {text:'Facturación',path:'billing',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761514282/descarga_dot8uw.png'/>,action:handleNavigate},
        {text:'Mensajes',path:'messages',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913446/MensajesLogo2_y4fjoa.png'/>,action:handleNavigate},
        {text:'Terceros',path:'thirdparties',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        {text:'Usuarios',path:'users',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760910902/CuentaLogo1_aqqot5.png'/>,action:handleNavigate},
        {text:'Informes',path:'reports',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
        {text:'Estadisticas',path:'analytics',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
        {text:'Calendario',path:'calendar',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913184/LogoCalendario1_ig0avt.png'/>,action:handleNavigate},
        {text:'Conceptos e impuestos',path:'concepts',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914608/LogoConceptosImpuestos_w0klzj.png'/>,action:handleNavigate},
        {text:'PLan de Cuentas',path:'accounts',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914607/LogoBuscarDOc_bpleiw.png'/>,action:handleNavigate},
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
        {text:'Mi empresa',path:'myBussines',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515331/Grupo5logos_1_ypuddp.png'/>,action:handleNavigate},
        {text:'Panel de control',path:'controlPanel',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515365/Grupo5logos_2_kjgapy.png'/>,action:handleNavigate},
        {text:'Modulos',path:'modules',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515340/Grupo5logos_3_qp85tn.png'/>,action:handleNavigate},
        {text:'Servicios',path:'services',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761514434/descarga_1_ih8bdx.png'/>,action:handleNavigate},
        {text:'Facturación',path:'billing',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761514282/descarga_dot8uw.png'/>,action:handleNavigate},
        {text:'Mensajes',path:'messages',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913446/MensajesLogo2_y4fjoa.png'/>,action:handleNavigate},
        {text:'Usuarios',path:'users',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760910902/CuentaLogo1_aqqot5.png'/>,action:handleNavigate},
        {text:'Terceros',path:'users',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        {text:'Informes',path:'reports',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Ordenes de Cliente',path:'reports/OCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Ordenes de Producción',path:'reports/OPS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Documentos de Compra',path:'reports/DCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Facturas de Venta',path:'reports/FVS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Consumos de Inventario',path:'reports/CIS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
            {text:'Informe Transacciónes',path:'reports/TRS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
        {text:'Estadisticas',path:'analytics',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas Ordenes de Cliente (OCS)',path:'analytics/OCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas Ordenes de Producción (OPS)',path:'analytics/OPS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas Documentos de Compra (DCS)',path:'analytics/DCS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas Facturas de Venta (FVS)',path:'analytics/FVS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
            {text:'Estadisticas  Consumos de inventarios (CIS)',path:'analytics/CIS',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
        {text:'Conceptos e impuestos',path:'concepts',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914608/LogoConceptosImpuestos_w0klzj.png'/>,action:handleNavigate},
        {text:'Calendario',path:'calendar',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913184/LogoCalendario1_ig0avt.png'/>,action:handleNavigate},
        {text:'Conceptos e impuestos',path:'concepts',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914608/LogoConceptosImpuestos_w0klzj.png'/>,action:handleNavigate},
        {text:'Plan de Cuentas',path:'accounts',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914607/LogoBuscarDOc_bpleiw.png'/>,action:handleNavigate},
    ]


    const getAppData = async()=>{
        let data = location.pathname.split('/')
        setLoadingAppData(true);
        let appI = await postInfo('/getCompanyInfo',data[2]);
        if(appI[0]){
            setAppInfo(appI[1][0]);
        }else{
            handleRedirect();
        }
        let userI = await postInfo('/getUserInfo',data[3]);
        console.log(userI);
        if(userI[0] && userI[1][0].user_session == 1){
            setUserInfo(userI[1][0])
        }else{
            handleRedirect();
        }
        setLoadingAppData(false);
    }

    useEffect(()=>{
        if(location.pathname != '/SGA_management/logIn' && location.pathname != '/SGA_management/SignUp' && location.pathname != '/'){
            getAppData();
        }
    },[])

        const value = {
        appInfo,
        setAppInfo,
        userInfo,
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