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
        navigate('/SGA_process/logIn')
    }

    const logOut = async()=>{
        let res = await postInfo('/logOut',{user_id:userInfo.user_id})
        if(res){
            handleRedirect();
        }else{
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