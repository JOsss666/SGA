import {BoldTitle} from '../../componets/BoldTitle'
import {FormInput} from '../../componets/FormInput'
import {FormButton} from '../../componets/FormButton'
import { useAppinfo } from '../../../../context/context'
import { useAlert } from '../../../../context/context'
import {postInfo} from  '../../../../utils/functions'
import './CreateStore.css'
import { useState } from 'react'

export function CreateStore({reloadFun}){
    const {setOpenAlert} = useAlert();
    const {appInfo} = useAppinfo();
    const [disabled,setDisabled] = useState(false);
    const [store_name,setStoreName] = useState("");
    const [store_zone,setStoreZone] = useState("");
    const [store_city,setStoreCity] = useState("");
    const [store_location,setStoreLocation] = useState("");
    const [loading,setLoading] = useState(false);

    const formInfo = {
        company_id:appInfo.company_id,
        store_name,
        store_zone,
        store_city,
        store_location
    }

    const createStore = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createStore',formInfo);
        setLoading(false)
        setDisabled(false);
        if(reloadFun != undefined){
            reloadFun()
        }
        setOpenAlert(false);
    }

    return(
        <div className="CreateStore">
            <BoldTitle text={"Nueva Tienda"}/>
            <form action="">
                <FormInput disabled={disabled} action={setStoreName} placeholder={"Nombre de la tienda"} title={"Nombre"}/>
                <FormInput disabled={disabled} action={setStoreZone} placeholder={"Regíon o Zona"} title={"Sector o Región"}/>
                <FormInput disabled={disabled} action={setStoreCity} placeholder={"Ciudad de tu tienda"} title={"Ciudad"}/>
                <FormInput disabled={disabled} action={setStoreLocation} placeholder={"Cll #123 A"} title={"Dirección"}/>
                <FormButton loading={loading} disabled={disabled} text={"Crear nueva tienda"} onClick={(e)=>{
                    e.preventDefault();
                    createStore();
                }}/>
            </form>
        </div>
    )
}