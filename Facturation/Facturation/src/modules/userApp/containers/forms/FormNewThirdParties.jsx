
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
import { FileInput } from '../../components/FileInput';


export function FormNewThirdParties({reloadFun,quickCreation}){

    const {addNotification} = useNotifications();
    const {popOutAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const [stage,setStage] = useState(0);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [autoTaxInfo,setAutoTaxInfo] = useState(false);

    // info básica
    const [name,setName] = useState('');
    const [userPhoto,setUserPhoto] = useState('https://i.pinimg.com/1200x/ba/8d/7a/ba8d7a6364bf8ce99756686cba83c695.jpg');
    const [lastNames,setLastName] = useState('');
    const [indentification_type,setindentification_type] = useState('');
    const [indentification_number,setindentification_number] = useState('');
    const [mail,setMail] = useState('');
    const [phone,setPhone] = useState('');
    const [country,setCountry] = useState('');
    const [city,setCity] = useState('');
    const [address,setAddress] = useState('');
    const [type,setType] = useState('');
    // info comercial
    const [credit,setCredit] = useState(false);
    const [credit_term,setCredit_term] = useState(0);
    const [credit_value,setCredit_value] = useState(0);
    const [interest_rate,setInterest_rate] = useState(0);
    const [comercial_state,setComercial_state] = useState('active');
    // info tributaria
    const [attachedRut,setAttachedRut] = useState();
    const [regime,seRregime] = useState('-');
    const [IVA_responsability,setIVA_responsability] = useState('-');
    const [retention_type,setRetention_type] = useState('-');
    const [economic_activity,setEconomic_activity] = useState('-');

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        userPhoto,
        lastNames,
        indentification_type,
        indentification_number,
        mail,
        phone,
        country,
        city,
        address,
        type,
        credit,
        credit_term,
        credit_value,
        interest_rate,
        comercial_state,
        regime,
        IVA_responsability,
        retention_type,
        economic_activity,
        attachedRut
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
            <BoldTitle text={'Nuevo Tercero'}/>  

            <div className="stageProcess">
                <div className="progresBar">
                    <div className="Progress" style={{width:`${(stage/4)*100}%`}}/>
                </div>
            </div>

            {stage === 0 &&(
                <form action="">
                    <BoldTitle text={'Información Personal'}/>
                    <div className="userPhoto">
                        <div className="actualPhoto">
                            <img src={userPhoto} alt="" />
                        </div>
                        <FileInput placeholder={'Seleccionar nueva foto'} action={setUserPhoto}>
                            <i className="fa-solid fa-camera"/>
                        </FileInput>
                    </div>
                    <FormInput action={setName} title={'Nombre o razón social'} placeholder={'Nombre del proveedor'} disabled={disabled} value={name}/>
                    <FormInput action={setLastName} title={'Apellido o complemento'} placeholder={'Apellido del proveedor'} disabled={disabled} value={lastNames}/>
                    <SearchinList action={setindentification_type} title={'Tipo de Identificación'} placeHolder={'Tipo de identificación'} list={[
                        {text:'NIT',value:'NIT'},
                        {text:'Cédula de Ciudadanía',value:'CC'},
                        {text:'Cédula de Extranjería',value:'CE'},
                        {text:'Pasaporte',value:'PAS'}
                    ]}/>
                    <FormInput action={setindentification_number} title={'Número de Identificación'} placeholder={'Número de identificación'} disabled={disabled}/>
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
                    <BoldTitle text={'Información Comercial'}/>
                    <SearchinList action={setType} title={'Relación con el tercero'} placeHolder={'Tipo de Proveedor'} list={[
                        {text:'Cliente',value:'client'},
                        {text:'Proveedor',value:'supplier'},
                        {text:'Empleado',value:'employee'},
                        {text:'Contratista',value:'contractor'},
                        {text:'Socio',value:'partner'},
                        {text:'Otro',value:'other'}
                    ]}/>
                    {!quickCreation && (
                        <div className="accessSwitch">
                            <h6>Pago a credito</h6>
                            <SwitchOption action={setCredit}/>
                        </div>
                    )}
                    {!quickCreation && credit && (
                        <>
                            <FormInput type={'number'} title={'Plazo de credito en días'} min={0} disabled={disabled} value={credit_term} action={setCredit_term}/>
                            <FormInput type={'number'} title={'Valor maximo de credito'} min={0} disabled={disabled} value={credit_value} action={setCredit_value}/>
                            <FormInput type={'number'} title={'Tasa de interes diario por mora'} min={0} disabled={disabled} value={interest_rate} action={setInterest_rate}/>
                        </>
                    )}
                    <SearchinList action={setComercial_state} value={'Activo'} title={'Estado comercial'} placeHolder={'Estado comercial del tercero'} list={[
                        {text:'Activo',value:'active'},
                        {text:'Desactivado',value:'disabled'},
                        {text:'Bloqueado',value:'blocked'},
                        {text:'Reportado',value:'reported'}
                    ]}/>
                </form>
            )}
            {!quickCreation && stage === 3 && (
                <form action="">
                    <BoldTitle text={'Información tributaria'}/>
                    <div className="setAutomaticTaxIndo" onClick={()=>{
                        setAutoTaxInfo(!autoTaxInfo);
                    }}>
                        <strong className={!autoTaxInfo?'activeTaxInfoOption':''}>Manual</strong>
                        <strong className={autoTaxInfo?'activeTaxInfoOption':''}>Automatico</strong>
                        <div className="modeTaxInfoIndicator" style={{left:`${autoTaxInfo? '50':'0'}%`}}/>
                    </div>
                    {!autoTaxInfo && (
                        <>
                            <FormInput title={'Regimen del tercero'} action={seRregime} disabled={disabled} value={regime}/>
                            <FormInput title={'Responsabilidad de IVA'} action={setIVA_responsability} disabled={disabled} value={IVA_responsability}/>
                            <FormInput title={'Tipo de Retención'} action={setRetention_type} disabled={disabled} value={retention_type}/>
                            <FormInput title={'Actividad Economica'} action={setEconomic_activity} disabled={disabled} value={economic_activity}/>
                        </>
                    )}
                    {autoTaxInfo && (
                        <>
                            <span>Esta opción no esta disponible por el momento</span>
                        </>
                    )}
                </form>
            )}
            <FormButton disabled={disabled} loading={loading} text={stage== (quickCreation? 3:4)? 'Registrar Proveedor':'Siguiente'} onClick={()=>{
                if(stage < (quickCreation? 3:4)){
                    setStage(stage +1)
                }else{
                    console.log(formInfo)
                    createThirdParty();
                }
            }}/>
            {stage > 0 && (
                <FormButton disabled={disabled} loading={loading} negative={true} text={stage== (quickCreation? 3:4)? 'Cancelar':'Volver'} onClick={()=>{
                    if(stage < (quickCreation? 3:4)){
                        setStage(stage -1)
                    }else{
                        setStage(0)
                    }
                }}/>
            )}
        </div>
    )
}       
