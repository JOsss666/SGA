import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { postInfo } from '../utils/functions';
import { AI_DESTINATIONS, sendPrompt as sendAiRequest } from '../services/aiPromptService';
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
    let localIndexOfNoti = 0;

    const addNotification = (newNotification) => {
        // 1. Generamos un ID único basado en el tiempo para que no colisionen
        const id = Date.now() + Math.random(); 
        
        // 2. Usamos la sintaxis de actualización funcional para asegurar el estado más reciente
        setNotifications(prev => [
            ...prev, 
            { ...newNotification, id } // Agregamos el ID al objeto
        ]);
    };

    const deleteNotification = (idToDelete) => {
        // 3. Filtramos por el ID único, no por el índice
        setNotifications(prev => prev.filter(element => element.id !== idToDelete));
    };

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
                let res = (await sendAiRequest({
                    destination: AI_DESTINATIONS.CONTROLLER,
                    target: '/processAiRequest',
                    content: { text, attached, userInfo },
                    companyId: userInfo.company_id
                })).data
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
            let res = (await sendAiRequest({
                destination: AI_DESTINATIONS.CONTROLLER,
                target: '/processAiRequest',
                content: { text, attached, userInfo },
                companyId: userInfo.company_id
            })).data
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
    const [tailAlerts, setTailAlerts] = useState([]);

    const popInAlert = useCallback((alert, options = {}) => {
        const id = options.id ?? `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        setTailAlerts(current => {
            const existingIndex = current.findIndex(entry => entry.id === id);
            const nextAlert = {
                id,
                alert,
                fullScale: options.fullScale ?? false,
                closeLabel: options.closeLabel ?? 'Cerrar alerta',
            };

            if (existingIndex === -1) return [...current, nextAlert];

            return current.map((entry, index) => index === existingIndex
                ? { ...entry, ...nextAlert }
                : entry
            );
        });

        return id;
    }, []);

    // LIFO: sin argumentos siempre retira exclusivamente la alerta superior.
    // expectedId permite que una tarea asincrona cierre su propia alerta solo
    // cuando esta sigue siendo la que esta en primer plano.
    const popOutAlert = useCallback((expectedId) => {
        setTailAlerts(current => {
            if (current.length === 0) return current;

            const topAlert = current[current.length - 1];
            if (expectedId != null && topAlert.id !== expectedId) return current;

            return current.slice(0, -1);
        });
    }, []);

    const removeAlert = useCallback((id) => {
        if (id == null) return;
        setTailAlerts(current => current.filter(entry => entry.id !== id));
    }, []);

    const replaceTopAlert = useCallback((alert, options = {}) => {
        setTailAlerts(current => {
            if (current.length === 0) return current;

            const topIndex = current.length - 1;
            return current.map((entry, index) => index === topIndex
                ? {
                    ...entry,
                    alert,
                    fullScale: options.fullScale ?? entry.fullScale,
                    closeLabel: options.closeLabel ?? entry.closeLabel,
                }
                : entry
            );
        });
    }, []);

    const updateAlert = useCallback((id, alert, options = {}) => {
        setTailAlerts(current => current.map(entry => entry.id === id
            ? {
                ...entry,
                alert,
                fullScale: options.fullScale ?? entry.fullScale,
                closeLabel: options.closeLabel ?? entry.closeLabel,
            }
            : entry
        ));
    }, []);

    const clearAlerts = useCallback(() => setTailAlerts([]), []);
    const openAlert = tailAlerts.length > 0;

    // Adaptador temporal para consumidores antiguos del contexto.
    const setOpenAlert = useCallback((isOpen) => {
        if (typeof isOpen === 'function') {
            setTailAlerts(current => isOpen(current.length > 0) ? current : []);
            return;
        }
        if (!isOpen) clearAlerts();
    }, [clearAlerts]);

    const value = useMemo(() => ({
        openAlert,
        setOpenAlert,
        tailAlerts,
        setTailAlerts,
        popInAlert,
        popOutAlert,
        removeAlert,
        replaceTopAlert,
        updateAlert,
        clearAlerts,
    }), [openAlert, tailAlerts, popInAlert, popOutAlert, removeAlert, replaceTopAlert, updateAlert, clearAlerts, setOpenAlert]);

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
    const [appTaxConfig,setAppTaxConfig] = useState({});
    const [appConfig,setAppConfig] = useState({});
    const [darkMode,setDarkMode] = useState(false);
    const [userInfo,setUserInfo] = useState({});
    const [userConfig,setUserConfig] = useState({});
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
        {text:'Inicio',path:'',icon:<img src='https://cdnmain.sga360.co/static/LogoInicio1_nsuzaj.webp' />,action:handleNavigate},
        ...(userConfig.access != undefined && userConfig.access.sections.new.overAll ? [{text:'Crear',path:'new',icon:<i className="fa-solid fa-plus"/>,action:handleNavigate}]:[]),
        //{text:'Mensajes',path:'messages',icon:<img src='https://cdnmain.sga360.co/static/MensajesLogo2_y4fjoa.webp'/>,action:handleNavigate},
        ...(appConfig.access != undefined && appConfig.access.services.e_facturation.use ? [{text:'Documentos electronicos',path:'edocuments',icon:<img src='https://cdnmain.sga360.co/static/Gemini_Generated_Image_hqrv0mhqrv0mhqrv-2_lne97l.webp'/>,action:handleNavigate}]:[]),
        {text:'Acciones rapidas',path:'quickActions',icon:<img src='https://cdnmain.sga360.co/static/unnamed-2_rg2vg1.webp'/>,action:handleNavigate},
        {text:'Terceros',path:'thirdparties',icon:<img src='https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.webp'/>,action:handleNavigate},
        ...(userConfig.access != undefined && (
            userConfig.access.sections?.cashBoxes?.overAll === true
            || (userConfig.access.sections?.cashBoxes?.enabled?.length ?? 0) > 0
        ) ? [{text:'Cajas POS',path:'cashBoxes',icon:<img src='https://cdnmain.sga360.co/static/Gemini_Generated_Image_s5u7cls5u7cls5u7-2_zsw5jo.webp'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.users.overAll ? [{text:'Usuarios',path:'users',icon:<img src='https://cdnmain.sga360.co/static/CuentaLogo1_aqqot5.webp'/>,action:handleNavigate}]:[]),
        {text:'Informes',path:'reports',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
        {text:'Estadisticas',path:'analytics',icon:<img src='https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.webp'/>,action:handleNavigate},
        //{text:'Calendario',path:'calendar',icon:<img src='https://cdnmain.sga360.co/static/LogoCalendario1_ig0avt.webp'/>,action:handleNavigate},
    ]

    const secondOptionsMenu = [
        {text:'Configuración',path:'settings',icon:<img src='https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_1_vfix8g.webp'/>,action:handleNavigate},
        {text:'Tutoriales',path:'tutorials',icon:<img src='https://cdnmain.sga360.co/static/Grupo5logos_4_rhapbp.webp'/>,action:handleNavigate},
        {text:'Ayuda',path:'help',icon:<img src='https://cdnmain.sga360.co/static/AyudaLogo1_v362of.webp'/>,action:handleNavigate},
        {text:'Cerrar Sesión',path:'logOut',icon:<img src='https://cdnmain.sga360.co/static/CerrarSesionLogo1_moghr7.webp'/>,action:handleNavigate},
        //{text:'Registro',path:'../../signUp',icon:<i className="fa-solid fa-user-plus"/>},
    ]

    const routesApp = [
        {text:'Inicio',path:'',icon:<img src='https://cdnmain.sga360.co/static/LogoInicio1_nsuzaj.webp' />,action:handleNavigate},
        ...(userConfig.access != undefined && (
            userConfig.access.sections?.cashBoxes?.overAll === true
            || (userConfig.access.sections?.cashBoxes?.enabled?.length ?? 0) > 0
        ) ? [{text:'Cajas POS',path:'cashBoxes',icon:<img src='https://cdnmain.sga360.co/static/Gemini_Generated_Image_s5u7cls5u7cls5u7-2_zsw5jo.webp'/>,action:handleNavigate}]:[]),
        ...(userConfig.access != undefined && userConfig.access.sections.users.overAll ? [{text:'Usuarios',path:'users',icon:<img src='https://cdnmain.sga360.co/static/CuentaLogo1_aqqot5.webp'/>,action:handleNavigate}]:[]),
        ...(appConfig.access != undefined && appConfig.access.services.e_facturation.use ? [{text:'Documentos electronicos',path:'edocuments',icon:<img src='https://cdnmain.sga360.co/static/Gemini_Generated_Image_hqrv0mhqrv0mhqrv-2_lne97l.webp'/>,action:handleNavigate}]:[]),
        {text:'Estadisticas',path:'analytics',icon:<img src='https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.webp'/>,action:handleNavigate},
        {text:'Acciones rapidas',path:'quickActions',icon:<img src='https://cdnmain.sga360.co/static/unnamed-2_rg2vg1.webp'/>,action:handleNavigate},
        {text:'Terceros',path:'users',icon:<img src='https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.webp'/>,action:handleNavigate},
        {text:'Informes',path:'reports',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
            {text:'Informe Ordenes de Cliente',path:'reports/OCS',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
            {text:'Informe Ordenes de Producción',path:'reports/OPS',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
            {text:'Informe Documentos de Compra',path:'reports/DCS',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
            {text:'Informe Facturas de Venta',path:'reports/FVS',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
            {text:'Informe Consumos de Inventario',path:'reports/CIS',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
            {text:'Informe Transacciónes',path:'reports/TRS',icon:<img src='https://cdnmain.sga360.co/static/InformesLogo1_iisxav.webp'/>,action:handleNavigate},
        //{text:'Calendario',path:'calendar',icon:<img src='https://cdnmain.sga360.co/static/LogoCalendario1_ig0avt.webp'/>,action:handleNavigate},
        //{text:'Conceptos e impuestos',path:'concepts',icon:<img src='https://cdnmain.sga360.co/static/LogoConceptosImpuestos_w0klzj.webp'/>,action:handleNavigate},
        {text:'Configuración',path:'settings',icon:<img src='https://cdnmain.sga360.co/static/ChatGPT_Image_27_oct_2025_10_28_59_1_vfix8g.webp'/>,action:handleNavigate},
        {text:'Dispositivos',path:'settings/devices',icon:<img src='https://cdnmain.sga360.co/static/Gemini_Generated_Image_nw3p98nw3p98nw3p_2_bxd2n2.webp'/>,action:handleNavigate},
    ]


    const getAppData = async()=>{
        let data = location.pathname.split('/')
        setLoadingAppData(true);
        let appI = await postInfo('/getCompanyInfo',params.company_key);
        if(appI[0]){
            setAppInfo(appI[1][0]);
            setAppConfig(appI[1][0].config);
            console.log('YYYYYYYYYYYYY: ',appI)
        }else{
            console.log('No se encontro info compa')
            handleRedirect();
        }
        if(!location.pathname.startsWith('/preview/')){
            console.log('No es preview')
            let userI = await postInfo('/getUserInfo',params.user_key);
            console.log(userI);
            if(userI[0] && userI[1][0].user_session == 1){
                setUserInfo(userI[1][0])
                if(userI[1][0].config != undefined){
                    setUserConfig(userI[1][0].config)
                }
            }else{
                handleRedirect();
            }
        }
        setLoadingAppData(false);
    }

    useEffect(()=>{
        if(userConfig.account != undefined){
            setDarkMode(userConfig.styles.theme.default != 'light')
        }
    },[userConfig])

    useEffect(()=>{
        if(appConfig.access != undefined){
            console.log('xxxxx ---> ',appConfig.access.services.e_facturation.use)
        }
    },[appConfig])

    useEffect(()=>{
        if(location.pathname != '/SGA_management/logIn' && location.pathname != '/SGA_management/SignUp' && location.pathname != '/'){
            getAppData();
        }
    },[])

        const value = {
        appInfo,
        appConfig,
        appTaxConfig,
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
