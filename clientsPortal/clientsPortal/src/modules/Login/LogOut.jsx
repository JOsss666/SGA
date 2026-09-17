import { useEffect } from "react";
import { useAppInfo } from "../../context/context";
import { postInfo } from "../../utils/functions";
import { LoadingAppDataPage } from "../userApp/containers/LoadingAppDataPage";
import { LoadingSpace } from "../userApp/containers/LoadingSpace";
import { useNavigate } from 'react-router-dom'


export function LogOut(){

    const {userInfo} = useAppInfo();
    const navigate = useNavigate();

    const handleRedirect = ()=>{
        navigate('/SGA_management/logIn')
    }

    const logOut = async()=>{
        try{
            let res = await postInfo('/externalAccess/logOut',{user_key:userInfo.user_key})
            if(res?.status === 'OK'){
                handleRedirect();
                return;
            }
            alert('Error al cerrar sesion')
        }catch{
            alert('Error al cerrar sesion')
        }
    }

    useEffect(()=>{
        logOut();
    },[])

    return(
        <LoadingSpace title={'Cerrando sesión'} description={'Espera un momento ...'}/>
    )
}
