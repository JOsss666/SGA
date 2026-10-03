import './TaxInfo.css'
import { useAppInfo, useNotifications } from "../../../../context/context";
import { useEffect, useState } from "react";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { getTextFromValue, postInfo } from "../../../../utils/functions";
import { useParams } from "react-router-dom";
import { LoadingSpace } from "../LoadingSpace";
import { ThirdPartyFactusIdentificationTypeCodes, ThirdPartyIvaResponsabilityCodes, ThirdPartyNatureCodes } from "../../../../utils/Constants";

// Mapas de presentación: mismos valores que usa FormNewThirdParties (stage Tributaria).
const regimeOptions = [
    {text:'Ordinario', value:'ORDINARIO'},
    {text:'Simple de tributación', value:'SIMPLE'},
    {text:'Especial', value:'ESPECIAL'},
    {text:'No contribuyente', value:'NO_CONTRIBUYENTE'}
];

const retentionTypeOptions = [
    {text:'No es agente de retención', value:'NO_AGENTE'},
    {text:'Agente de retención', value:'AGENTE_RETENCION'},
    {text:'Autorretenedor', value:'AUTORRETENEDOR'}
];

const textFromOptions = (value,options)=> options.find(element => element.value === value)?.text ?? '';

export function TaxInfo({info,reloadFun}){

    // Requierements
    const {appInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();
    const params = useParams();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const can_edit = userConfig?.access?.sections?.thirdparties?.can_edit

    //Form info (mismos campos que la sección Tributaria del FormNewThirdParties)
    const [typePerson,setTypePerson] = useState(info?.thirdParty_nature ?? '');
    const [IVA_responsability,setIVA_responsability] = useState(info?.IVA_responsability ?? '');
    const [identidicationType_id,setIdentidicationType_id] = useState(info?.identidicationType_id ?? '');
    const [regime,setRegime] = useState(info?.regime ?? '');
    const [retention_type,setRetention_type] = useState(info?.retention_type ?? 'NO_AGENTE');
    const [economic_activity,setEconomic_activity] = useState(info?.economic_activity ?? '');

    const formInfo = {
        company_id:info?.company_id ?? appInfo.company_id,
        thirdParty_id:params.thirdparty_id,
        nature:typePerson,
        IVA_responsability,
        identidicationType_id,
        regime,
        retention_type,
        economic_activity,
        // El RUT se administra en la sección "Documentos Adjuntos"; lo conservamos para
        // no borrarlo al guardar la información tributaria.
        attachedRut:info?.attachedRut ?? ''
    }

    const updateTaxInfo = async()=>{
        setDisabled(true)
        setLoading(true)
        try{
            let res = await postInfo('/updateThirdPartyTaxInfo',formInfo);
            if(res?.[0]){
                addNotification({
                    type:'aproved',
                    title:'Información actualizada correctamente',
                    description:'Información tributaria actualizada correctamente.'
                })
                reloadFun?.();
            }else{
                addNotification({
                    type:'error',
                    title:'No fue posible actualizar',
                    description:'Hubo un problema al actualizar la información tributaria, inténtalo de nuevo.'
                })
            }
        }catch(error){
            addNotification({
                type:'error',
                title:'No fue posible actualizar',
                description:error?.message ?? 'Error al actualizar la información tributaria.'
            })
        }
        setLoading(false);
        setDisabled(false);
    }

    // Events listeners
    useEffect(()=>{
        console.log(info);
    },[])

    return(
        <div className="TaxInfo">
            {!loading && (
                <div className="paramsContainer">
                    <form onSubmit={(e)=>{
                        e.preventDefault();
                        updateTaxInfo();
                    }}>
                        <SearchinList defaultValue={{text:getTextFromValue(info?.thirdParty_nature,ThirdPartyNatureCodes), value:info?.thirdParty_nature}} placeHolder={'Seleccione una opción'} action={setTypePerson} title={'Naturaleza'} disabled={disabled} list={ThirdPartyNatureCodes}/>
                        <SearchinList defaultValue={{text:getTextFromValue(info?.IVA_responsability,ThirdPartyIvaResponsabilityCodes), value:info?.IVA_responsability}} placeHolder={'Seleccione una opción'} action={setIVA_responsability} title={'Responsabilidad de IVA'} disabled={disabled} list={ThirdPartyIvaResponsabilityCodes}/>
                        <SearchinList defaultValue={{text:getTextFromValue(info?.identidicationType_id,ThirdPartyFactusIdentificationTypeCodes), value:info?.identidicationType_id}} action={setIdentidicationType_id} title={'Tipo Identificación Facturación'} placeHolder={'Tipo de identificación'} disabled={disabled} list={ThirdPartyFactusIdentificationTypeCodes}/>
                        <SearchinList defaultValue={{text:textFromOptions(info?.regime,regimeOptions), value:info?.regime}} action={setRegime} title={'Régimen del tercero'} placeHolder={'Seleccione régimen'} disabled={disabled} list={regimeOptions}/>
                        <SearchinList defaultValue={{text:textFromOptions(info?.retention_type ?? 'NO_AGENTE',retentionTypeOptions), value:info?.retention_type ?? 'NO_AGENTE'}} action={setRetention_type} title={'Tipo de Retención'} placeHolder={'Seleccione condición de retención'} disabled={disabled} list={retentionTypeOptions}/>
                        <FormInput title={'Actividad Economica'} action={setEconomic_activity} disabled={disabled} value={economic_activity} placeholder={'Código o descripción de actividad económica'} required={false}/>
                        {can_edit &&(
                            <div className="optionsRow">
                                <FormButton negative={true} text={'Cancelar'} disabled={disabled}/>
                                <FormButton text={'Guardar Cambios'} disabled={disabled}/>
                            </div>
                        )}
                    </form>
                </div>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'}/>
            )}
        </div>
    )
}
