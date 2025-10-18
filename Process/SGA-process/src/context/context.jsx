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

    const sendPrompt = async(text,attached)=>{
        setLoading(true)
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
    const navigate = useNavigate();

    const handleRedirect = ()=>{
        navigate('/SGA_process/logIn')
    }

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
        if(location.pathname != '/SGA_process/logIn' && location.pathname != '/SGA_process/SignUp'){
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
        getAppData
    }

    return(
        <AppInfo.Provider value={value}>
        {children}
        </AppInfo.Provider>
    )
}