import { createContext, useContext, useEffect, useState } from 'react';
import { postInfo } from '../utils/functions';

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

    const [usedTokens,setUsedTokens] = useState(0);
    const [chat,setChat] = useState([]);

    const addMessage = (newMessage) => {
        setChat(prev => [...prev, newMessage]);
    };

    const value = {
        chat,
        usedTokens,
        addMessage,
        setChat,
        setUsedTokens
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

    const getAppData = async()=>{
        setLoadingAppData(true);
        let appI = await postInfo('/getCompanyInfo',1);
        if(appI[0]){
            console.log(appI)
            setAppInfo(appI[1][0]);
        }
        let userI = await postInfo('/getUserInfo',1);
        if(userI[0]){
            setUserInfo(userI[1][0])
        }
        setLoadingAppData(false);
    }

    useEffect(()=>{
        getAppData();
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