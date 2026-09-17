import { useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { FileInput } from "../../components/FileInput";
import { FormButton } from "../../components/FormButton";
import './FormNewBussines.css'
import { postInfo } from "../../../../utils/functions";

export function FormNewBussines({info,edit,reloadFun}){

    // Requirements
    const {appInfo} = useAppInfo();
    const {popOutAlert} = useAlert();
    const {addNotification} = useNotifications();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);

    // FormInfo
    const [name,setName] = useState('');
    const [description,setDescription] = useState('');
    const [photo,setPhoto] = useState('https://cdnmain.sga360.co/static/ChatGPT_Image_16_dic_2025_11_41_43_zhakuf.webp');

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        description,
        photo
    }
    const createBussines = async()=>{
        setDisabled(true)
        setLoading(false)
        let res = await postInfo('/createBussines',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Negócio ${name} creado`,
                description:`El negocio ${name} se ha creado correctamente.`
            })
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al crear negócio ${name}`,
                description:`Hubo un error al crear el negócio ${name}, intentelo de nuevo.`
            })
        }
        setLoading(false)
        setDisabled(false)
        popOutAlert();
    }

    return(
        <div className="FormNewBussines">
            <BoldTitle text={'Nueva Línea de negocio'}/>
            <form disabled={disabled} onSubmit={(e)=>{
                e.preventDefault();
                createBussines();
            }}>
                <div className="userPhoto">
                    <div className="actualPhoto">
                        <img src={photo} alt="" />
                    </div>
                    <FileInput category="assets" placeholder={'Seleccionar nueva foto'} action={setPhoto}>
                        <i className="fa-solid fa-camera"/>
                    </FileInput>
                </div>
                <FormInput title={'Nombre'} action={setName} placeholder={'Como se va a llamar tu negócio'} disabled={disabled}/>
                <FormInput title={'Descripción'} action={setDescription} placeholder={'Que describe mejor tu negócio'} disabled={disabled} textArea={true}/>
                <FormButton text={loading? 'Creando...':'Crear negócio'} disabled={disabled} loading={loading}/>
            </form>
        </div>
    )
}