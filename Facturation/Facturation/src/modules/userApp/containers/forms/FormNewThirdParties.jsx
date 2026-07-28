
import './FormNewThirdParties.css';
import { useEffect, useRef, useState } from 'react';
import { BoldTitle } from '../../components/BoldTitle';
import { FormButton } from '../../components/FormButton';
import { FormInput } from '../../components/FormInput';
import { getInfo, postInfo } from '../../../../utils/functions';
import { useAlert, useAppInfo, useNotifications } from '../../../../context/context';  
import { SearchinList } from '../../components/SearchInList';
import { SwitchOption } from '../../components/SwitchOption';
import { FileInput } from '../../components/FileInput';
import { TagIndicator } from '../../components/TagIndicator';
import { ThirdPartyFactusIdentificationTypeCodes, ThirdPartyIvaResponsabilityCodes, ThirdPartyNatureCodes } from '../../../../utils/Constants';
import { DescriptionSpan } from '../../components/DescriptionSpan';
import { ProductLinkFiscalConditionsCard } from '../../components/ProductLinkFiscalConditionsCard';
import { NoResults } from '../NoResults';
import { LoadingSpace } from '../LoadingSpace';
import { SelectOptions } from '../../components/SelectOptions';
import { CollapsableItem } from '../../components/CollapsableItem';
import {CapsuleButtonAi} from '../../components/ChatAiComponents/CapsuleButtonAi'
import { AutoCompleteThirdParties } from './AiAutoComplete/AutoCompleteThirdParties';

export function FormNewThirdParties({reloadFun,quickCreation}){

    const {addNotification} = useNotifications();
    const {popOutAlert, popInAlert} = useAlert();
    const {appInfo} = useAppInfo();
    // control
    const formContainerRef = useRef();
    const [stage,setStage] = useState(0);
    const [error,setError] = useState('');
    const [visibleError,setVisibleError] = useState(false);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [autoTaxInfo,setAutoTaxInfo] = useState(false);
    const [countries,setCountries] = useState([]);
    const [departments,setDepartments] = useState([]);
    const [municipalities,setMunicipalities] = useState([]);
    const [localities,setLocalities] = useState([]);
    const [retentions,setRetentions] = useState([]);
    const [withholdingRetentions,setWithholdingRetentions] = useState({
        selfWithholdingAgent:false,
        regime:'Regimen Ordinario Renta',
        rent:{
            rentTaxResponsable:false,
            rentTaxDeclarant:false,
            rentWithholdingAgent:false,
            rentSelfWithholdingAgent:false,
            rentSpecialSelfWithholdingAgent:false
        },
        iva:{
            stateEntity:false,
            DIANMajorTaxpayer:false,
            ivaTaxResponsable:false,
            ivaWithholdingAgent:false,
            ivaWithholdingAgentByCI:false
        },
        ring:{
            ringTaxResponsable:false,
            ringWithholdingAgent:false,
            ringSelfWithholdingAgent:false
        },
        consumption:{
            consumptionTaxResponsable:false,
            consumptionWithholdingAgent:false,
            consumptionSelfWithholdingAgent:false
        },
        territorialTaxes:[]
    });
    const [loadingRetentions,setLoadingRetentions] = useState(false);

    // info básica
    const [name,setName] = useState('');
    const [userPhoto,setUserPhoto] = useState('https://i.pinimg.com/1200x/ba/8d/7a/ba8d7a6364bf8ce99756686cba83c695.jpg');
    const [lastNames,setLastName] = useState('');
    //
    const [first_name,setFirst_name] = useState('');
    const [second_name,setSecond_name] = useState('');
    const [first_surname,setFirst_surname] = useState('');
    const [second_surname,setSecond_surname] = useState('');
    const [indentification_type,setindentification_type] = useState('');
    const [indentification_number,setindentification_number] = useState('');
    const [mail,setMail] = useState('');
    const [phone,setPhone] = useState('');
    const [country,setCountry] = useState('Colombia');
    const [country_id,setCountry_id] = useState();
    const [department_id,setDepartment_id] = useState();
    const [municipality_jurisdiction_id,setMunicipality_jurisdiction_id] = useState();
    const [mucipality_id,setMunicipality_id] = useState();
    const [locality_id,setLocality_id] = useState();
    const [city,setCity] = useState('');
    const [address,setAddress] = useState('');
    const [type,setType] = useState('client');
    // info comercial
    const [credit,setCredit] = useState(false);
    const [credit_term,setCredit_term] = useState(0);
    const [credit_value,setCredit_value] = useState(0);
    const [interest_rate,setInterest_rate] = useState(0);
    const [comercial_state,setComercial_state] = useState('active');
    const [thirdPartyProductTaxRelations,setThirdPartyProductTaxRelations] = useState([]);
    // info tributaria
    const [typePerson,setTypePerson] = useState(2);
    const [identidicationType_id,setIdentidicationType_id] = useState();
    const [attachedRut,setAttachedRut] = useState('');
    const [regime,seRregime] = useState('ORDINARIO');
    const [IVA_responsability,setIVA_responsability] = useState(21);
    const [retention_type,setRetention_type] = useState('NO_AGENTE');
    const [economic_activity,setEconomic_activity] = useState('');

    const maxStage = 3;

    const formInfo = {
        company_id:appInfo.company_id,
        userPhoto,
        first_name,
        second_name,
        first_surname,
        second_surname,
        indentification_type,
        indentification_number,
        identidicationType_id,
        mail,
        phone,
        country,
        country_id,
        department_id,
        municipality_jurisdiction_id,
        city,
        address,
        mucipality_id,
        locality_id,
        typePerson,
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
        attachedRut,
        withholdingRetentions
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

    // Utils
    const handleUserPhotoChange = (elements)=>{  
        if(elements.length >0 &&  elements[0].id != undefined){
            setUserPhoto(elements[0].url)
        }
    }

    const handleRutAttachmentChange = (elements)=>{
        const firstElement = elements?.[0];
        const firstUrl = firstElement?.url ?? firstElement;
        if(firstUrl != undefined){
            setAttachedRut(firstUrl);
        }
    }

    const handleSetDocumentType = (value)=>{
        setIdentidicationType_id(dictionaryDocumentTypes[value]);
        setindentification_type(value);
    }

    const normalizeGeographyName = (value='')=> value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const applyAiThirdPartyData = async(data)=>{
        setFirst_name(data.first_name ?? '');
        setSecond_name(data.second_name ?? '');
        setFirst_surname(data.first_surname ?? '');
        setSecond_surname(data.second_surname ?? '');
        setindentification_number(data.indentification_number ?? '');
        setMail(data.mail ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');
        setTypePerson(data.typePerson ?? 2);
        seRregime(data.regime || 'ORDINARIO');
        setIVA_responsability(data.IVA_responsability ?? 21);
        setRetention_type(data.retention_type || 'NO_AGENTE');
        setEconomic_activity(data.economic_activity ?? '');
        setAttachedRut(data.attachedRut ?? '');
        setWithholdingRetentions(current => (
            data.withholdingRetentions ?? current
        ));

        if(data.type){
            setType(data.type);
        }
        setCredit(data.credit ?? false);
        setCredit_term(data.credit_term ?? 0);
        setCredit_value(data.credit_value ?? 0);
        setInterest_rate(data.interest_rate ?? 0);
        setComercial_state(data.comercial_state || 'active');

        if(data.indentification_type){
            handleSetDocumentType(data.indentification_type);
        }

        try {
            const countriesResponse = await getInfo('/geography/countries');
            const countryRows = countriesResponse?.status === 'OK'
                ? countriesResponse.data
                : [];
            const countryRow = countryRows.find(element => (
                normalizeGeographyName(element.name)
                === normalizeGeographyName(data.country || 'Colombia')
            )) ?? countryRows.find(element => element.iso_code_2 === 'CO');

            if(!countryRow){
                setCountry(data.country ?? '');
                setCity(data.city ?? data.municipality ?? '');
                return;
            }

            setCountries(countryRows.map(element => ({
                text:element.name,
                value:element.id
            })));
            setCountry_id(countryRow.id);
            setCountry(countryRow.name);

            const departmentsResponse = await getInfo(
                `/geography/departments?country_id=${countryRow.id}`
            );
            const departmentRows = departmentsResponse?.status === 'OK'
                ? departmentsResponse.data
                : [];
            const departmentOptions = departmentRows.map(element => ({
                text:element.name,
                value:element.id
            }));
            setDepartments(departmentOptions);

            const departmentRow = departmentRows.find(element => (
                normalizeGeographyName(element.name)
                === normalizeGeographyName(data.department)
            ));
            if(!departmentRow){
                setCity(data.city ?? data.municipality ?? '');
                return;
            }
            setDepartment_id(departmentRow.id);

            const municipalitiesResponse = await getInfo(
                `/geography/municipalities?country_id=${countryRow.id}&department_id=${departmentRow.id}`
            );
            const municipalityRows = municipalitiesResponse?.status === 'OK'
                ? municipalitiesResponse.data
                : [];
            setMunicipalities(municipalityRows.map(element => ({
                text:`${element.name} (${element.code})`,
                value:element.id,
                externalCode:element.external_code,
                name:element.name
            })));

            const municipalityRow = municipalityRows.find(element => (
                `${element.external_code}` === `${data.municipality_code || data.mucipality_id}`
            )) ?? municipalityRows.find(element => (
                normalizeGeographyName(element.name)
                === normalizeGeographyName(data.municipality || data.city)
            ));
            if(!municipalityRow){
                setMunicipality_id(
                    data.municipality_code || data.mucipality_id || undefined
                );
                setCity(data.city ?? data.municipality ?? '');
                return;
            }

            setMunicipality_jurisdiction_id(municipalityRow.id);
            setMunicipality_id(municipalityRow.external_code);

            const localitiesResponse = await getInfo(
                `/geography/localities?municipality_id=${municipalityRow.id}`
            );
            const localityRows = localitiesResponse?.status === 'OK'
                ? localitiesResponse.data
                : [];
            setLocalities(localityRows.map(element => ({
                text:element.is_municipal_seat
                    ? `${element.name} (cabecera municipal)`
                    : element.name,
                value:element.id,
                name:element.name
            })));

            const localityRow = localityRows.find(element => (
                normalizeGeographyName(element.name)
                === normalizeGeographyName(data.city)
            )) ?? localityRows.find(element => element.is_municipal_seat);

            setLocality_id(localityRow?.id);
            setCity(localityRow?.name ?? data.city ?? municipalityRow.name);
        } catch(err) {
            console.error('No se pudo resolver la geografía extraída por IA:', err);
            setCountry(data.country ?? '');
            setCity(data.city ?? data.municipality ?? '');
        }
    };

    const isEmpty = (value)=> value === undefined || value === null || `${value}`.trim() === '';

    const scrollFormToTop = ()=>{
        const container = formContainerRef.current;
        if(!container) return;

        container.scrollTo?.({top:0, behavior:'smooth'});
        container.scrollIntoView?.({behavior:'smooth', block:'start'});

        let parent = container.parentElement;
        while(parent){
            if(parent.scrollHeight > parent.clientHeight){
                parent.scrollTo({top:0, behavior:'smooth'});
                break;
            }
            parent = parent.parentElement;
        }
    }

    const requiredFieldsByStage = {
        0: [
            {label:'Primer Nombre o Razón Social', value:first_name},
            {label:'Tipo de Identificación', value:indentification_type},
            {label:'Número de Identificación', value:indentification_number},
            {label:'Correo Electrónico', value:mail},
            {label:'País', value:country},
            {label:'Departamento', value:department_id},
            {label:'Municipio o región', value:mucipality_id},
            {label:'Ciudad o localidad', value:locality_id},
            {label:'Dirección', value:address}
        ],
        1: [
            {label:'Relación con el tercero', value:type},
            {label:'Estado comercial', value:comercial_state},
            ...(credit ? [
                {label:'Plazo de crédito', value:credit_term},
                {label:'Valor máximo de crédito', value:credit_value},
                {label:'Tasa de interés diario por mora', value:interest_rate}
            ] : [])
        ],
        2: [
            {label:'Naturaleza', value:typePerson},
            {label:'Responsabilidad de IVA', value:IVA_responsability},
            {label:'Tipo Identificación Facturación', value:identidicationType_id},
            {label:'Régimen del tercero', value:regime},
            {label:'Tipo de Retención', value:retention_type}
        ],
        3: []
    };

    const validateStage = (stageToValidate)=>{
        const missingFields = requiredFieldsByStage[stageToValidate].filter(field => isEmpty(field.value));

        if(missingFields.length > 0){
            setError(`Error de validación: completa ${missingFields.map(field => field.label).join(', ')}.`);
            setVisibleError(true);
            setTimeout(scrollFormToTop, 0);
            return false;
        }

        setVisibleError(false);
        return true;
    }

    const validateFullForm = ()=>{
        for(let index = 0; index <= maxStage; index++){
            if(!validateStage(index)){
                setStage(index);
                return false;
            }
        }
        return true;
    }

    // Getters of info
    const getCountries = async()=>{
        const res = await getInfo('/geography/countries');
        if(res.status === 'OK'){
            const options = res.data.map(element => ({ text:element.name, value:element.id }));
            setCountries(options);
            const colombia = res.data.find(element => element.iso_code_2 === 'CO');
            if(colombia){
                setCountry_id(colombia.id);
                setCountry(colombia.name);
            }
        }
    };

    const getDepartments = async(selectedCountryId)=>{
        const res = await getInfo(`/geography/departments?country_id=${selectedCountryId}`);
        if(res.status === 'OK'){
            setDepartments(res.data.map(element => ({ text:element.name, value:element.id })));
        }
    };

    const getMunicipalities = async(selectedCountryId, selectedDepartmentId)=>{
        const res = await getInfo(`/geography/municipalities?country_id=${selectedCountryId}&department_id=${selectedDepartmentId}`);
        if(res.status === 'OK'){
            setMunicipalities(res.data.map(element => ({
                text:`${element.name} (${element.code})`,
                value:element.id,
                externalCode:element.external_code,
                name:element.name
            })));
        }
    };

    const getLocalities = async(selectedMunicipalityId)=>{
        const res = await getInfo(`/geography/localities?municipality_id=${selectedMunicipalityId}`);
        if(res.status === 'OK'){
            const options = res.data.map(element => ({
                text:element.is_municipal_seat ? `${element.name} (cabecera municipal)` : element.name,
                value:element.id,
                name:element.name
            }));
            setLocalities(options);
            if(options.length === 1){
                setLocality_id(options[0].value);
                setCity(options[0].name);
            }
        }
    };

    const getRetentions = async()=>{
        if(!appInfo.company_id) return;

        setLoadingRetentions(true);
        try {
            const res = await getInfo(`/taxes/withholdings?company_id=${appInfo.company_id}`);
            if(res?.[0]){
                const options = res[1].map(element => ({
                    text:`${element.name} ${element.rate} % (${element.code})`,
                    value:element
                }));
                setRetentions(options ?? []);
                return;
            }
            setRetentions([]);
        } catch (err) {
            console.error('Error cargando retenciones de la compañía:', err);
            setRetentions([]);
        } finally {
            setLoadingRetentions(false);
        }
    };

    // Handlers

    const handleCountry = (id)=>{
        const selected = countries.find(element => element.value === id);
        setCountry_id(id);
        setCountry(selected?.text ?? '');
        setDepartment_id(undefined);
        setMunicipality_jurisdiction_id(undefined);
        setMunicipality_id(undefined);
        setLocality_id(undefined);
        setCity('');
    };

    const handleDepartment = (id)=>{
        setDepartment_id(id);
        setMunicipality_jurisdiction_id(undefined);
        setMunicipality_id(undefined);
        setLocality_id(undefined);
        setCity('');
    };

    const handleMunicipality = (id)=>{
        const selected = municipalities.find(element => element.value === id);
        setMunicipality_jurisdiction_id(id);
        setMunicipality_id(selected?.externalCode);
        setLocality_id(undefined);
        setCity('');
    };

    const handleLocality = (id)=>{
        const selected = localities.find(element => element.value === id);
        setLocality_id(id);
        setCity(selected?.name ?? '');
    };

    // Creation function
    const createThirdParty = async()=>{
        if(!validateFullForm()){
            return;
        }
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/createThirdParty',formInfo);
        const thirdPartyId = res?.[1] ?? res?.id ?? res?.thirdParty_id;
        if(res?.[0] || thirdPartyId){
            if(thirdPartyProductTaxRelations.length > 0 && thirdPartyId != undefined){
                try {
                    const relationsRes = await postInfo('/inventory/createThirdPartyProductTaxRelation',{
                        company_id:appInfo.company_id,
                        third_party_id:thirdPartyId,
                        relations:thirdPartyProductTaxRelations
                    });

                    if(relationsRes?.status !== 'OK'){
                        addNotification({
                            type:'error',
                            title:'Tercero creado con relaciones fiscales pendientes',
                            description:'El tercero fue creado, pero no se pudieron guardar todas las condiciones fiscales por producto.'
                        });
                    }
                } catch (err) {
                    addNotification({
                        type:'error',
                        title:'Tercero creado con relaciones fiscales pendientes',
                        description:err?.message ?? 'No se pudieron guardar las condiciones fiscales por producto.'
                    });
                }
            }
            addNotification({
                type:'aproved',
                title:`Tercero ${first_name} creado correctamente`,
                description:`El tercero ${first_name} fue creado correctamente.`
            })
            popOutAlert();
            if(reloadFun != undefined){
                reloadFun();
            }
        }
        else{
            addNotification({
                type:'error',
                title:`Error al crear tercerp "${first_name}"`,
                description:`Hubo un problema al crear el tercero "${first_name}", intentelo de nuevo.`
            })
        }
        setLoading(false);
        setDisabled(false);
    }

    const handlePrimaryAction = ()=>{
        if(stage < maxStage){
            //if(validateStage(stage)){
            if(true){
                setStage(stage +1)
            }
            return;
        }

        createThirdParty();
    }


    // Events listeners
    
    useEffect(()=>{
        getCountries();
    },[])

    useEffect(()=>{
        if(country_id) getDepartments(country_id);
    },[country_id])

    useEffect(()=>{
        if(country_id && department_id) getMunicipalities(country_id, department_id);
    },[country_id, department_id])

    useEffect(()=>{
        if(municipality_jurisdiction_id) getLocalities(municipality_jurisdiction_id);
    },[municipality_jurisdiction_id])

    useEffect(()=>{
        getRetentions();
    },[appInfo.company_id])


/** PENDIENTE REVISAR **/
    return(
        <div className="FormNewThirdParties" ref={formContainerRef}>
            {visibleError && (
                <div className="errorContainer">
                    <span>{error}</span>
                    <i title="Ocultar advertencia" className="fa-solid fa-xmark closeErrorBtn" onClick={()=>{
                        setVisibleError(false);
                    }}/>
                </div>
            )}

            <div className="headtThirdPartyForm">
                <div className="userPhoto">
                    <div className="actualPhoto">
                        <img src={userPhoto} alt="" />
                    </div>
                    <FileInput placeholder={'Seleccionar nueva foto'} action={handleUserPhotoChange}>
                        <i className="fa-solid fa-camera"/>
                    </FileInput>
                </div>
                <div className="mainHeadInfo">
                    <BoldTitle text={'Nuevo Tercero'}/>  
                    {first_name != "" && first_name != undefined && (
                        <DescriptionSpan 
                            text={`Completa la información ${
                                { 0: 'general', 1: 'comercial', 2: 'tributaria' }[stage] || 'general'
                            } de ${first_name} ${second_name} ${first_surname} ${second_surname} para continuar.`} 
                            />
                    ) }
                </div>
                <div className="AIads">
                    <CapsuleButtonAi title={'Autocompleta este formulario con IA'} onClick={()=>{
                        popInAlert(
                            <AutoCompleteThirdParties
                                updateFunction={applyAiThirdPartyData}
                            />
                        )
                    }} >
                        <span>
                            Completar con IA
                            <i className="fa-solid fa-flask"/>
                        </span>
                    </CapsuleButtonAi>
                </div>
            </div>

            {stage === 0 &&(
                <section>
                    <div className="tagSection">
                        <TagIndicator title={'Información General'} type={'suspended'}/>
                    </div>
                    <form action="" onSubmit={(e)=>{
                        e.preventDefault();
                        handlePrimaryAction();
                    }}>
                        <FormInput type={'text'} action={setFirst_name} value={first_name} title={'Primer Nombre o Razon Social'} placeholder={'Primer nombre'} disabled={disabled} required={true}/>
                        <FormInput type={'text'} action={setSecond_name} value={second_name} title={'Segundo Nombre'} placeholder={'Segundo nombre'} disabled={disabled} required={false}/>
                        <FormInput type={'text'} action={setFirst_surname} value={first_surname} title={'Primer Apellido o Diminutivo'} placeholder={'Primer Apellido'} disabled={disabled} required={false}/>
                        <FormInput type={'text'} action={setSecond_surname} value={second_surname} title={'Segundo Apellido'} placeholder={'Segundo Apellido'} disabled={disabled} required={false}/>
                        <SearchinList action={handleSetDocumentType} title={'Tipo de Identificación'} placeHolder={'Tipo de identificación'} list={[
                            {text:'NIT',value:'NIT'},
                            {text:'Cédula de Ciudadanía',value:'CC'},
                            {text:'Cédula de Extranjería',value:'CE'},
                            {text:'Tarjeta de extranjería',value:'TE'},
                            {text:'Pasaporte',value:'PAS'},
                            {text:'Registro civil',value:'RC'},
                            {text:'Tarjeta de identidad',value:'TI'}
                        ]}/>
                        <FormInput type={'number'} action={setindentification_number} value={indentification_number} title={'Número de Identificación'} placeholder={'Número de identificación'} disabled={disabled} required={true}/>
                        <FormInput type={'text'} action={setMail} title={'Correo Electrónico'} placeholder={'Correo electrónico del proveedor'} disabled={disabled} required={true}/>
                        <FormInput type={'number'} action={setPhone} title={'Teléfono'} placeholder={'Número de teléfono'} disabled={disabled} required={false}/>
                        <SearchinList
                            key={`country-${countries.length}`}
                            action={handleCountry}
                            title={'País'}
                            placeHolder={'Seleccione un país'}
                            list={countries}
                            disabled={disabled || countries.length === 0}
                            defaultValue={country_id ? {text:country, value:country_id} : {}}
                        />
                        <SearchinList
                            key={`department-${country_id}`}
                            action={handleDepartment}
                            title={'Departamento'}
                            placeHolder={'Seleccione un departamento'}
                            list={departments}
                            disabled={disabled || !country_id}
                        />
                        <SearchinList
                            key={`municipality-${department_id}`}
                            action={handleMunicipality}
                            title={'Municipio o distrito'}
                            placeHolder={'Seleccione un municipio'}
                            list={municipalities}
                            disabled={disabled || !department_id}
                        />
                        <SearchinList
                            key={`locality-${municipality_jurisdiction_id}-${localities.length}`}
                            action={handleLocality}
                            title={'Ciudad o localidad'}
                            placeHolder={'Seleccione una ciudad o localidad'}
                            list={localities}
                            disabled={disabled || !municipality_jurisdiction_id}
                            defaultValue={localities.length === 1 ? localities[0] : {}}
                        />
                        <FormInput type={'text'} action={setAddress} title={'Dirección'} placeholder={'Dirección del proveedor'} disabled={disabled} required={true}/>
                    </form>
                </section>
            )}
            {stage === 1 &&(
                <section>
                    <div className="tagSection">
                        <TagIndicator title={'Información Comercial'} type={'suspended'}/>
                    </div>
                    <form action="" onSubmit={(e)=>{
                        e.preventDefault();
                        handlePrimaryAction();
                    }}>
                        <SearchinList action={setType} title={'Relación con el tercero'} placeHolder={'Tipo de Proveedor'} defaultValue={{text:'Cliente',value:'client'}} list={[
                            {text:'Cliente',value:'client'},
                            {text:'Proveedor',value:'supplier'},
                            {text:'Cliente y proveedor',value:'both'},
                            {text:'Empleado',value:'employee'},
                            {text:'Contratista',value:'contractor'},
                            {text:'Socio',value:'partner'},
                            {text:'Otro',value:'other'}
                        ]}/>
                        <SearchinList action={setComercial_state} value={'Activo'} title={'Estado comercial'} placeHolder={'Estado comercial del tercero'} list={[
                            {text:'Activo',value:'active'},
                            {text:'Desactivado',value:'disabled'},
                            {text:'Bloqueado',value:'blocked'},
                            {text:'Reportado',value:'reported'}
                        ]}/>
                        {!quickCreation && (
                            <div className="accessSwitch">
                                <h6>Pago a credito</h6>
                                <SwitchOption action={setCredit}/>
                            </div>
                        )}
                        {!quickCreation && credit && (
                            <>
                                <FormInput type={'number'} title={'Plazo de credito en días'} min={0} disabled={disabled} value={credit_term} action={setCredit_term} required={true}/>
                                <FormInput type={'number'} title={'Valor maximo de credito'} min={0} disabled={disabled} value={credit_value} action={setCredit_value} required={true}/>
                                <FormInput type={'number'} title={'Tasa de interes diario por mora'} min={0} disabled={disabled} value={interest_rate} action={setInterest_rate} required={true}/>
                            </>
                        )}
                        {!quickCreation && (
                            <ProductLinkFiscalConditionsCard
                                companyId={appInfo.company_id}
                                info={formInfo}
                                disabled={disabled}
                                value={thirdPartyProductTaxRelations}
                                action={setThirdPartyProductTaxRelations}
                            />
                        )}
                    </form>
                </section>
            )}
            {stage === 2 && (
                <section>
                    <div className="tagSection">
                        <TagIndicator title={'Información Tributaria'} type={'suspended'}/>
                    </div>
                    <div className="setAutomaticTaxIndo" onClick={()=>{
                        setAutoTaxInfo(!autoTaxInfo);
                    }}>
                        <strong className={!autoTaxInfo?'activeTaxInfoOption':''}>Manual</strong>
                        <strong className={autoTaxInfo?'activeTaxInfoOption':''}>Automatico</strong>
                        <div className="modeTaxInfoIndicator" style={{left:`${autoTaxInfo? '50':'0'}%`}}/>
                    </div>
                    <form action="" onSubmit={(e)=>{
                        e.preventDefault();
                        handlePrimaryAction();
                    }}>
                        {!autoTaxInfo && (
                            <>  
                                <SearchinList placeHolder={'Seleccione una opción'} action={setTypePerson} title={'Naturaleza'} disabled={disabled} defaultValue={{text:'Persona Natural',value:2}} list={ThirdPartyNatureCodes}/>
                                <SearchinList placeHolder={'Seleccione una opción'} action={setIVA_responsability} title={'Responsabilidad de IVA'} disabled={disabled} defaultValue={{text:'No aplica / No responsable de IVA',value:21}} list={ThirdPartyIvaResponsabilityCodes}/>
                                <SearchinList placeHolder={'Tipo de identificación para facturación'} action={setIdentidicationType_id} title={'Tipo Identificación Facturación'} disabled={disabled} list={ThirdPartyFactusIdentificationTypeCodes}/>
                                <SearchinList placeHolder={'Seleccione régimen'} action={seRregime} title={'Régimen del tercero'} disabled={disabled} defaultValue={{text:'Ordinario',value:'ORDINARIO'}} list={[
                                    {text:'Ordinario', value:'ORDINARIO'},
                                    {text:'Simple de tributación', value:'SIMPLE'},
                                    {text:'Especial', value:'ESPECIAL'},
                                    {text:'No contribuyente', value:'NO_CONTRIBUYENTE'}
                                ]}/>
                                <SearchinList placeHolder={'Seleccione condición de retención'} action={setRetention_type} title={'Tipo de Retención'} disabled={disabled} defaultValue={{text:'No es agente de retención',value:'NO_AGENTE'}} list={[
                                    {text:'No es agente de retención', value:'NO_AGENTE'},
                                    {text:'Agente de retención', value:'AGENTE_RETENCION'},
                                    {text:'Autorretenedor', value:'AUTORRETENEDOR'}
                                ]}/>
                                <FormInput type={'text'} title={'Actividad Economica'} action={setEconomic_activity} disabled={disabled} value={economic_activity} placeholder={'Código o descripción de actividad económica'} required={false}/>
                                <FileInput
                                    action={handleRutAttachmentChange}
                                    placeholder={'Adjuntar soporte RUT'}
                                    disabled={disabled}
                                    setDisabled={setDisabled}
                                    multiple={true}
                                >
                                    <i className="fa-regular fa-folder-open"/>
                                </FileInput>
                            </>
                        )}
                    </form>
                    {autoTaxInfo && (
                        <>
                            <span>Esta opción no esta disponible por el momento</span>
                        </>
                    )}
                </section>
            )}
            {stage == 3 && (
                <section className='retentionsSection'>
                    <div className="tagSection">
                        <TagIndicator title={'Información de Retenciones'} type={'suspended'}/>
                    </div>
                    {loadingRetentions && (
                        <LoadingSpace title={'Cargando retenciones'} description={'Esto no debe tardar mucho'}/>
                    )}
                    {!loadingRetentions && retentions.length === 0 && (
                        <NoResults title={'La compañía no tiene retenciones configuradas.'}/>
                    )}
                    {!loadingRetentions && retentions.length > 0 && (
                        <form action="" onSubmit={(e)=>{
                            e.preventDefault();
                            handlePrimaryAction();
                        }}>
                            {/* Rent Ta */}
                            <CollapsableItem title={'RENTA'}>
                                <section className='taxRentSection'>
                                    <div className="labelSwitch">
                                        <span>Responsable del impuesto sobre RENTA</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Declarante impuesto sobre la RENTA</span>
                                        <SwitchOption/>
                                    </div>
                                    <SelectOptions title={'Regimen'} defaultValue={'Regimen Ordinario de renta'} options={[
                                        'Ordinario de renta',
                                        'Simple de tributación',
                                    ]}/>
                                    <div className="labelSwitch">
                                        <span>Regímen tributario Espcial RENTA</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de RENTA</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autorreteneor a titulo de RENTA</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autoretenedor especial de RENTA</span>
                                        <SwitchOption/>
                                    </div>
                                </section>
                            </CollapsableItem>
                            <CollapsableItem title={'IVA'}>
                                <section className='taxRentSection'>
                                    <div className="labelSwitch">
                                        <span>Entidad estatal</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Gran Contribuyente DIAN</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Responsable de IVA</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de IVA</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de IVA por ventas CI</span>
                                        <SwitchOption/>
                                    </div>
                                </section>
                            </CollapsableItem>
                            <CollapsableItem title={'TIMBRE'}>
                                <section className='taxRentSection'>
                                    <div className="labelSwitch">
                                        <span>Responsable impuesto de timbre</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de timbre</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autorretenedor a titulo de timbre</span>
                                        <SwitchOption/>
                                    </div>
                                </section>
                            </CollapsableItem>
                            <CollapsableItem title={'CONSMUMO'}>
                                <section className='taxRentSection'>
                                    <div className="labelSwitch">
                                        <span>Responsable impuesto al Consumo</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de impuesto al consumo</span>
                                        <SwitchOption/>
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autorretenedor a titulo de impuesto al consumo</span>
                                        <SwitchOption/>
                                    </div>
                                </section>
                            </CollapsableItem>
                        </form>
                    )}
                </section>
            )}
            <FormButton disabled={disabled} loading={loading} text={stage === maxStage ? 'Registrar Tercero':'Siguiente'} onClick={handlePrimaryAction}/>
            {stage > 0 && (
                <FormButton disabled={disabled} loading={loading} negative={true} text={'Volver'} onClick={()=>{
                    setStage(stage -1)
                }}/>
            )}
        </div>
    )
}       
