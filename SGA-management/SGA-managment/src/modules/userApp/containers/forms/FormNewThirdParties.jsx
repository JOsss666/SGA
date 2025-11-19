
import './FormNewThirdParties.css';
import { useState } from 'react';
import { BoldTitle } from '../../components/BoldTitle';
import { FormButton } from '../../components/FormButton';
import { FormInput } from '../../components/FormInput';
import { postInfo } from '../../../../utils/functions';
import { useAlert, useAppInfo, useNotifications } from '../../../../context/context';  
import { SelectOptions } from '../../components/SelectOptions';
import { SearchinList } from '../../components/SearchInList';
import { SwitchOption } from '../../components/SwitchOption';
import { NewElementSelect } from '../../components/NewElementSelect';


export function FormNewThirdParties({reloadFun}){

    const {addNotification} = useNotifications();
    const {popOutAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const [stage,setStage] = useState(0);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // Datos formulario
    const [name,setName] = useState('');
    const [lastName,setLastName] = useState('');
    const [identificationType,setIdentificationType] = useState('');
    const [identificationNumber,setIdentificationNumber] = useState('');
    const [mail,setMail] = useState('');
    const [phone,setPhone] = useState('');
    const [country,setCountry] = useState('');
    const [city,setCity] = useState('');
    const [address,setAddress] = useState('');
    const [type,setType] = useState('');

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        lastName,
        identificationType,
        identificationNumber,
        mail,
        phone,
        country,
        city,
        address,
        type
    }


    const createThirdParty = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/createThirdParty',formInfo);
        if(res){
            addNotification({
                type:'aproved',
                title:`Proveedor ${name} creado correctamente`,
                description:`El proveedor ${name} fue creado correctamente.`
            })
            popOutAlert();
            if(reloadFun != undefined){
                reloadFun();
            }
        }
        else{
            addNotification({
                type:'error',
                title:`Error al crear proveedor "${name}"`,
                description:`Hubo un problema al crear el proveedor "${name}", intentelo de nuevo.`
            })
        }
        setLoading(false);
        setDisabled(false);
    }



/** PENDIENTE REVISAR **/
    return(
        <div className="FormNewThirdParties">
            <BoldTitle text={'Nuevo Proveedor'}/>  

            <div className="stageProcess">
                <div className="progresBar">
                    <div className="Progress" style={{width:`${(stage/3)*100}%`}}/>
                </div>
            </div>

            {stage === 0 &&(
                <form action="">
                    <BoldTitle text={'Información Personal'}/>
                    <FormInput action={setName} title={'Nombre'} placeholder={'Nombre del proveedor'} disabled={disabled}/>
                    <FormInput action={setLastName} title={'Apellido'} placeholder={'Apellido del proveedor'} disabled={disabled}/>
                    <SearchinList action={setIdentificationType} title={'Tipo de Identificación'} placeHolder={'Tipo de identificación'} list={[
                        {text:'NIT'},
                        {text:'Cédula de Ciudadanía'},
                        {text:'Cédula de Extranjería'},
                        {text:'Pasaporte'}
                    ]}/>
                    <FormInput action={setIdentificationNumber} title={'Número de Identificación'} placeholder={'Número de identificación'} disabled={disabled}/>
                </form>
            )}
            {stage === 1 &&(
                <form action="">
                    <BoldTitle text={'Información de contacto'}/>
                    <FormInput action={setMail} title={'Correo Electrónico'} placeholder={'Correo electrónico del proveedor'} disabled={disabled}/>
                    <FormInput action={setPhone} title={'Teléfono'} placeholder={'Número de teléfono'} disabled={disabled}/>
                    <FormInput action={setCountry} title={'País'} placeholder={'País'} disabled={disabled}/>
                    <FormInput action={setCity} title={'Ciudad'} placeholder={'Ciudad'} disabled={disabled}/>
                    <FormInput action={setAddress} title={'Dirección'} placeholder={'Dirección del proveedor'} disabled={disabled}/>
                </form>
            )}
            {stage === 2 &&(
                <form action="">
                    <BoldTitle text={'Clasificación del Proveedor'}/>
                    <SearchinList action={setType} title={'Tipo de Proveedor'} placeHolder={'Tipo de Proveedor'} list={[
                        {text:'Local'},
                        {text:'Internacional'},
                        {text:'Distribuidor'},
                        {text:'Mayorista'}
                    ]}/>
                </form>
            )}
            <FormButton disabled={disabled} loading={loading} text={stage== 3? 'Registrar Proveedor':'Siguiente'} onClick={()=>{
                if(stage < 3){
                    setStage(stage +1)
                }else{
                    /*createThirdParty();*/
                }
            }}/>
            {stage > 0 && (
                <FormButton disabled={disabled} loading={loading} negative={true} text={stage== 3? 'Cancelar':'Volver'} onClick={()=>{
                    if(stage < 3){
                        setStage(stage -1)
                    }else{
                        setStage(0)
                    }
                }}/>
            )}
        </div>
    )
}       
