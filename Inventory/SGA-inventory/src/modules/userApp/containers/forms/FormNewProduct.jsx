
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

export function FormNewProduct({info,update,reloadFun,forUpdate=false,productId}){

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
    const [originalCategoryIds,setOriginalCategoryIds] = useState([]);
    const [categoryChanged,setCategoryChanged] = useState(false);
    const [originalTaxConfig,setOriginalTaxConfig] = useState(null);
    const resolvedProductId = productId ?? info.id ?? info.product_id;
    const [productLoaded,setProductLoaded] = useState(!forUpdate);
    const [productLoadError,setProductLoadError] = useState('');

    // form info

        // Sec 0 --> General Info
        const [photo,setPhoto] = useState('https://cdnmain.sga360.co/Branding/LOGO%20SGA.png');
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
        category_id:forUpdate && !categoryChanged ? originalCategoryIds : category_id,
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

    const productTypeOptions = [
        {text:'Producto',value:'product'},
        {text:'Servicio',value:'service'},
        {text:'Consumo',value:'consume'},
        {text:'Activo fijo',value:'fixed asset'},
        {text:'Combo o Kit',value:'kit'}
    ];

    const getSelectedOption = (list,value)=>list.find(option => (
        String(option.value ?? option.text) === String(value)
    ));

    const toBoolean = (value,fallback=false)=>{
        if(value === true || value === 1 || value === 'true') return true;
        if(value === false || value === 0 || value === 'false') return false;
        return fallback;
    };

    const getCurrentTaxConfig = ()=>({
        purchaseTaxed,
        purchaseTaxId:Number(purchaseTax_id) || null,
        purchaseWithholdings:purchaseWithholdings.map(tax=>Number(tax.value ?? tax)).filter(Number.isFinite).sort((a,b)=>a-b),
        taxed,
        taxId:Number(tax_id) || null,
        sellWithholdings:sellWithholdings.map(tax=>Number(tax.value ?? tax)).filter(Number.isFinite).sort((a,b)=>a-b)
    });

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
            {label:'Unidades de medida', value:units},
            ...(inventariable ? [
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

        console.log('Total impuestos: ',taxesList);

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

    const loadProductInfo = async()=>{
        const id = Number(resolvedProductId);
        if(!Number.isSafeInteger(id) || id <= 0){
            throw new Error('No se recibió un ID válido del producto que se quiere editar.');
        }

        const [productResponse,taxRelationsResponse] = await Promise.all([
            postInfo('/inventory/getProducts',{company_id:appInfo.company_id,product_id:id}),
            postInfo('/inventory/getProductTaxRelations',{company_id:appInfo.company_id,product_id:id})
                .catch(error=>{
                    console.warn('No se pudieron cargar las relaciones de impuestos del producto:',error);
                    return [false,[]];
                })
        ]);
        if(productResponse?.[0] !== true){
            throw new Error(productResponse?.[1]?.message ?? 'No se pudo consultar la información del producto.');
        }
        const product = Array.isArray(productResponse?.[1])
            ? productResponse[1].find(item => Number(item.id) === id)
            : null;
        if(!product){
            throw new Error('No se encontró el producto solicitado en esta compañía.');
        }

        const taxRelations = Array.isArray(taxRelationsResponse?.[1]) ? taxRelationsResponse[1] : [];
        const relationTypeOf = relation => relation.relation_type ?? relation.type;
        const purchaseTaxRelations = taxRelations.filter(relation => relationTypeOf(relation) === 'purchase_tax');
        const purchaseWithholdingRelations = taxRelations.filter(relation => relationTypeOf(relation) === 'purchase_withholding');
        const sellTaxRelations = taxRelations.filter(relation => relationTypeOf(relation) === 'sell_tax');
        const sellWithholdingRelations = taxRelations.filter(relation => relationTypeOf(relation) === 'sell_withholding');
        const toTaxOption = relation => ({
            text:`${relation.tax_name ?? relation.tax_code ?? `Impuesto ${relation.tax_id}`}${relation.rate != null ? ` - ${relation.rate}%` : ''}`,
            value:relation.tax_id
        });

        setPhoto(product.img ?? product.photo ?? 'https://cdnmain.sga360.co/Branding/LOGO%20SGA.png');
        setType_product(product.type ?? product.type_product ?? 'product');
        setName(product.name ?? '');
        setCode(product.code ?? '');
        setDescription(product.description ?? '');
        const categoryIds = Array.isArray(product.category_ids) ? product.category_ids : [];
        const categoryId = categoryIds[0]
            ?? product.category_id
            ?? categories.find(category => product.categories?.includes(category.text))?.value;
        setCategory_id(categoryId);
        setOriginalCategoryIds(categoryIds.length > 0 ? categoryIds : categoryId != null ? [categoryId] : []);
        setCategoryChanged(false);
        setInventariable(toBoolean(product.inventariable ?? product.is_inventory ?? product.inventory_controlled));
        setUnits(product.units ?? 'unit');
        setStock(product.stock ?? 0);
        setMinStock(product.minStock ?? product.min_stock ?? 0);
        setMaxStock(product.maxStock ?? product.max_stock ?? 0);
        setAvailableDate(product.availableDate ?? product.available_date ?? '');
        setAviableUntil(product.aviableUnitl ?? product.available_until ?? product.aviable_until ?? '');
        setDefaultSupplier(product.defaultSupplier ?? product.default_supplier);
        setPurchaseConcept(product.entry_concept ?? product.purchaseConcept);
        const purchaseTaxedValue = purchaseTaxRelations.length > 0 || toBoolean(product.purchaseTaxed);
        const purchaseTaxIdValue = purchaseTaxRelations[0]?.tax_id ?? product.purchaseTax_id;
        const taxedValue = sellTaxRelations.length > 0 || toBoolean(product.taxed);
        const taxIdValue = sellTaxRelations[0]?.tax_id ?? product.tax_id;
        const purchaseWithholdingValues = purchaseWithholdingRelations.map(toTaxOption);
        const sellWithholdingValues = sellWithholdingRelations.map(toTaxOption);
        setPurchaseTaxed(purchaseTaxedValue);
        setPurchaseTax_id(purchaseTaxIdValue);
        setPurchaseWithholdings(purchaseWithholdingValues);
        setSellConcept(product.exit_concept ?? product.sellConcept);
        setTaxed(taxedValue);
        setTax_id(taxIdValue);
        setSellWithholdings(sellWithholdingValues);
        setSellDescription(product.sellDescription ?? product.sell_description ?? '');
        setOriginalTaxConfig({
            purchaseTaxed:purchaseTaxedValue,
            purchaseTaxId:Number(purchaseTaxIdValue) || null,
            purchaseWithholdings:purchaseWithholdingValues.map(tax=>Number(tax.value)).filter(Number.isFinite).sort((a,b)=>a-b),
            taxed:taxedValue,
            taxId:Number(taxIdValue) || null,
            sellWithholdings:sellWithholdingValues.map(tax=>Number(tax.value)).filter(Number.isFinite).sort((a,b)=>a-b)
        });
    };

    const createProduct = async()=>{
        if(!validateFullForm()){
            return;
        }
        setDisabled(true);
        setLoading(true);
        try{
            const payload = forUpdate ? {...formInfo,id:Number(resolvedProductId)} : formInfo;
            if(forUpdate){
                if(!categoryChanged){
                    delete payload.category_id;
                }
                if(JSON.stringify(getCurrentTaxConfig()) === JSON.stringify(originalTaxConfig)){
                    ['purchaseTax_id','purchaseTaxed','purchaseWithholdings','tax_id','taxed','sellWithholdings']
                        .forEach(field=>delete payload[field]);
                }
            }
            const res = await postInfo(forUpdate ? '/inventory/updateProduct' : '/inventory/createProduct',payload);
            if(res?.status !== 'OK' && res?.[0] !== true){
                throw new Error(res?.message ?? `No se pudo ${forUpdate ? 'actualizar' : 'crear'} el producto.`);
            }
            addNotification({
                type:'aproved',
                title:forUpdate ? `Producto ${name} actualizado` : `Producto ${name} creado`,
                description:forUpdate ? `El producto ${name} fue actualizado exitosamente.` : `El producto ${name} fue creado exitosamente.`
            });
            if(reloadFun != undefined){
                await reloadFun();
            }
            popOutAlert();
        }catch(error){
            addNotification({
                type:'error',
                title:`Error al ${forUpdate ? 'actualizar' : 'crear'} el producto`,
                description:error?.message ?? `Hubo un problema al ${forUpdate ? 'actualizar' : 'crear'} el producto ${name}.`
            });
            setError(error?.message ?? 'No se pudo guardar el producto.');
            setVisibleError(true);
        }finally{
            setLoading(false);
            setDisabled(false);
        }
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
        if(forUpdate){
            setProductLoaded(false);
            setProductLoadError('');
        }
        try{
            const optionResults = await Promise.allSettled([
                getThirdParties(),
                getCategories(),
                getAccounts(),
                getConcepts(),
                getTaxes()
            ]);
            const failedOptions = optionResults.find(result => result.status === 'rejected');
            if(failedOptions && !forUpdate){
                throw failedOptions.reason;
            }
            if(forUpdate){
                await loadProductInfo();
            }
        }catch(loadError){
            if(forUpdate){
                setProductLoadError(loadError?.message ?? 'No se pudo cargar el producto.');
                setVisibleError(true);
            }else{
                addNotification({
                    type:'error',
                    title:'No se pudieron cargar las opciones del producto',
                    description:loadError?.message ?? 'Vuelve a intentarlo.'
                });
            }
        }finally{
            setProductLoaded(true);
            setLoading(false);
            setDisabled(false);
        }
    }

    useEffect(()=>{
        if(!forUpdate && type_product == 'service'){
            setStock(1);
            setUnits('unit');
        }
    },[type_product,forUpdate])

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
    },[forUpdate,resolvedProductId])

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
            <BoldTitle text={forUpdate ? 'Editar Producto' : 'Nuevo Producto'}/>
            {forUpdate && !productLoaded ? (
                <div className="productLoadStatus" role="status">Cargando información del producto…</div>
            ) : productLoadError ? (
                <div className="errorContainer" role="alert">
                    <span>{productLoadError}</span>
                </div>
            ) : <form action="" onSubmit={(e)=>{
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
                        {(forUpdate || info.type == undefined) && (
                            <SearchinList title={'Tipo de producto o servicio'} placeHolder={'Producto'} action={setType_product} list={productTypeOptions} defaultValue={getSelectedOption(productTypeOptions,type_product)} disabled={disabled}/>
                        )}
                        <FormInput title={'Código'} action={setCode} placeholder={'SKU#....'} value={code} disabled={disabled}/>
                        <FormInput title={'Nombre'} action={setName} placeholder={'Nombre de tu producto'} value={name} disabled={disabled}/>
                        <SearchinList title={'Categorias'} action={(value)=>{
                            setCategory_id(value);
                            if(forUpdate) setCategoryChanged(true);
                        }} placeHolder={'Seleccine una o varias'} list={categories} specialOption={
                            <NewElementSelect title={'Crear nueva categoría'} onClick={()=>{
                                popInAlert(<FormNewCategory/>)
                            }}/>
                        } disabled={disabled} defaultValue={getSelectedOption(categories,category_id)}/>
                        <FormInput title={'Descripción'} action={setDescription} value={description} placeholder={'Descripción del producto'} disabled={disabled} textArea={true}/>
                    </section>
                )}
                {/* Stage for Inventory -- Etapa para configurar Inventarios*/}
                {stage == 1 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'📦 Parametrización Inventario'} type={'suspended'}/>
                        </div>
                        <SearchinList title={'Unidades de medida'} action={setUnits} placeHolder={'Seleccione unidad'} list={meassureUnits} disabled={disabled} defaultValue={getSelectedOption(meassureUnits,units)}/>
                        <div className="accessSwitch">
                            <h6>Es Inventariable?</h6>
                            <SwitchOption action={setInventariable} value={inventariable} disabled={disabled}/>
                        </div>
                        {(inventariable) && (
                            <>
                                <FormInput title={'Stock inicial'} action={setStock} placeholder={'0 unidades'} value={stock} disabled={disabled}/>
                                <FormInput title={'Stock minimo'} action={setMinStock} placeholder={'0 unidades'} value={minStock} disabled={disabled}/>
                                <FormInput title={'Stock maximo'} action={setMaxStock} placeholder={'0 unidades'} value={maxStock} disabled={disabled}/>
                            </>
                        )}
                        <FormInput title={'Disponible a partir de'} action={setAvailableDate} value={availableDate} type={'date'} disabled={disabled}/>
                        <FormInput title={'Disponible hasta'} action={setAviableUntil} value={aviableUnitl} type={'date'} disabled={disabled}/>
                    </section>
                )}
                {/* Stage for purchase -- Etapa para configurar la Compra*/}
                {stage == 2 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'📑 Parametrización Compras'} type={'suspended'}/>
                        </div>
                        <SearchinList title={'Proveedor por defecto'} action={setDefaultSupplier} placeHolder={'Seleccione el proveedor'} list={ThirdParties} disabled={disabled} defaultValue={getSelectedOption(ThirdParties,defaultSupplier)}/>
                        <SearchinList title={'Concepto de compra'} action={setPurchaseConcept} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled} defaultValue={getSelectedOption(concepts,purchaseConcept)}/>
                        <div className="accessSwitch">
                            <h6>Compra gravada con impuestos</h6>
                            <SwitchOption action={setPurchaseTaxed} value={purchaseTaxed} disabled={disabled}/>
                        </div>
                        {purchaseTaxed && (
                            <SearchinList title={'Impuesto asociado a la compra'} action={setPurchaseTax_id} placeHolder={'Seleccione el impuesto'} list={purchaseTaxes} disabled={disabled} defaultValue={getSelectedOption(purchaseTaxes,purchaseTax_id)}/>
                        )}
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
                                    <span className='withHoldingName'>{tax.text}</span>
                                    <i className="fa-solid fa-xmark deleteWithholding" onClick={()=>{
                                        if(!disabled) removeTaxFromList(tax.value, purchaseWithholdings, setPurchaseWithholdings)
                                    }}/>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {/* Stage for sell -- Etapa para configurar la venta*/}
                {stage == 3 && (
                    <section>
                        <div className="tagSection">
                            <TagIndicator title={'💶 Parametrización Ventas'} type={'suspended'}/>
                        </div>
                        <SearchinList title={'Concepto de venta'} action={setSellConcept} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled} defaultValue={getSelectedOption(concepts,sellConcept)}/>
                        <div className="accessSwitch">
                            <h6>Venta gravada con impuestos</h6>
                            <SwitchOption action={setTaxed} value={taxed} disabled={disabled}/>
                        </div>
                        {taxed && (
                            <SearchinList title={'Impuesto asociado a la venta'} action={setTax_id} placeHolder={'Seleccione el impuesto'} list={sellTaxes} disabled={disabled} defaultValue={getSelectedOption(sellTaxes,tax_id)}/>
                        )}
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
                                    <span className='withHoldingName'>{tax.text}</span>
                                    <i className="fa-solid fa-xmark deleteWithholding" onClick={()=>{
                                        if(!disabled) removeTaxFromList(tax.value, sellWithholdings, setSellWithholdings)
                                    }}/>
                                </div>
                            ))}
                        </div>
                        <FormInput title={'Descripción para la venta'} action={setSellDescription} value={sellDescription} placeholder={'Detalles del producto para la venta'} disabled={disabled} textArea={true}/>

                    </section>
                )}

            <FormButton disabled={disabled} loading={loading} text={stage== maxStage ? (forUpdate ? 'Guardar cambios' : 'Crear Producto') : 'Siguiente'}/>
            {stage > 0 && (
                <FormButton disabled={disabled} loading={loading} negative={true} text={stage== maxStage? 'Cancelar':'Volver'} onClick={(e)=>{
                    e.preventDefault();
                    if(stage < maxStage){
                        setStage(stage -1)
                    }else if(forUpdate){
                        popOutAlert();
                    }else{
                        setStage(0)
                    }
                }}/>
            )}
            </form>}
        </div>
    )
}
