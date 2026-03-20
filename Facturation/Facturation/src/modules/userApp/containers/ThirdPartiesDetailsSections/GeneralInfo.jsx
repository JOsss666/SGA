import { useState } from "react";
import { FormInput } from "../../components/FormInput";
import { SelectOptions } from "../../components/SelectOptions";
import { FormButton } from "../../components/FormButton";
import './GeneralInfo.css'
import { BoldTitle } from "../../components/BoldTitle";
import { LabelValue } from "../../components/LabelValue";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";

export function GeneralInfo({info,reloadFun}){

    // requirements
    const {userConfig} = useAppInfo();
    // Control
    const can_edit = userConfig?.access?.sections?.thirdparties?.can_edit
    const [disabled,setDisabled] = useState(can_edit? !can_edit:true);

    // ParamsForm
    const [names,setNames] = useState(info.names != undefined? info.names:'');
    const [lastNames,setLastNames] = useState(info.lastNames != undefined? info.lastNames:'');
    const [indentification_type,setIndentification_type] = useState(info.indentification_type != undefined? info.indentification_type:'');
    const [indentification_number,setIndentification_number] = useState(info.indentification_number != undefined? info.indentification_number:'');
    const [mail,setmail] = useState(info.mail != undefined? info.mail:'');
    const [phone,setPhone] = useState(info.phone != undefined? info.phone:'');
    const [country,setCountry] = useState(info.country != undefined? info.country:'');
    const [city,setCity] = useState(info.city != undefined? info.city:'');
    const [address,setAddress] = useState(info.address != undefined ? info.address:'');
    const [type,setType] = useState(info.type != undefined? info.type:'');

    const formInfo = {
        company_id:info.company_id,
        id:info.id,
        names,
        lastNames,
        indentification_type,
        indentification_number,
        mail,
        phone,
        country,
        city,
        address,
        type
    }

    const updateInfo = async()=>{
        setDisabled(true);
        console.log(formInfo)
        let res = await postInfo('/updateThirdPartyGeneralInfo',formInfo);
        if(res[0]){
            console.log('Actualizacion Exitosa');
            reloadFun?.();
        }
        setDisabled(false);
    }

    return(
        <div className="GeneralInfo">
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                updateInfo();
            }}>
                <FormInput action={setNames} value={names} title={'Nombre(s) o Razon Social'} placeholder={'Nombres del tercero'} disabled={disabled}/>
                <FormInput action={setLastNames} required={false} value={lastNames} title={'Apellidos o Extensiones'} placeholder={'Apellidos o complementos'} disabled={disabled}/>
                <div className="SelOp">
                    <h6>Relación comercial</h6>
                    <SelectOptions disabled={disabled} defaultValue={type} action={setType} options={['client','supplier','employee','contractor','partner','other']} value={type}/>
                </div>
                <div className="SelOp">
                    <h6>Tipo de documento</h6>
                    <SelectOptions disabled={disabled} defaultValue={indentification_type} action={setIndentification_type} options={['CC','NIT','CE','PAS']} value={indentification_type}/>
                </div>
                <FormInput action={setIndentification_number} title={'Número de documento'} placeholder={'132...'} disabled={disabled} type={'number'} value={indentification_number}/>
                <FormInput action={setmail} title={'Correo electronico'} placeholder={'...@gmail.com'} disabled={disabled} type={'mail'} value={mail}/>
                <FormInput action={setPhone} title={'Número telefonico'} placeholder={'numero telefonico'} disabled={disabled} value={phone}/>
                <FormInput action={setCountry} title={'País'} placeholder={'Pais de origen o de registro'} disabled={disabled} value={country}/>
                <FormInput action={setCity} title={'Ciudad'} placeholder={'Ciudad o departamento'} disabled={disabled} value={city}/>
                <FormInput action={setAddress} title={'Dirección'} placeholder={'Cll - Cra... '} disabled={disabled} required={false} value={address}/>
                {formInfo != info && can_edit &&(
                    <FormButton text={'Guardar Cambios'} disabled={disabled} />
                )}
            </form>
            <div className="aditionalInfo">
                <BoldTitle text={'Información adicional'}/>
                <div className="aditionalDataGrid">
                    <LabelValue title={'Fecha Creación'} value={info.created_at != undefined? (info.created_at).substring(0,10):'---'}/>
                    <LabelValue title={'Ultima Modificación'} value={info.updated_at != undefined? (info.updated_at).substring(0,10):'---'}/>
                </div>
            </div>
        </div>
    )
}