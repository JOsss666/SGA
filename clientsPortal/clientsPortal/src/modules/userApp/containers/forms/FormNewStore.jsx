import { useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { FormButton } from "../../components/FormButton";
import './FormNewStore.css'


export function FormNewStore(){
    // Required Info
    const {popOutAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    //  Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    // New Bussines Unit Info
    const [name,setName] = useState('');
    const [zone,setZone] = useState('');
    const [city,setCity] = useState('');
    const [address,setAddress] = useState('');

    let formInfo = {
        company_id:appInfo.company_id,
        name,
        zone,
        city,
        address
    }

    const CreateBussinesUnit = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createStore',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Unidad de negócio creada.`,
                description:`La unidad de negoció ${name} ha sido creada exitosamente.`
            })
        }else{
            addNotification({
                type:'aproved',
                title:`Unidad de negócio creada.`,
                description:`La unidad de negoció ${name} ha sido creada exitosamente.`
            })
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
    }

    return(
        <div className="FormNewStore">
            <BoldTitle text={'Nueva unidad de negócio'}/>
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                CreateBussinesUnit();
            }}>
                <FormInput title={'Nombre'} action={setName} placeholder={'Nombra tu unidad de negocio'} disabled={disabled}/>
                <FormInput title={'Zona'} action={setZone} placeholder={'Zona a la que pertenece (Opcional)'} disabled={disabled}/>
                <FormInput title={'Ciudad'} action={setCity} placeholder={'a que ciudad pertenece'} disabled={disabled}/>
                <FormInput title={'Ubicación'} action={setAddress} placeholder={'Cll ... #..'} disabled={disabled}/>
                <FormButton text={loading? 'Creando':'Crear unidad de negócio'} disabled={disabled} loading={loading}/>
            </form>
        </div>
    )
}