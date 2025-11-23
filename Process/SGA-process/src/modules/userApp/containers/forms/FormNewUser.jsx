import './FormNewUser.css'
import {BoldTitle} from '../../components/BoldTitle'
import { FileInput } from '../../components/FileInput'
import { useState } from 'react'
import { FormInput } from '../../components/FormInput';
import { FormButton } from '../../components/FormButton';
import { postInfo } from '../../../../utils/functions';
import { useAlert, useAppInfo, useNotifications } from '../../../../context/context';
import { SelectOptions } from '../../components/SelectOptions';
import { SearchinList } from '../../components/SearchInList';
import { SwitchOption } from '../../components/SwitchOption';
import { NewElementSelect } from '../../components/NewElementSelect';

export function FormNewUser({info,reloadFun}){
    const {addNotification} = useNotifications();
    const {popOutAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const [stage,setStage] = useState(0);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    
    // Datos formulario
    const [userPhoto,setUserPhoto] = useState('https://i.pinimg.com/1200x/ba/8d/7a/ba8d7a6364bf8ce99756686cba83c695.jpg');
    const [name,setName] = useState('');
    const [mail,setMail] = useState('');
    const [pass,setPass] = useState('');
    const [userRol,setUserRol] = useState('');
    const [accessInventory,setAccessInventory] = useState(false)
    const [accessContability,setAccessContability] = useState(false)
    const [accessProcess,setAccessProcess] = useState(false)
    const [accessFacturation,setAccessFacturation] = useState(false)
    const [accessTreasury,setAccessTreasuty] = useState(false)
    const [accessCerticloud,setAccessCerticloud] = useState(false)
    const [accessCtools,setAccessCtools] = useState(false)

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        pass,
        mail,
        userRol,
        accessInventory,
        accessContability,
        accessProcess,
        accessFacturation,
        accessTreasury,
        accessCerticloud,
        accessCtools
    }

    const createUser = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/signUp',formInfo);
        if(res){
            addNotification({
                type:'aproved',
                title:`Usuario ${name} creado correctamente`,
                description:`El usuario ${name} fue creado correctamente.`
            })
            popOutAlert();
            if(reloadFun != undefined){
                reloadFun();
            }
        }
        else{
            addNotification({
                type:'error',
                title:`Error al crear usuario "${name}"`,
                description:`Hubo un problema al crear el usuario "${name}", intentelo de nuevo.`
            })
        }
        setLoading(false)
        setDisabled(false);
    }

    return(
        <div className="FormNewUser">
            <BoldTitle text={'Nuevo Usuario'}/>
            <div className="stageProcess">
                <div className="progresBar">
                    <div className="Progress" style={{width:`${(stage/3)*100}%`}}/>
                </div>
            </div>
            {stage == 0 && (
                <form action="">
                    <div className="userPhoto">
                        <div className="actualPhoto">
                            <img src={userPhoto} alt="" />
                        </div>
                        <FileInput placeholder={'Seleccionar nueva foto'}>
                            <i className="fa-solid fa-camera"/>
                        </FileInput>
                    </div>
                    <FormInput action={setName} title={'Nombre'} placeholder={'Nombre del usuario'} disabled={disabled}/>
                    <FormInput action={setMail} title={'Correo'} type={'email'} placeholder={'....@gmail.com'} disabled={disabled}/>
                    <FormInput action={setPass} title={'Contraseña'} type={'text'} placeholder={'*****'} disabled={disabled}/>
                </form>
            )}
            {stage == 1 && (
                <form action="">
                    <SearchinList action={setUserRol} title={'Cargo del usuario'} placeHolder={'Seleccionar Cargo'} list={[
                        {text:'Operador'},
                        {text:'Administrador'},
                        {text:'Personalizado 1'}
                    ]} specialOption={<NewElementSelect title={'Crear nuevo roll'}/>}/>
                    <div className="accessSwitch">
                        <h6>Acceso a inventarios</h6>
                        <SwitchOption action={setAccessInventory}/>
                    </div>
                    <div className="accessSwitch">
                        <h6>Acceso a procesos</h6>
                        <SwitchOption action={setAccessProcess}/>
                    </div>
                    <div className="accessSwitch">
                        <h6>Acceso a contabilidad</h6>
                        <SwitchOption action={setAccessContability}/>
                    </div>
                    <div className="accessSwitch">
                        <h6>Acceso a Facturación</h6>
                        <SwitchOption action={setAccessFacturation}/>
                    </div>
                    <div className="accessSwitch">
                        <h6>Acceso a Tesoreria</h6>
                        <SwitchOption action={setAccessTreasuty}/>
                    </div>
                    <div className="accessSwitch">
                        <h6>Acceso a CertiCloud</h6>
                        <SwitchOption action={setAccessCerticloud}/>
                    </div>
                    <div className="accessSwitch">
                        <h6>Acceso a Ctools</h6>
                        <SwitchOption action={setAccessCtools}/>
                    </div>
                </form>
            )}
            <FormButton disabled={disabled} loading={loading} text={stage== 2? 'Registrar usuario':'Siguiente'} onClick={()=>{
                if(stage < 2){
                    setStage(stage +1)
                }else{
                    createUser();
                }
            }}/>
            {stage > 0 && (
                <FormButton disabled={disabled} loading={loading} negative={true} text={stage== 2? 'Cancelar':'Volver'} onClick={()=>{
                    if(stage < 2){
                        setStage(stage -1)
                    }else{
                        setStage(0)
                    }
                }}/>
            )}
        </div>
    )
}