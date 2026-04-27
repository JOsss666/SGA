import { InputFiles } from "../../components/InputFiles";
import { SelectOptions } from "../../components/SelectOptions";
import { LabelValue } from "../../components/LabelValue";
import './TaxInfo.css'
import { FileInput } from "../../components/FileInput";
import { useAppInfo, useNotifications } from "../../../../context/context";
import { useEffect, useState } from "react";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { postInfo } from "../../../../utils/functions";
import { useParams } from "react-router-dom";
import { LoadingSpace } from "../LoadingSpace";

export function TaxInfo({info}){

    // Requierements
    const {appInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();
    const params = useParams();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const can_edit = userConfig?.access?.sections?.thirdparties?.can_edit

    //Form info
    const [regime,setRegime] = useState('');
    const [typePerson,setTypePerson] = useState(info != undefined ?? info.thirdParty_nature);
    const [attachedRut,setAttachedRut] = useState();
    const [IVA_responsability,setIVA_responsability] = useState(info != undefined ?? info.IVA_responsability);
    const [retention_type,setRetention_type] = useState('-');
    const [economic_activity,setEconomic_activity] = useState('-');
    const [identidicationType_id,setIdentidicationType_id] = useState();

    const formInfo = {
        company_id:info.company_id,
        id:info.id,
        typePerson,
        attachedRut,
        IVA_responsability,
        retention_type,
        economic_activity,
        regime,
        thirdParty_id:params.thirdparty_id,
        setIdentidicationType_id
    }

    const dictionaryDocumentTypes = {
        "NIT":6,
        "CC":3,
        "CE":5,
        "TE":4,
        "PAS":7,
        "RC":11,
        "TI":12
    }

    // Update functions

     const handleSetDocumentType = (value)=>{
        setIdentidicationType_id(dictionaryDocumentTypes[value]);
    }

    const updateTaxInfo = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/updateThirdPartyTaxInfo',formInfo);
        if(res[0]);
        addNotification({
            type:'aproved',
            title:'Informacion actualizada correctamente',
            description:'Información tributaria actualzada correctamente.'
        })
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
                <>
                    <div className="paramsContainer">
                        <form onSubmit={(e)=>{
                            e.preventDefault();
                            updateTaxInfo();
                        }}>
                            <SearchinList placeHolder={'Seleccione una opción'} action={setTypePerson} title={'Naturaleza'} disabled={disabled} list={[
                                {text:'Persona juridica',value:1},
                                {text:'Persona Natural',value:2}
                            ]}/>
                            <SearchinList placeHolder={`Seleccione una opción`} action={setIVA_responsability} title={'Responsabilidad de IVA'} disabled={disabled} list={[
                                {text:'No aplica / No responsable de IVA',value:21},
                                {text:'IVA',value:18},
                                {text:'No responsable de consumo',value:22},
                            ]}/>
                            <SearchinList action={handleSetDocumentType} title={'Tipo de Identificación'} placeHolder={'Tipo de identificación'} list={[
                                {text:'NIT',value:'NIT'},
                                {text:'Cédula de Ciudadanía',value:'CC'},
                                {text:'Cédula de Extranjería',value:'CE'},
                                {text:'Tarjeta de extranjería',value:'TE'},
                                {text:'Pasaporte',value:'PAS'},
                                {text:'Registro civil',value:'RC'},
                                {text:'Tarjeta de identidad',value:'TI'}
                            ]}/>
                            <FormInput title={'Regimen del tercero'} action={setRegime} disabled={disabled} value={regime ?? '-'}/>
                            <FormInput title={'Tipo de Retención'} action={setRetention_type} disabled={disabled} value={retention_type}/>
                            <FormInput title={'Actividad Economica'} action={setEconomic_activity} disabled={disabled} value={economic_activity}/>
                            {formInfo != info && can_edit &&(
                                <FormButton text={'Guardar Cambios'} disabled={disabled}/>
                            )}
                        </form>
                    </div>
                    <div className="attachedDocumentsContainer">
                        <h6>Documentos Adjuntos</h6>
                        <div className="attachedDocsGrid">
                            <div className="RutContainer">
                                <div className="actualRut">
                                    {info.attachedRout == undefined && (
                                        <div className="noRutAttached">
                                            <i className="fa-solid fa-ghost"/>
                                            <h6>
                                                No has adjuntado ningun Rut
                                            </h6>
                                        </div>
                                    )}
                                </div>
                                <FileInput placeholder={'Seleccionar nuevo RUT'}/>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'}/>
            )}
        </div>
    )
}