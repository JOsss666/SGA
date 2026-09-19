
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

const createInitialTaxConfig = () => ({
    rent:{
        regime:'',
        rentTaxResponsable:false,
        rentTaxDeclarant:false,
        rentWithholdingAgent:false,
        rentSelfWithholdingAgent:false,
        rentSpecialSelfWithholdingAgent:false,
        aceptMinimumBase:true,
        forceExeption:false
    },
    iva:{
        stateEntity:false,
        DIANMajorTaxpayer:false,
        ivaTaxResponsable:false,
        ivaWithholdingAgent:false,
        ivaWithholdingAgentByCI:false,
        aceptMinimumBase:true,
        forceExeption:false
    },
    ring:{
        ringTaxResponsable:false,
        ringWithholdingAgent:false,
        ringSelfWithholdingAgent:false,
        aceptMinimumBase:true,
        forceExeption:false
    },
    consumption:{
        consumptionTaxResponsable:false,
        consumptionWithholdingAgent:false,
        consumptionSelfWithholdingAgent:false,
        aceptMinimumBase:true,
        forceExeption:false
    },
    territorialTaxes:[]
});

const normalizeTaxConfig = (taxConfig = {}) => {
    const initialConfig = createInitialTaxConfig();

    return {
        rent:{
            ...initialConfig.rent,
            ...(taxConfig.rent ?? {}),
            regime:taxConfig.rent?.regime ?? taxConfig.regime ?? ''
        },
        iva:{
            ...initialConfig.iva,
            ...(taxConfig.iva ?? {})
        },
        ring:{
            ...initialConfig.ring,
            ...(taxConfig.ring ?? {})
        },
        consumption:{
            ...initialConfig.consumption,
            ...(taxConfig.consumption ?? {})
        },
        territorialTaxes:Array.isArray(taxConfig.territorialTaxes)
            ? taxConfig.territorialTaxes
            : []
    };
};

const createInitialFormData = (companyId = null) => ({
    company_id:companyId,
    userPhoto:'https://cdnmain.sga360.co/static/noUserImg_p817rb.webp',
    first_name:'',
    second_name:'',
    first_surname:'',
    second_surname:'',
    indentification_type:'',
    indentification_number:'',
    identidicationType_id:null,
    mail:'',
    phone:'',
    country:'Colombia',
    country_id:null,
    department_id:null,
    municipality_jurisdiction_id:null,
    mucipality_id:'',
    locality_id:null,
    city:'',
    address:'',
    type:'client',
    credit:false,
    credit_term:0,
    credit_value:0,
    interest_rate:0,
    comercial_state:'active',
    typePerson:2,
    regime:'ORDINARIO',
    IVA_responsability:21,
    retention_type:'NO_AGENTE',
    economic_activity:'',
    attachedRut:'',
    withholdingRetentions:createInitialTaxConfig(),
    thirdPartyProductTaxRelations:[]
});

export function FormNewThirdParties({reloadFun,quickCreation}){

    const {addNotification} = useNotifications();
    const {popOutAlert, popInAlert} = useAlert();
    const {appInfo,userConfig} = useAppInfo();
    // control
    const canUseAi = userConfig.access.services.sga["AI"].use == true;
    const canCreateWithAi = userConfig.access.services.sga["AI"].documents.purchase.overAll == true;
    const aiPermission = canUseAi && canCreateWithAi;
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
    const [loadingRetentions,setLoadingRetentions] = useState(false);
    const [formData,setFormData] = useState(() => (
        createInitialFormData(appInfo.company_id ?? null)
    ));

    const maxStage = 3;
    const {
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
        mucipality_id,
        locality_id,
        address,
        type,
        credit,
        credit_term,
        credit_value,
        interest_rate,
        comercial_state,
        typePerson,
        regime,
        IVA_responsability,
        retention_type,
        economic_activity,
        withholdingRetentions,
        thirdPartyProductTaxRelations
    } = formData;

    const dictionaryDocumentTypes = {
        "NIT":6,
        "CC":3,
        "CE":5,
        "TE":4,
        "PAS":7,
        "RC":11,
        "TI":12
    }

    const updateField = (field,value)=>{
        setFormData(current => ({
            ...current,
            [field]:value
        }));
    };

    const updateFields = (fields)=>{
        setFormData(current => ({
            ...current,
            ...fields
        }));
    };

    const updateNestedField = (path,value)=>{
        setFormData(current => {
            const updatePath = (source,index)=>{
                const key = path[index];
                if(index === path.length - 1){
                    return {...source, [key]:value};
                }
                return {
                    ...source,
                    [key]:updatePath(source?.[key] ?? {}, index + 1)
                };
            };
            return updatePath(current,0);
        });
    };

    // Utils
    const handleUserPhotoChange = (elements)=>{  
        if(elements.length >0 &&  elements[0].id != undefined){
            updateField('userPhoto',elements[0].url);
        }
    }

    const handleRutAttachmentChange = (elements)=>{
        const firstElement = elements?.[0];
        const firstUrl = firstElement?.url ?? firstElement;
        if(firstUrl != undefined){
            updateField('attachedRut',firstUrl);
        }
    }

    const handleSetDocumentType = (value)=>{
        updateFields({
            identidicationType_id:dictionaryDocumentTypes[value] ?? null,
            indentification_type:value
        });
    }

    const normalizeGeographyName = (value='')=> value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

    const getGeographyRows = (response)=> (
        response?.status === 'OK' && Array.isArray(response.data)
            ? response.data
            : []
    );

    const resolveAiGeography = async(data)=>{
        const countryRows = getGeographyRows(
            await getInfo('/geography/countries')
        );
        const requestedCountry = `${data.country ?? ''}`.trim();
        const normalizedRequestedCountry = normalizeGeographyName(requestedCountry);
        const countryRow = countryRows.find(element => (
            normalizeGeographyName(element.name) === normalizedRequestedCountry
            || `${element.iso_code_2 ?? ''}`.toLowerCase() === normalizedRequestedCountry
            || `${element.iso_code_3 ?? ''}`.toLowerCase() === normalizedRequestedCountry
        )) ?? (
            !requestedCountry || normalizedRequestedCountry === 'colombia'
                ? countryRows.find(element => element.iso_code_2 === 'CO')
                : undefined
        );

        const countryOptions = countryRows.map(element => ({
            text:element.name,
            value:element.id
        }));

        if(!countryRow){
            return {
                countryOptions,
                departmentOptions:[],
                municipalityOptions:[],
                localityOptions:[],
                values:{
                    country:requestedCountry,
                    country_id:null,
                    department_id:null,
                    municipality_jurisdiction_id:null,
                    mucipality_id:data.municipality_code || data.mucipality_id || '',
                    locality_id:null,
                    city:data.locality || data.city || data.municipality || ''
                }
            };
        }

        const departmentRows = getGeographyRows(
            await getInfo(`/geography/departments?country_id=${countryRow.id}`)
        );
        let departmentRow = departmentRows.find(element => (
            normalizeGeographyName(element.name)
                === normalizeGeographyName(data.department)
            || `${element.code ?? ''}` === `${data.department_code ?? ''}`
        ));

        let municipalityRows = getGeographyRows(
            await getInfo(
                `/geography/municipalities?country_id=${countryRow.id}${
                    departmentRow ? `&department_id=${departmentRow.id}` : ''
                }`
            )
        );
        const requestedMunicipalityCode = `${
            data.municipality_code || data.mucipality_id || ''
        }`.replace(/\D/g, '');
        let municipalityRow = municipalityRows.find(element => (
            requestedMunicipalityCode
            && [
                `${element.external_code ?? ''}`.replace(/\D/g, ''),
                `${element.code ?? ''}`.replace(/\D/g, '')
            ].includes(requestedMunicipalityCode)
        )) ?? municipalityRows.find(element => (
            normalizeGeographyName(element.name)
                === normalizeGeographyName(data.municipality || data.city)
        ));

        // Si el departamento fue escrito de otra forma, el código DANE o el
        // nombre del municipio permiten encontrarlo sin cargar catálogos globales.
        if(!municipalityRow && departmentRow){
            municipalityRows = getGeographyRows(
                await getInfo(`/geography/municipalities?country_id=${countryRow.id}`)
            );
            municipalityRow = municipalityRows.find(element => (
                requestedMunicipalityCode
                && [
                    `${element.external_code ?? ''}`.replace(/\D/g, ''),
                    `${element.code ?? ''}`.replace(/\D/g, '')
                ].includes(requestedMunicipalityCode)
            )) ?? municipalityRows.find(element => (
                normalizeGeographyName(element.name)
                    === normalizeGeographyName(data.municipality || data.city)
            ));
        }

        if(municipalityRow && !departmentRow){
            departmentRow = departmentRows.find(element => (
                `${element.id}` === `${municipalityRow.department_id}`
            ));
        }

        const municipalityOptions = municipalityRows
            .filter(element => (
                !departmentRow
                || `${element.department_id}` === `${departmentRow.id}`
            ))
            .map(element => ({
                text:`${element.name} (${element.code})`,
                value:element.id,
                externalCode:element.external_code,
                name:element.name
            }));

        let localityRows = [];
        let localityRow;
        if(municipalityRow){
            localityRows = getGeographyRows(
                await getInfo(`/geography/localities?municipality_id=${municipalityRow.id}`)
            );
            const localityName = data.locality || data.city;
            localityRow = localityRows.find(element => (
                normalizeGeographyName(element.name)
                    === normalizeGeographyName(localityName)
            )) ?? localityRows.find(element => element.is_municipal_seat);
        }

        return {
            countryOptions,
            departmentOptions:departmentRows.map(element => ({
                text:element.name,
                value:element.id
            })),
            municipalityOptions,
            localityOptions:localityRows.map(element => ({
                text:element.is_municipal_seat
                    ? `${element.name} (cabecera municipal)`
                    : element.name,
                value:element.id,
                name:element.name
            })),
            values:{
                country:countryRow.name,
                country_id:countryRow.id,
                department_id:departmentRow?.id ?? null,
                municipality_jurisdiction_id:municipalityRow?.id ?? null,
                mucipality_id:municipalityRow?.external_code
                    ?? data.municipality_code
                    ?? data.mucipality_id
                    ?? '',
                locality_id:localityRow?.id ?? null,
                city:localityRow?.name
                    ?? data.locality
                    ?? data.city
                    ?? municipalityRow?.name
                    ?? ''
            }
        };
    };

    const applyAiThirdPartyData = async(data)=>{
        console.log('Actualizando información a: ',data);
        setFormData(current => ({
            ...current,
            first_name:data.first_name ?? '',
            second_name:data.second_name ?? '',
            first_surname:data.first_surname ?? '',
            second_surname:data.second_surname ?? '',
            indentification_type:data.indentification_type ?? '',
            indentification_number:data.indentification_number ?? '',
            identidicationType_id:data.indentification_type
                ? dictionaryDocumentTypes[data.indentification_type] ?? null
                : current.identidicationType_id,
            mail:data.mail ?? '',
            phone:data.phone ?? '',
            address:data.address ?? '',
            typePerson:data.typePerson ?? 2,
            regime:data.regime || 'ORDINARIO',
            IVA_responsability:data.IVA_responsability ?? 21,
            retention_type:data.retention_type || 'NO_AGENTE',
            economic_activity:data.economic_activity ?? '',
            attachedRut:data.attachedRut ?? '',
            withholdingRetentions:data.withholdingRetentions
                ? normalizeTaxConfig(data.withholdingRetentions)
                : current.withholdingRetentions,
            type:data.type || current.type,
            credit:data.credit ?? false,
            credit_term:data.credit_term ?? 0,
            credit_value:data.credit_value ?? 0,
            interest_rate:data.interest_rate ?? 0,
            comercial_state:data.comercial_state || 'active'
        }));

        try {
            const geography = await resolveAiGeography(data);
            setCountries(geography.countryOptions);
            setDepartments(geography.departmentOptions);
            setMunicipalities(geography.municipalityOptions);
            setLocalities(geography.localityOptions);
            updateFields(geography.values);
        } catch(err) {
            console.error('No se pudo resolver la geografía extraída por IA:', err);
            updateFields({
                country:data.country ?? '',
                city:data.city ?? data.municipality ?? ''
            });
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
                updateFields({
                    country_id:colombia.id,
                    country:colombia.name
                });
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
                updateFields({
                    locality_id:options[0].value,
                    city:options[0].name
                });
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
        updateFields({
            country_id:id,
            country:selected?.text ?? '',
            department_id:null,
            municipality_jurisdiction_id:null,
            mucipality_id:'',
            locality_id:null,
            city:''
        });
    };

    const handleDepartment = (id)=>{
        updateFields({
            department_id:id,
            municipality_jurisdiction_id:null,
            mucipality_id:'',
            locality_id:null,
            city:''
        });
    };

    const handleMunicipality = (id)=>{
        const selected = municipalities.find(element => element.value === id);
        updateFields({
            municipality_jurisdiction_id:id,
            mucipality_id:selected?.externalCode ?? '',
            locality_id:null,
            city:''
        });
    };

    const handleLocality = (id)=>{
        const selected = localities.find(element => element.value === id);
        updateFields({
            locality_id:id,
            city:selected?.name ?? ''
        });
    };

    // Creation function
    const createThirdParty = async()=>{
        if(!validateFullForm()){
            return;
        }
        setDisabled(true)
        setLoading(true)
        const {
            withholdingRetentions,
            ...thirdPartyData
        } = formData;
        const payload = {
            ...thirdPartyData,
            company_id:appInfo.company_id ?? formData.company_id,
            taxConfig:normalizeTaxConfig(withholdingRetentions)
        };
        let res = await postInfo('/createThirdParty',payload);
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
            setStage(stage +1)
            return;
        }

        createThirdParty();
    }


    // Events listeners

    useEffect(()=>{
        if(appInfo.company_id){
            updateField('company_id',appInfo.company_id);
        }
    },[appInfo.company_id])
    
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
                    <FileInput category="assets" placeholder={'Seleccionar nueva foto'} action={handleUserPhotoChange}>
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
                {aiPermission && (
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
                )}
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
                        <FormInput type={'text'} action={value=>updateField('first_name',value)} value={first_name} title={'Primer Nombre o Razon Social'} placeholder={'Primer nombre'} disabled={disabled} required={true}/>
                        <FormInput type={'text'} action={value=>updateField('second_name',value)} value={second_name} title={'Segundo Nombre'} placeholder={'Segundo nombre'} disabled={disabled} required={false}/>
                        <FormInput type={'text'} action={value=>updateField('first_surname',value)} value={first_surname} title={'Primer Apellido o Diminutivo'} placeholder={'Primer Apellido'} disabled={disabled} required={false}/>
                        <FormInput type={'text'} action={value=>updateField('second_surname',value)} value={second_surname} title={'Segundo Apellido'} placeholder={'Segundo Apellido'} disabled={disabled} required={false}/>
                        <SearchinList value={indentification_type} action={handleSetDocumentType} title={'Tipo de Identificación'} placeHolder={'Tipo de identificación'} defaultValue={indentification_type ? {text:indentification_type,value:indentification_type} : {}} list={[
                            {text:'NIT',value:'NIT'},
                            {text:'Cédula de Ciudadanía',value:'CC'},
                            {text:'Cédula de Extranjería',value:'CE'},
                            {text:'Tarjeta de extranjería',value:'TE'},
                            {text:'Pasaporte',value:'PAS'},
                            {text:'Registro civil',value:'RC'},
                            {text:'Tarjeta de identidad',value:'TI'}
                        ]}/>
                        <FormInput type={'number'} action={value=>updateField('indentification_number',value)} value={indentification_number} title={'Número de Identificación'} placeholder={'Número de identificación'} disabled={disabled} required={true}/>
                        <FormInput type={'text'} action={value=>updateField('mail',value)} value={mail} title={'Correo Electrónico'} placeholder={'Correo electrónico del proveedor'} disabled={disabled} required={true}/>
                        <FormInput type={'number'} action={value=>updateField('phone',value)} value={phone} title={'Teléfono'} placeholder={'Número de teléfono'} disabled={disabled} required={false}/>
                        <SearchinList
                            value={country_id}
                            action={handleCountry}
                            title={'País'}
                            placeHolder={'Seleccione un país'}
                            list={countries}
                            disabled={disabled || countries.length === 0}
                            defaultValue={country_id ? {text:country, value:country_id} : {}}
                        />
                        <SearchinList
                            value={department_id}
                            action={handleDepartment}
                            title={'Departamento'}
                            placeHolder={'Seleccione un departamento'}
                            list={departments}
                            disabled={disabled || !country_id}
                            defaultValue={department_id ? departments.find(element => element.value === department_id) ?? {} : {}}
                        />
                        <SearchinList
                            value={municipality_jurisdiction_id}
                            action={handleMunicipality}
                            title={'Municipio o distrito'}
                            placeHolder={'Seleccione un municipio'}
                            list={municipalities}
                            disabled={disabled || !department_id}
                            defaultValue={municipality_jurisdiction_id ? municipalities.find(element => element.value === municipality_jurisdiction_id) ?? {} : {}}
                        />
                        <SearchinList
                            value={locality_id}
                            action={handleLocality}
                            title={'Ciudad o localidad'}
                            placeHolder={'Seleccione una ciudad o localidad'}
                            list={localities}
                            disabled={disabled || !municipality_jurisdiction_id}
                            defaultValue={locality_id
                                ? localities.find(element => element.value === locality_id) ?? {}
                                : localities.length === 1 ? localities[0] : {}}
                        />
                        <FormInput type={'text'} action={value=>updateField('address',value)} value={address} title={'Dirección'} placeholder={'Dirección del proveedor'} disabled={disabled} required={true}/>
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
                        <SearchinList value={type} action={value=>updateField('type',value)} title={'Relación con el tercero'} placeHolder={'Tipo de Proveedor'} defaultValue={{
                            text:{
                                client:'Cliente',
                                supplier:'Proveedor',
                                both:'Cliente y proveedor',
                                employee:'Empleado',
                                contractor:'Contratista',
                                partner:'Socio',
                                other:'Otro'
                            }[type],
                            value:type
                        }} list={[
                            {text:'Cliente',value:'client'},
                            {text:'Proveedor',value:'supplier'},
                            {text:'Cliente y proveedor',value:'both'},
                            {text:'Empleado',value:'employee'},
                            {text:'Contratista',value:'contractor'},
                            {text:'Socio',value:'partner'},
                            {text:'Otro',value:'other'}
                        ]}/>
                        <SearchinList value={comercial_state} action={value=>updateField('comercial_state',value)} title={'Estado comercial'} placeHolder={'Estado comercial del tercero'} defaultValue={{
                            text:{
                                active:'Activo',
                                disabled:'Desactivado',
                                blocked:'Bloqueado',
                                reported:'Reportado'
                            }[comercial_state],
                            value:comercial_state
                        }} list={[
                            {text:'Activo',value:'active'},
                            {text:'Desactivado',value:'disabled'},
                            {text:'Bloqueado',value:'blocked'},
                            {text:'Reportado',value:'reported'}
                        ]}/>
                        {!quickCreation && (
                            <div className="accessSwitch">
                                <h6>Pago a credito</h6>
                                <SwitchOption key={`credit-${credit}`} action={value=>updateField('credit',value)} defaultValue={credit}/>
                            </div>
                        )}
                        {!quickCreation && credit && (
                            <>
                                <FormInput type={'number'} title={'Plazo de credito en días'} min={0} disabled={disabled} value={credit_term} action={value=>updateField('credit_term',value)} required={true}/>
                                <FormInput type={'number'} title={'Valor maximo de credito'} min={0} disabled={disabled} value={credit_value} action={value=>updateField('credit_value',value)} required={true}/>
                                <FormInput type={'number'} title={'Tasa de interes diario por mora'} min={0} disabled={disabled} value={interest_rate} action={value=>updateField('interest_rate',value)} required={true}/>
                            </>
                        )}
                        {!quickCreation && (
                            <ProductLinkFiscalConditionsCard
                                companyId={appInfo.company_id}
                                info={formData}
                                disabled={disabled}
                                value={thirdPartyProductTaxRelations}
                                action={value=>updateField('thirdPartyProductTaxRelations',value)}
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
                                <SearchinList value={typePerson} placeHolder={'Seleccione una opción'} action={value=>updateField('typePerson',value)} title={'Naturaleza'} disabled={disabled} defaultValue={ThirdPartyNatureCodes.find(element => element.value === typePerson) ?? {}} list={ThirdPartyNatureCodes}/>
                                <SearchinList value={IVA_responsability} placeHolder={'Seleccione una opción'} action={value=>updateField('IVA_responsability',value)} title={'Responsabilidad de IVA'} disabled={disabled} defaultValue={ThirdPartyIvaResponsabilityCodes.find(element => element.value === IVA_responsability) ?? {}} list={ThirdPartyIvaResponsabilityCodes}/>
                                <SearchinList value={identidicationType_id} placeHolder={'Tipo de identificación para facturación'} action={value=>updateField('identidicationType_id',value)} title={'Tipo Identificación Facturación'} disabled={disabled} defaultValue={ThirdPartyFactusIdentificationTypeCodes.find(element => element.value === identidicationType_id) ?? {}} list={ThirdPartyFactusIdentificationTypeCodes}/>
                                <SearchinList value={regime} placeHolder={'Seleccione régimen'} action={value=>updateField('regime',value)} title={'Régimen del tercero'} disabled={disabled} defaultValue={{
                                    text:{
                                        ORDINARIO:'Ordinario',
                                        SIMPLE:'Simple de tributación',
                                        ESPECIAL:'Especial',
                                        NO_CONTRIBUYENTE:'No contribuyente'
                                    }[regime],
                                    value:regime
                                }} list={[
                                    {text:'Ordinario', value:'ORDINARIO'},
                                    {text:'Simple de tributación', value:'SIMPLE'},
                                    {text:'Especial', value:'ESPECIAL'},
                                    {text:'No contribuyente', value:'NO_CONTRIBUYENTE'}
                                ]}/>
                                <SearchinList value={retention_type} placeHolder={'Seleccione condición de retención'} action={value=>updateField('retention_type',value)} title={'Tipo de Retención'} disabled={disabled} defaultValue={{
                                    text:{
                                        NO_AGENTE:'No es agente de retención',
                                        AGENTE_RETENCION:'Agente de retención',
                                        AUTORRETENEDOR:'Autorretenedor'
                                    }[retention_type],
                                    value:retention_type
                                }} list={[
                                    {text:'No es agente de retención', value:'NO_AGENTE'},
                                    {text:'Agente de retención', value:'AGENTE_RETENCION'},
                                    {text:'Autorretenedor', value:'AUTORRETENEDOR'}
                                ]}/>
                                <FormInput type={'text'} title={'Actividad Economica'} action={value=>updateField('economic_activity',value)} disabled={disabled} value={economic_activity} placeholder={'Código o descripción de actividad económica'} required={false}/>
                                <FileInput
                                    category="thirdPartiesDocs"
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
                                        <SwitchOption
                                            key={`rent-responsible-${withholdingRetentions.rent.rentTaxResponsable}`}
                                            defaultValue={withholdingRetentions.rent.rentTaxResponsable}
                                            action={value=>updateNestedField(['withholdingRetentions','rent','rentTaxResponsable'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Declarante impuesto sobre la RENTA</span>
                                        <SwitchOption
                                            key={`rent-declarant-${withholdingRetentions.rent.rentTaxDeclarant}`}
                                            defaultValue={withholdingRetentions.rent.rentTaxDeclarant}
                                            action={value=>updateNestedField(['withholdingRetentions','rent','rentTaxDeclarant'],value)}
                                        />
                                    </div>
                                    <SelectOptions
                                        key={`withholding-regime-${withholdingRetentions.rent.regime}`}
                                        title={'Regimen'}
                                        defaultValue={{value:withholdingRetentions.rent.regime}}
                                        action={value=>updateNestedField(['withholdingRetentions','rent','regime'],value)}
                                        options={[
                                            'Regimen Ordinario Renta',
                                            'Regimen Simple',
                                            'Regimen Especial'
                                        ]}
                                    />
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de RENTA</span>
                                        <SwitchOption
                                            key={`rent-withholding-${withholdingRetentions.rent.rentWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.rent.rentWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','rent','rentWithholdingAgent'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autorreteneor a titulo de RENTA</span>
                                        <SwitchOption
                                            key={`rent-self-withholding-${withholdingRetentions.rent.rentSelfWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.rent.rentSelfWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','rent','rentSelfWithholdingAgent'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autoretenedor especial de RENTA</span>
                                        <SwitchOption
                                            key={`rent-special-self-${withholdingRetentions.rent.rentSpecialSelfWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.rent.rentSpecialSelfWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','rent','rentSpecialSelfWithholdingAgent'],value)}
                                        />
                                    </div>
                                </section>
                            </CollapsableItem>
                            <CollapsableItem title={'IVA'}>
                                <section className='taxRentSection'>
                                    <div className="labelSwitch">
                                        <span>Entidad estatal</span>
                                        <SwitchOption
                                            key={`iva-state-${withholdingRetentions.iva.stateEntity}`}
                                            defaultValue={withholdingRetentions.iva.stateEntity}
                                            action={value=>updateNestedField(['withholdingRetentions','iva','stateEntity'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Gran Contribuyente DIAN</span>
                                        <SwitchOption
                                            key={`iva-major-${withholdingRetentions.iva.DIANMajorTaxpayer}`}
                                            defaultValue={withholdingRetentions.iva.DIANMajorTaxpayer}
                                            action={value=>updateNestedField(['withholdingRetentions','iva','DIANMajorTaxpayer'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Responsable de IVA</span>
                                        <SwitchOption
                                            key={`iva-responsible-${withholdingRetentions.iva.ivaTaxResponsable}`}
                                            defaultValue={withholdingRetentions.iva.ivaTaxResponsable}
                                            action={value=>updateNestedField(['withholdingRetentions','iva','ivaTaxResponsable'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de IVA</span>
                                        <SwitchOption
                                            key={`iva-withholding-${withholdingRetentions.iva.ivaWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.iva.ivaWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','iva','ivaWithholdingAgent'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de IVA por ventas CI</span>
                                        <SwitchOption
                                            key={`iva-ci-${withholdingRetentions.iva.ivaWithholdingAgentByCI}`}
                                            defaultValue={withholdingRetentions.iva.ivaWithholdingAgentByCI}
                                            action={value=>updateNestedField(['withholdingRetentions','iva','ivaWithholdingAgentByCI'],value)}
                                        />
                                    </div>
                                </section>
                            </CollapsableItem>
                            <CollapsableItem title={'TIMBRE'}>
                                <section className='taxRentSection'>
                                    <div className="labelSwitch">
                                        <span>Responsable impuesto de timbre</span>
                                        <SwitchOption
                                            key={`ring-responsible-${withholdingRetentions.ring.ringTaxResponsable}`}
                                            defaultValue={withholdingRetentions.ring.ringTaxResponsable}
                                            action={value=>updateNestedField(['withholdingRetentions','ring','ringTaxResponsable'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de timbre</span>
                                        <SwitchOption
                                            key={`ring-withholding-${withholdingRetentions.ring.ringWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.ring.ringWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','ring','ringWithholdingAgent'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autorretenedor a titulo de timbre</span>
                                        <SwitchOption
                                            key={`ring-self-${withholdingRetentions.ring.ringSelfWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.ring.ringSelfWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','ring','ringSelfWithholdingAgent'],value)}
                                        />
                                    </div>
                                </section>
                            </CollapsableItem>
                            <CollapsableItem title={'CONSMUMO'}>
                                <section className='taxRentSection'>
                                    <div className="labelSwitch">
                                        <span>Responsable impuesto al Consumo</span>
                                        <SwitchOption
                                            key={`consumption-responsible-${withholdingRetentions.consumption.consumptionTaxResponsable}`}
                                            defaultValue={withholdingRetentions.consumption.consumptionTaxResponsable}
                                            action={value=>updateNestedField(['withholdingRetentions','consumption','consumptionTaxResponsable'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Agente retenedor a titulo de impuesto al consumo</span>
                                        <SwitchOption
                                            key={`consumption-withholding-${withholdingRetentions.consumption.consumptionWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.consumption.consumptionWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','consumption','consumptionWithholdingAgent'],value)}
                                        />
                                    </div>
                                    <div className="labelSwitch">
                                        <span>Autorretenedor a titulo de impuesto al consumo</span>
                                        <SwitchOption
                                            key={`consumption-self-${withholdingRetentions.consumption.consumptionSelfWithholdingAgent}`}
                                            defaultValue={withholdingRetentions.consumption.consumptionSelfWithholdingAgent}
                                            action={value=>updateNestedField(['withholdingRetentions','consumption','consumptionSelfWithholdingAgent'],value)}
                                        />
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
