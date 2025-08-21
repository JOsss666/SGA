import { createContext, useContext, useEffect, useState } from 'react';

const AlertContext = createContext();
const AppInfo = createContext();

export function useAppinfo(){
  return useContext(AppInfo)
}

export function useAlert() {
  return useContext(AlertContext);
}


export function AppInfoProvider({children}){
  const [appInfo,setAppInfo] = useState({});
  const [userInfo,setUserInfo] = useState({});

  const value = {
    appInfo,
    setAppInfo,
    userInfo,
    setUserInfo
  }

  return(
    <AppInfo.Provider value={value}>
      {children}
    </AppInfo.Provider>
  )
}

export function AlertProvider({ children }) {
  const [openAlert, setOpenAlert] = useState(false);
  const [tailAlerts, setTailAlerts] = useState([]);
  
  const popInAlert = (child) => {
    setTailAlerts(prev => [...prev, child]);
  }

  const popOutAlert = (index) => {
    if(tailAlerts.length >1){
      setTailAlerts(prev => prev.filter((_, i) => i !== index));
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
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}
