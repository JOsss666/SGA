
import { useEffect, useRef, useState } from 'react'
import { BoldTitle } from '../../components/BoldTitle'
import { FormInput } from '../../components/FormInput'
import {FormButton} from '../../components/FormButton'
import {postInfo} from '../../../../utils/functions'
import { useAppInfo, useNotifications } from '../../../../context/context'
import { useAlert } from '../../../../context/context'
import './FormNewProduct.css'
import { SearchinList } from '../../components/SearchInList'
import { NewElementSelect } from '../../components/NewElementSelect'
import { FileInput } from '../../components/FileInput'
import { FormNewCategory } from './FormNewCategory'
import { SwitchOption } from '../../components/SwitchOption'
import { DescriptionSpan } from '../../components/DescriptionSpan'
import { TagIndicator } from '../../components/TagIndicator'

export function FormNewProduct({info,update,reloadFun}){

    if(info == undefined){
        info = {}
    }

    // requiremts
    const {appInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popInAlert, popOutAlert} = useAlert();
    const [concepts,setConcepts] = useState([]);
    const [accounts,setAccounts] = useState([]);
    const [categories,setCategories] = useState([]);
    const [ThirdParties,setThirdParties] = useState([]);
    const meassureUnitsList = ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'mm2', 'cm2', 'm2', 'km2', 'in2', 'ft2', 'yd2', 'ml', 'l', 'm3', 'floz', 'pt', 'qt', 'gal', 'ft3', 'in3', 'mg', 'g', 'kg', 't', 'oz', 'lb', 'st', 'unit', 'pair', 'doz', 'box', 'pkg', 'bag', 'roll', 'set', 'tray', 'pallet', 'bar', 'sheet', 'm_roll', 'm2_sheet']
    const meassureUnits = meassureUnitsList.map(u => ({ text: u }));

    // control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [stage,setStage] = useState(0);
    const [error,setError] = useState('');
    const [visibleError,setVisibleError] = useState(false);
    const formContainerRef = useRef();
    const [purchaseTaxes,setPurchaseTaxes] = useState([]);
    const [purchaseRetentionTaxes,setPurchaseRetentionTaxes] = useState([]);
    const [sellTaxes,setSellTaxes] = useState([]);
    const [sellRetentionTaxes,setSellRetentionTaxes] = useState([]);

    // form info

        // Sec 0 --> General Info
        const [photo,setPhoto] = useState('https://res.cloudinary.com/djjxugmni/image/upload/v1764620093/ChatGPT_Image_1_dic_2025_15_04_38_3_hcdqxl.png');
        const [type_product,setType_product] = useState('product');
        const [name,setName] = useState('');
        const [code,setCode] = useState('');
        const [description,setDescription] = useState('');
        const [category_id,setCategory_id] = useState();
        // Sec 1 --> Inventoty Settings
        const [inventariable,setInventariable] = useState(false);
        const [units,setUnits] = useState();
        const [stock,setStock] = useState(0);
        const [minStock,setMinStock] = useState(0)
        const [maxStock,setMaxStock] = useState(0)
        const [availableDate,setAvailableDate] = useState('');
        const [aviableUnitl,setAviableUntil] = useState('');
        // Sec 2 --> Purchase
        const [defaultSupplier,setDefaultSupplier] = useState();
        const [purchaseConcept,setPurchaseConcept] = useState();
        const [purchaseTaxed,setPurchaseTaxed] = useState(false);
        const [purchaseTax_id,setPurchaseTax_id] = useState(false);
        const [purchaseWithholdings,setPurchaseWithholdings] = useState([]);
        // Sec 3 --> Sell
        const [sellDescription,setSellDescription] = useState('');
        const [sellConcept,setSellConcept] = useState();
        const [taxed,setTaxed] = useState(false);
        const [tax_id,setTax_id] = useState();
        const [sellWithholdings,setSellWithholdings] = useState([]);

    const formInfo = {
        company_id:appInfo.company_id,
        photo,
        name,
        code,
        description,
        category_id,
        units,
        stock,
        availableDate,
        defaultSupplier,
        sellDescription,
        sellConcept,
        purchaseConcept,
        purchaseTax_id,
        purchaseTaxed,
        purchaseWithholdings,
        tax_id,
        taxed,
        sellWithholdings,
        type_product
    }

    const maxStage = 3;

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
            {label:'Tipo de producto o servicio', value:type_product},
            {label:'Código', value:code},
            {label:'Nombre', value:name},
        ],
        1: [
            ...(inventariable ? [
                {label:'Unidades de medida', value:units},
                {label:'Stock inicial', value:stock},
                {label:'Stock mínimo', value:minStock},
                {label:'Stock máximo', value:maxStock}
            ] : [])
        ],
        2: [
            {label:'Concepto de compra', value:purchaseConcept},
            ...(purchaseTaxed ? [
                {label:'Impuesto asociado a la compra', value:purchaseTax_id}
            ] : [])
        ],
        3: [
            {label:'Concepto de venta', value:sellConcept},
            ...(taxed ? [
                {label:'Impuesto asociado a la venta', value:tax_id}
            ] : [])
        ]
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

    const getThirdParties = async()=>{
        let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
        let c = []
        res[1].forEach(element => {
            c.push({
                text:`${element.names} ${element.indentification_type}:${element.indentification_number}`,
                value:element.id
            })
        });
        setThirdParties(c)
    }

    const getAccounts = async()=>{
        let res = await postInfo('/getAccountsPlan',{
            company_id:appInfo.company_id,
            accountPlanId:appInfo.accountPlanId,
            accountPlanType:appInfo.accountPlanType
        })
        if(res[1][0]){
            let C = []
            res[1][1].forEach(element => {
                C.push({
                    text:`${element.code} - ${element.name}`,
                    value:element.id
                })
            });
            setAccounts(C)
        }
    }

    const getConcepts = async()=>{
        let res  = await postInfo('/getConcepts',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.name}`,
                    value:element.id,
                })
                setConcepts(C)
            });
        }
    }

    const formatTaxOption = (tax) => ({
        text: `${tax.name}${tax.rate != undefined ? ` - ${tax.rate}%` : ''}`,
        value: tax.tax_id
    });

    const sortTaxesByUse = (taxesList) => {
        const purchaseTaxOptions = [];
        const purchaseRetentionOptions = [];
        const sellTaxOptions = [];
        const sellRetentionOptions = [];

        taxesList.forEach((tax) => {
            const taxType = `${tax.tax_type ?? tax.type ?? ''}`.toLowerCase();
            const isRetention = tax.isRetention === true || tax.isRetention === 'true';
            const isPurchaseTax = taxType === 'purchase' || taxType === 'both';
            const isSellTax = taxType === 'sell' || taxType === 'both';
            const taxOption = formatTaxOption(tax);

            if (isRetention) {
                if (isPurchaseTax) {
                    purchaseRetentionOptions.push(taxOption);
                }
                if (isSellTax) {
                    sellRetentionOptions.push(taxOption);
                }
                return;
            }

            if (isPurchaseTax) {
                purchaseTaxOptions.push(taxOption);
            }
            if (isSellTax) {
                sellTaxOptions.push(taxOption);
            }
        });

        console.log('Impuestos compra ',purchaseTaxOptions);
        console.log('Impuestos compra retenciones ',purchaseRetentionOptions);
        console.log('Impuestos venta ',sellTaxOptions);
        console.log('Impuestos venta retenciones ',sellRetentionOptions);

        setPurchaseTaxes(purchaseTaxOptions);
        setPurchaseRetentionTaxes(purchaseRetentionOptions);
        setSellTaxes(sellTaxOptions);
        setSellRetentionTaxes(sellRetentionOptions);
    };

    const addTaxToList = (taxId, sourceList, selectedList, setSelectedList) => {
        if (taxId == undefined || taxId === '') {
            return;
        }

        const selectedTax = sourceList.find((tax) => tax.value == taxId);
        if (!selectedTax) {
            return;
        }

        const exists = selectedList.some((tax) => tax.value == selectedTax.value);
        setSelectedList(exists ? selectedList : [...selectedList, selectedTax]);
    };

    const removeTaxFromList = (taxValue, list, setList) => {
        setList(list.filter((selectedTax) => selectedTax.value != taxValue));
    };

    const getTaxes = async()=>{
        let res = await postInfo('/getTaxes',{
            company_id:appInfo.company_id,
        })
        console.log('Taxes aviable: ',res)
        if(res[0]){
            sortTaxesByUse(res[1]);
        }
    }

    const getCategories = async()=>{
        let res = await postInfo('/inventory/getCategories',{
            company_id:appInfo.company_id
        });
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.name}`,
                    value:element.id
                })
                setCategories(C)
            });
        }
    }

    const createProduct = async()=>{
        if(!validateFullForm()){
            return;
        }
        setDisabled(true);
        setLoading(true);
        console.log(formInfo)
        let res = await postInfo('/inventory/createProduct',formInfo);
        if(res){
            addNotification({
                type:'aproved',
                title:`Producto ${name} creado`,
                description:`El producto ${name} fue creado exitosamente`
            })
        }else{
            addNotification({
                type:'error',
                title:`Error al crear producto`,
                description:`Hubo un problema al crear el producto ${name}, intentelo de nuevo.`
            })
        }
        if(reloadFun != undefined){
            reloadFun();
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
    }

    const handlePrimaryAction = ()=>{
        if(stage < maxStage){
            if(validateStage(stage)){
                setStage(stage +1)
            }
            return;
        }

        createProduct();
    }

    const getRequierdData = async()=>{
        setDisabled(true);
        setLoading(true);
        await getThirdParties();
        await getCategories();
        await getAccounts();
        await getConcepts();
        await getTaxes();
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        if(type_product == 'service'){
            setStock(1);
            setUnits('unit');
        }
    },[type_product])

    useEffect(()=>{
        if(!taxed){
            setTax_id(undefined);
        }
    },[taxed])

    useEffect(()=>{
        if(!purchaseTaxed){
            setPurchaseTax_id(undefined);
        }
    },[purchaseTaxed])

    useEffect(()=>{
        getRequierdData();
    },[])

    useEffect(()=>{
        console.log(photo);
    },[photo])

    return(
        <div className="FormNewProduct" ref={formContainerRef}>
            {visibleError && (
                <div className="errorContainer">
                    <span>{error}</span>
                    <i title="Ocultar advertencia" className="fa-solid fa-xmark closeErrorBtn" onClick={()=>{
                        setVisibleError(false);
                    }}/>
                </div>
            )}
            <BoldTitle text={'Nuevo Producto'}/>
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                handlePrimaryAction();
            }}>
                {/* Stage for general info -- Etapa para configurar la info general*/}
                {stage == 0 && (
                    <section>
                        <div className="userPhoto">
                            <div className="actualPhoto">
                                <img src={photo} alt="" />
                            </div>
                            <FileInput action={setPhoto} placeholder={'Seleccionar nueva foto'}>
                                <i className="fa-solid fa-camera"/>
                            </FileInput>
                        </div>
                        {info.type == undefined && (
                            <SearchinList title={'Tipo de producto o servicio'} placeHolder={'Producto'} action={setType_product} list={[
                                {text:'Producto',value:'product'},
                                {text:'Servicio',value:'service'},
                                {text:'Consumo',value:'consume'},
                                {text:'Activo fijo',value:'fixed asset'},
                                {text:'Combo o Kit',value:'kit'}
                            ]}/>
                        )}
                        <FormInput title={'Código'} action={setCode} placeholder={'SKU#....'} value={code} disabled={disabled}/>
                        <FormInput title={'Nombre'} action={setName} placeholder={'Nombre de tu producto'} value={name} disabled={disabled}/>
                        <SearchinList title={'Categorias'} action={setCategory_id} placeHolder={'Seleccine una o varias'} list={categories} specialOption={
                            <NewElementSelect title={'Crear nueva categoría'} onClick={()=>{
                                popInAlert(<FormNewCategory/>)
                            }}/>
                        } disabled={disabled}/>
                        <FormInput title={'Descripción'} action={setDescription} value={description} placeholder={'Descripción del producto'} disabled={disabled} textArea={true}/>
                    </section>
                )}
                {/* Stage for Inventory -- Etapa para configurar Inventarios*/}
                {stage == 1 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'📦 Parametrización Inventario'} type={'suspended'}/>
                        </div>
                        <div className="accessSwitch">
                            <h6>Es Inventariable?</h6>
                            <SwitchOption action={setInventariable} defaultValue={inventariable}/>
                        </div>
                        {(inventariable) && (
                            <>
                                <SearchinList title={'Unidades de medida'} action={setUnits} placeHolder={'Seleccione unidad'} list={meassureUnits}/>
                                <FormInput title={'Stock inicial'} action={setStock} placeholder={'0 unidades'} value={stock} disabled={disabled}/>
                                <FormInput title={'Stock minimo'} action={setMinStock} placeholder={'0 unidades'} value={minStock} disabled={disabled}/>
                                <FormInput title={'Stock maximo'} action={setMaxStock} placeholder={'0 unidades'} value={maxStock} disabled={disabled}/>
                            </>
                        )}
                        <FormInput title={'Disponible a partir de'} action={setAvailableDate} value={availableDate} type={'date'} disabled={disabled}/>
                        <FormInput title={'Disponible hasta'} action={setAvailableDate} value={availableDate} type={'date'} disabled={disabled}/>
                    </section>
                )}
                {/* Stage for purchase -- Etapa para configurar la Compra*/}
                {stage == 2 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'📑 Parametrización Compras'} type={'suspended'}/>
                        </div>
                        <SearchinList title={'Proveedor por defecto'} action={setDefaultSupplier} placeHolder={'Seleccione el proveedor'} list={ThirdParties} disabled={disabled}/>  
                        <SearchinList title={'Concepto de compra'} action={setPurchaseConcept} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>  
                        <div className="accessSwitch">
                            <h6>Compra gravada con impuestos</h6>
                            <SwitchOption action={setPurchaseTaxed} defaultValue={purchaseTaxed}/>
                        </div>
                        {purchaseTaxed && (
                            <>
                                <SearchinList title={'Impuesto asociado a la compra'} action={setPurchaseTax_id} placeHolder={'Seleccione el impuesto'} list={purchaseTaxes} disabled={disabled}/>  
                                <div className="withholdingsContainer">
                                    <SearchinList
                                        title={'Retenciones de compra'}
                                        action={(taxId)=>{addTaxToList(taxId, purchaseRetentionTaxes, purchaseWithholdings, setPurchaseWithholdings)}}
                                        placeHolder={'Seleccione una retención'}
                                        list={purchaseRetentionTaxes}
                                        disabled={disabled}
                                        noActVal={true}
                                    />
                                    {purchaseWithholdings.map((tax)=>(
                                        <div className="selectedWithholding" key={tax.value} >
                                            <span className='withHoldingName'>
                                                {tax.text}
                                            </span>
                                            <i className="fa-solid fa-xmark deleteWithholding" onClick={()=>{
                                                removeTaxFromList(tax.value, purchaseWithholdings, setPurchaseWithholdings)
                                            }}/>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                )}
                {/* Stage for sell -- Etapa para configurar la venta*/}
                {stage == 3 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'💶 Parametrización Ventas'} type={'suspended'}/>
                        </div>
                        <SearchinList title={'Concepto de venta'} action={setSellConcept} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>  
                        <div className="accessSwitch">
                            <h6>Venta gravada con impuestos</h6>
                            <SwitchOption action={setTaxed} defaultValue={taxed}/>
                        </div>
                        {taxed && (
                            <>
                                <SearchinList title={'Impuesto asociado a la venta'} action={setTax_id} placeHolder={'Seleccione el impuesto'} list={sellTaxes} disabled={disabled}/>  
                                <div className="withholdingsContainer">
                                    <SearchinList
                                        title={'Retenciones de venta'}
                                        action={(taxId)=>{addTaxToList(taxId, sellRetentionTaxes, sellWithholdings, setSellWithholdings)}}
                                        placeHolder={'Seleccione una retención'}
                                        list={sellRetentionTaxes}
                                        disabled={disabled}
                                        noActVal={true}
                                    />
                                    {sellWithholdings.map((tax)=>(
                                        <div className="selectedWithholding" key={tax.value} >
                                            <span className='withHoldingName'>
                                                {tax.text}
                                            </span>
                                            <i className="fa-solid fa-xmark deleteWithholding" onClick={()=>{
                                                removeTaxFromList(tax.value, sellWithholdings, setSellWithholdings)
                                            }}/>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <FormInput title={'Descripción para la venta'} action={setSellDescription} value={sellDescription} placeholder={'Detalles del producto para la venta'} disabled={disabled} textArea={true}/>
                        
                    </section>
                )}

            <FormButton disabled={disabled} loading={loading} text={stage== maxStage? 'Crear Producto':'Siguiente'}/>
            {stage > 0 && (
                <FormButton disabled={disabled} loading={loading} negative={true} text={stage== maxStage? 'Cancelar':'Volver'} onClick={(e)=>{
                    e.preventDefault();
                    if(stage < maxStage){
                        setStage(stage -1)
                    }else{
                        setStage(0)
                    }
                }}/>
            )}
            </form>
        </div>
    )
}
