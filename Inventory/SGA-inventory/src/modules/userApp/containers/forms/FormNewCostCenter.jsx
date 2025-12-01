import { useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { FormButton } from "../../components/FormButton";
import './FormNewCostCenter.css'
import { postInfo } from "../../../../utils/functions";

export function FormNewCostCenter(){
    const {addNotification} = useNotifications();
    const {popOutAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false)
    // Cost Center Info
    const [name,setName] = useState('');
    const [code,setCode] = useState('');
    const [description,setDescription] = useState('')
    const [parent_id,setParent_id] = useState(0);

    let formInfo = {
        disabled,
        name,
        code,
        description,
        parent_id,
        company_id:appInfo.company_id
    }

    async function createCostCenter(){
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createCostCenter',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Centro de costo ${formInfo.name} creado`,
                description:`El centro de costo ${formInfo.name} fue creado correctamente.`
            })
        }else{
            addNotification({
                type:'error',
                title:`Error al crear centro de costo`,
                description:`Hubo un problema al crear el centro de costo ${formInfo.name}, intentalo de nuevo`
            })
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
    }

    return(
        <div className="FormNewCostCenter">
            <BoldTitle text={'Nuevo centro de costo'} />
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                createCostCenter();
            }}>
                <FormInput title={'Nombre'} action={setName} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <FormInput title={'Código'} action={setCode} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <FormInput title={'Descripción'} action={setDescription} textArea={true} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <FormButton text={'Crear centro de costo'} loading={loading}/>
            </form>
        </div>
    )
}