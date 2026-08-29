import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { postInfo } from '../utils/functions';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BankIcon } from '../assets/BankIcon';
import { ThirdPartiesIcon } from '../assets/ThirdPartiesIcon';
import { HomeIcon } from '../assets/HomeIcon';
import { MovementIcon } from '../assets/MovmentIcon';
import { MoneyIcon } from '../assets/MoneyIcon';
import { DebitCardIcon } from '../assets/DebitCardIcon';
import { PaymentsIcon } from '../assets/PaymentsIcon';
import { ConciliationIcon } from '../assets/ConciliationIcon';
import { CartShopIcon } from '../assets/CartShop';
import { MessagesIcon } from '../assets/MessagesIcon';
import { CalendarIcon } from '../assets/CalendarIcon';

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
    const [appConfig,setAppConfig] = useState({});
    const [darkMode,setDarkMode] = useState(false);
    const [userInfo,setUserInfo] = useState({});
    const [userConfig,setUserConfig] = useState({});
    const [loadingAppData,setLoadingAppData] = useState(true);
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();

    const handleRedirect = ()=>{
        navigate('/SGA_treasury/logIn')
    }

    const handleNavigate = (path)=>{
        navigate(`/SGA_treasury/${params.company_key}/${params.user_key}/${path}`)
    }

    const optionsMenu = [
        {text:'Inicio',path:'',icon:<i className="bi bi-house"/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914614/LogoInicio1_nsuzaj.png' />,action:handleNavigate},
        {text:'Crear',path:'new',icon:<i className="ti ti-sparkle-2"/>,action:handleNavigate},
        {text:'Terceros',path:'thirdparties',icon:<i className="fa-regular fa-user"/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        // Default tools
        {text:'Panel Principal',path:'mainPanel',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515340/Grupo5logos_3_qp85tn.png'/>,action:handleNavigate},
        {text:'Bancos',path:'banks',icon:<i className="bi bi-bank"/>,action:handleNavigate},
        {text:'Cartera',path:'briefcases',icon:<i className="bi bi-wallet2"/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        {text:'Cajas POS',path:'CashBoxes',icon:<i className="ti ti-cash-register"/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        {text:'Compras - Gastos',path:'transfers',icon:<i className="bi bi-bag"/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        {text:'Administración Cuentas',path:'transfers',icon:<i className="fa-solid fa-book-bookmark"/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        {text:'Movimientos',path:'movements',icon:<i className="ti ti-arrows-double-sw-ne"/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},


        //{text:'Movimientos',path:'movements',icon:<MovementIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Cajas y Tesoreria',path:'treasury',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/a_-90/a_90/c_fill,w_720,h_720/v1767635300/ChatGPT_Image_5_ene_2026_12_36_27_2_y7x9xi.png'/>,action:handleNavigate},
        //{text:'Bancos',path:'banks',icon:<BankIcon/>,action:handleNavigate},
        //{text:'Transferencias',path:'transfers',icon:<DebitCardIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Pagos',path:'payments',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Cobros',path:'collections',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Historial Caja',path:'/cashBoxes/historial',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Conciliación Bancaria',path:'bankReconciliation',icon:<ConciliationIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Gastos menores',path:'minorExpenses',icon:<CartShopIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //
    ]

    const toolsMenu = [
        {text:'Mensajes',path:'messages',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913446/MensajesLogo2_y4fjoa.png'/>,action:handleNavigate},
        {text:'Calendario',path:'calendar',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913184/LogoCalendario1_ig0avt.png'/>,action:handleNavigate},
        {text:'Informes',path:'reports',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760908279/InformesLogo1_iisxav.png'/>,action:handleNavigate},
        {text:'Estadisticas',path:'analytics',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579216/ChatGPT_Image_27_oct_2025_10_28_59_2_u5cama.png'/>,action:handleNavigate},
    ]

    const secondOptionsMenu = [
        {text:'Configuración',path:'settings',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579057/ChatGPT_Image_27_oct_2025_10_28_59_1_vfix8g.png'/>,action:handleNavigate},
        {text:'Tutoriales',path:'tutorials',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515342/Grupo5logos_4_rhapbp.png'/>,action:handleNavigate},
        {text:'Ayuda',path:'help',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760911291/AyudaLogo1_v362of.png'/>,action:handleNavigate},
        {text:'Cerrar Sesión',path:'logOut',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760911296/CerrarSesionLogo1_moghr7.png'/>,action:handleNavigate},
        //{text:'Registro',path:'../../signUp',icon:<i className="fa-solid fa-user-plus"/>},
    ]

    const routesApp = [
        {text:'Inicio',path:'',icon:<HomeIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760914614/LogoInicio1_nsuzaj.png' />,action:handleNavigate},
        {text:'Crear',path:'new',icon:<i className="fa-solid fa-plus"/>,action:handleNavigate},
        {text:'Terceros',path:'thirdparties',icon:<ThirdPartiesIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
        // New Content

        {text:'Panel Principal',path:'mainPanel',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761515340/Grupo5logos_3_qp85tn.png'/>,action:handleNavigate},
            // CashBoxes
            {text:'Cajas POS',path:'cashBoxes',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1769618368/Gemini_Generated_Image_s5u7cls5u7cls5u7-2_zsw5jo.png'/>,action:handleNavigate},
                // CashBoxes sections
                {text:'Cierres de caja',path:'cashBoxes/:cashbox_id/shifts',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                {text:'Gastos menores',path:'cashBoxes/:cashbox_id/shifts',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                {text:'Saldo disponible',path:'cashBoxes/:cashbox_id/aviableBalance',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                {text:'Saldo contable',path:'cashBoxes/:cashbox_id/aviableBalance',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                {text:'Saldo bancario',path:'cashBoxes/:cashbox_id/aviableBalance',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                {text:'Saldo proyectado',path:'cashBoxes/:cashbox_id/aviableBalance',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
            // Operative Resume
            {text:'Resumen Operativo',path:'operativeResume',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                // mainPanel subRoutes
                {text:'Pagos',path:'operativeResume/payments',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                {text:'Reacudos',path:'operativeResume/aviableBalance',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                {text:'Conciliaciones',path:'operativeResume/aviableBalance',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},

        {text:'Bancos',path:'banks',icon:<BankIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
            // bank Entities
            {text:'Mis bancos',path:'banks/entities',icon:<BankIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1769618368/Gemini_Generated_Image_s5u7cls5u7cls5u7-2_zsw5jo.png'/>,action:handleNavigate},
            
            // banking Accounts
            {text:'Resumen Operativo',path:'banks/accounts',icon:<BankIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},

        {text:'Cartera',path:'briefcases',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
            // bank Entities
            {text:' Acuerdos De Pago',path:'briefcases/paymentAgreds',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1769618368/Gemini_Generated_Image_s5u7cls5u7cls5u7-2_zsw5jo.png'/>,action:handleNavigate},
            
            // banking Accounts
            {text:'Anticipos Y Saldos A Favor',path:'briefcases/advances',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},
                
        {text:'Transferencias',path:'transfers',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761579581/ChatGPT_Image_27_oct_2025_10_28_59_3_juwusq.png'/>,action:handleNavigate},


        //{text:'Movimientos',path:'movements',icon:<MovementIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Cajas y Tesoreria',path:'treasury',icon:<MoneyIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/a_-90/a_90/c_fill,w_720,h_720/v1767635300/ChatGPT_Image_5_ene_2026_12_36_27_2_y7x9xi.png'/>,action:handleNavigate},
        //{text:'Bancos',path:'banks',icon:<BankIcon/>,action:handleNavigate},
        //{text:'Transferencias',path:'transfers',icon:<DebitCardIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Pagos',path:'payments',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Cobros',path:'collections',icon:<PaymentsIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Conciliación Bancaria',path:'bankReconciliation',icon:<ConciliationIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        //{text:'Gastos menores',path:'minorExpenses',icon:<CartShopIcon/>,img:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1761512639/ChatGPT_Image_26_oct_2025_16_03_39_d7hmbb.png'/>,action:handleNavigate},
        
        {text:'Mensajes',path:'messages',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913446/MensajesLogo2_y4fjoa.png'/>,action:handleNavigate},
        {text:'Calendario',path:'calendar',icon:<img src='https://res.cloudinary.com/djjxugmni/image/upload/v1760913184/LogoCalendario1_ig0avt.png'/>,action:handleNavigate},
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
        if(location.pathname != '/SGA_management/logIn' && location.pathname != '/SGA_management/SignUp' && location.pathname != '/'){
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
        toolsMenu,
        secondOptionsMenu,
        routesApp
    }

    return(
        <AppInfo.Provider value={value}>
        {children}
        </AppInfo.Provider>
    )
}
