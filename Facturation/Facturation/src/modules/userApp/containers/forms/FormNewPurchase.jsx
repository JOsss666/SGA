import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { SearchinList } from "../../components/SearchInList";
import { FormInput } from "../../components/FormInput";
import { FileInput } from "../../components/FileInput";
import { FormButton } from "../../components/FormButton";
import { NewElementSelect } from "../../components/NewElementSelect";
import { UserCard } from "../../components/UserCard";
import { FormNewThirdParties } from "./FormNewThirdParties";
import { LoadingSpace } from "../LoadingSpace";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { executeDocumentAction } from "../../../../utils/DocumentsControl";
import './FormNewCashRecipt.css'
import './FormNewPurchase.css'

export function FormNewPurchase({InfoParams,reloadFun}){

    // Requirements
    const [docRules,setDocRules] = useState([]);
    const [info,setInfo] = useState(InfoParams != undefined? InfoParams:{})
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const {popOutAlert,popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const [suppliers,setSuppliers] = useState([]);
    const [paymentMehtods,setPaymentMethods] = useState([]);
    const [stores,setStores] = useState([]);
    const [bussines,setBussines] = useState([]);
    const [costCenters,setCostCenters] = useState([]);
    const [concepts,setConcepts] = useState([]);
    const [cashBoxes,setCashBoxes] = useState([]);
    const [instances,setInstances] = useState([]);
    const [productsAndServices,setProductsAndServices] = useState([]);
    const [items,setItems] = useState([]);

    // control
    const [error,setError] = useState(``);
    const [visibleError,setVisibleError] = useState(false);
    const [loading,setLoading] = useState();
    const [disabled,setDisabled] = useState();
    const [disabledToSubmit,setDisabledToSubmit] = useState(false);
    const [disabledByValue,setDisabledByValue] = useState(false);

    // form info
    const [thirdParty_id,setThirdParty_id] = useState();
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [paymentMethod,setPaymentMethod] = useState([]);
    const [bussines_id,setBussines_id] = useState();
    const [store_id,setStore_id] = useState();
    const [costCenter_id,setCostCenter_id] = useState();
    const [total,setTotal] = useState(0);
        // Valor indicativo a pagar (items + impuestos)
        const [totalToPay,setTotalToPay] = useState(0);
    const [description,setDescription] = useState();
    const [attached,setAttached] = useState('-');
        // Instancia de proceso (opcional)
        const [instance_id,setInstance_id] = useState();
        const [step_id,setStep_id] = useState();
    const [concept_id,setConcept_id] = useState();
    const [cashBox_id,setCashBox_id] = useState();
    const [shift_id,setShift_id] = useState();
    const [status,setStatus] = useState('active');
        // Plazo de crédito otorgado por el proveedor, en días (para compras a crédito)
        const [creditTerm,setCreditTerm] = useState(0);

    // Control para impuestos
    const [totalTaxes,setTotalTaxes] = useState(0);
    const [taxes,setTaxes] = useState([]);

    // Control para retenciones (opcionales, parametrizadas por concepto vía taxes.isRetention)
    const [availableRetentions,setAvailableRetentions] = useState([]);
    const [totalRetentions,setTotalRetentions] = useState(0);

    // Object FormInfo
    let FormInfo = {
        paymentMethod,
        store_id,
        costCenter_id,
        description,
        concept_id,
        company_id:appInfo.company_id,
        created_by:userInfo.user_id,
        thirdParty_id,
        thirdParty_name:thirdPartyInfo.names,
        bussines_id,
        doc_type:'Purchase Invoice',
        status,
        // Valor bruto del documento (items + IVA). El neto pagado al proveedor
        // (bruto - retenciones) se refleja en las patas de pago de la transacción.
        subTotal:totalToPay,
        total:totalToPay,
        attached,
        instance_id,
        step_id,
        cashBox_id
    }

    // PreProcess functions

    const formatCurrency = (value) =>
        new Intl.NumberFormat("es-CO").format(value);

    const addDaysToCurrentDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(days || 0));
        return date.toISOString().split('T')[0];
    };

    const handleUserConfig = async()=>{
        setDisabled(true)
        setLoading(true)
        await getSuppliers();
        await getConcepts();
        if(userConfig.access != undefined){
            // Filtro para busqueda de tiendas
            if(!userConfig.access.stores.overAll){
                if(userConfig.access.stores.enabled.length > 1){
                    await getStores(userConfig.access.stores.enabled);
                }else{
                    setStore_id(userConfig.access.stores.enabled[0])
                }
            }else{
                await getStores();
            }

            // Filtro para busqueda de negocios
            if(!userConfig.access.bussines.overAll){
                if(userConfig.access.bussines.enabled.length > 1){
                    await getBussines(userConfig.access.bussines.enabled)
                }else{
                    setBussines_id(userConfig.access.bussines.enabled[0])
                }
            }else{
                await getBussines();
            }

            // Filtro para busqueda de cajas
            if(!userConfig.access.sections.cashBoxes.overAll){
                await getCashBoxes(userConfig.access.sections.cashBoxes.enabled)
            }else{
                await getCashBoxes();
            }

            // Filtro para busqueda de Centros de costo
            if(!userConfig.access.costCenters.overAll){
                if(userConfig.access.costCenters.enabled.length > 1){
                    await getCostCenters(userConfig.access.costCenters.enabled)
                }else{
                    setCostCenter_id(userConfig.access.costCenters.enabled[0])
                }
            }else{
                await getCostCenters();
            }

            // Filtro para busqueda de Instancias de Procesos
            if(!userConfig.access.process_instances.overAll){
                if(userConfig.access.process_instances.enabled.length > 1){
                    await getInstances(userConfig.access.process_instances.enabled);
                }else{
                    setInstance_id(userConfig.access.process_instances.enabled[0])
                }
            }else{
                await getInstances()
            }
        }
        setLoading(false);
        setDisabled(false);
    }

    let handleConceptChange = (element)=>{
        if(element.id != undefined){
            setConcept_id(element.id);
            getConceptRetentions(element.id);
        }
    }

    const handleThirdPartyChange = (element)=>{
        setThirdParty_id(element.id);
        setThirdPartyInfo(element);
    }

    const handleCashBoxChange = (element)=>{
        if(element.id != undefined){
            setCashBox_id(element.id)
            setShift_id(element.shift_id)
        }
    }

    const handleSelectInstance = (element) => {
        if (!element.id) return;
        setInstance_id(element.id);
        setStep_id(element.step_id);
    };

    // Control de ítems de la compra

        const handleAddItem = (element) => {
            if(element.name == undefined) return;
            setItems(prev => [...prev, { ...element, manualPrice:false }]);
        };

        const handleEditItemDetail = (index, key, value) => {
            setItems(prev =>
                prev.map((item, idx) => {
                    if(idx !== index) return item;

                    let updatedValue = key === 'description' ? value : Number(value);
                    let updatedItem = { ...item, [key]: updatedValue };

                    if(key === 'unit_value'){
                        updatedItem.manualPrice = true;
                    }

                    return updatedItem;
                })
            );
        };

        const handleDeleteItem = (index) => {
            setItems(prev => prev.filter((_, idx) => idx !== index));
        };

    // Getters de información

        const getDocumentRules = async()=>{
            let res = await postInfo('/getDocParams',{
                company_id:appInfo.company_id,
                docType:'Purchase Invoice'
            })
            if(res.status == 'OK'){
                setDocRules(res.data);
            }
        }

        const getInstances = async(allowedInstances)=>{
            let res = await postInfo('/process/getProcessInstances',{
                company_id:appInfo.company_id,
                status:['active']
            })
            if(res[0]){
                let C = [];
                res[1].forEach(element => {
                    C.push({
                        text:`${element.process_code}#${element.ownSerial}`,
                        value:element
                    })
                });
                setInstances(C);
            }
        }

        const getCashBoxes = async(allowedCashBoxes)=>{
            let res = await postInfo('/facturation/getCashBoxes',{
                company_id:appInfo.company_id
            })
            if(res[0]){
                let C = [];
                res[1].forEach(element => {
                    C.push({
                        text:element.name,
                        value:element,
                        allowedCashBoxes:allowedCashBoxes
                    })
                });
                if(C.length == 1){
                    handleCashBoxChange(C[0].value);
                }
                setCashBoxes(C);
            }
        }

        const getStores = async(allowedStores)=>{
            let res = await postInfo('/getStores',{
                company_id:appInfo.company_id,
                allowedStores
            })
            console.log('Res')
            if(res[0]){
                let C = []
                res[1].forEach(element => {
                    C.push({
                        text:element.name,
                        value:element.id
                    })
                });
                setStores(C)
            }
        }

        const getBussines = async(allowedBussines)=>{
            let res = await postInfo('/getBussines',{
                company_id:appInfo.company_id,
                allowedBussines
            })
            if(res[0]){
                let C = []
                res[1].forEach(element => {
                    C.push({
                        text:element.name,
                        value:element.id
                    })
                });
                setBussines(C);
            }
        }

        const getCostCenters = async(allowedCostCenters)=>{
            let res = await postInfo('/getCostCenters',{
                company_id:appInfo.company_id,
                allowedCostCenters
            })
            if(res[0]){
                let C = []
                res[1].forEach(element => {
                    C.push({
                        text:element.name,
                        value:element.id
                    })
                });
                setCostCenters(C);
            }
        }

        const getConcepts = async()=>{
            let res = await postInfo('/getConcepts',{
                company_id:appInfo.company_id,
                typePlanAccount:appInfo.accountPlanType,
                allowedConcepts:userConfig.access.sections.concepts.overAll ? undefined:userConfig.access.sections.concepts.enabled
            })
            if(res[0]){
                let C = []
                res[1].forEach(element => {
                    C.push({
                        text:`SGA#${element.id} ${element.name}`,
                        value:element
                    })
                });
                setConcepts(C)
            }else{
                setConcepts([])
            }
        }

        // Trae las retenciones asociadas al concepto (taxes.isRetention = true).
        // La aplicación es opcional: se cargan disponibles y el usuario decide cuáles aplicar.
        const getConceptRetentions = async(conceptId)=>{
            let res = await postInfo('/getConceptTaxes',{
                concept_id:conceptId
            })
            if(res[0]){
                const rets = res[1]
                    .filter(t => t.isRetention === true)
                    .map(t => ({
                        id: t.tax_id,
                        code: t.code,
                        name: t.name,
                        rate: parseFloat(t.rate) || 0,
                        base: parseFloat(t.base) || 0,
                        account_id: t.account_id,
                        applied: false
                    }));
                setAvailableRetentions(rets);
            }else{
                setAvailableRetentions([]);
            }
        }

        const getPaymentMethods = async()=>{
            let res = await postInfo('/getPaymentMethods',{
                company_id:appInfo.company_id,
                for_wallet:undefined
            })
            console.log('PaymentMethods: ',res);
            if(res[0]){
                let C = []
                res[1].forEach(element => {
                    C.push({
                        text:element.name,
                        value:element
                    })
                });
                setPaymentMethods(C);
            }
        }

        const getSuppliers = async()=>{
            let res = await postInfo('/getThirdParties',{
                company_id:appInfo.company_id,
                comercialInfo:true
            });
            if(res[0]){
                let C = [];
                res[1].forEach(element => {
                    //if(element.type == 'supplier' || element.type == 'both'){
                    if(true){
                        C.push({
                            text:`${element.names}  ${element.indentification_type}_${element.indentification_number}`,
                            value:element
                        })
                    }
                });
                setSuppliers(C);
            }
        }

        const getProductsAndServices = async()=>{
            let res = await postInfo('/inventory/getProducts',{
                company_id:appInfo.company_id
            });
            let purchaseTaxesRes = await postInfo('/inventory/getProductTaxRelations',{
                company_id:appInfo.company_id,
                type:'purchase_tax'
            });
            console.log('Servicios disponibles para compra: ',res)
            if(res[0]){
                const purchaseTaxByProduct = {};
                if(purchaseTaxesRes[0]){
                    purchaseTaxesRes[1].forEach(relation => {
                        if(purchaseTaxByProduct[relation.product_id] == undefined){
                            purchaseTaxByProduct[relation.product_id] = relation;
                        }
                    });
                }

                let C = []
                res[1].forEach(element => {
                    const purchaseTax = purchaseTaxByProduct[element.id];
                    const item = {
                        ...element,
                        product_id: element.id,
                        tax_id: purchaseTax?.tax_id ?? null,
                        tax_name: purchaseTax?.tax_name ?? null,
                        tax_base: purchaseTax?.base ?? 0,
                        tax_rate: purchaseTax?.rate ?? 0,
                        tax_account: purchaseTax?.tax_account ?? null
                    };

                    C.push({
                        text:`${element.code} ${element.name}`,
                        value:item
                    })
                });
                setProductsAndServices(C)
            }else{
                setProductsAndServices([]);
            }
        }

    // Funciones de control

        const handleTaxes = (elements) => {
            const groupedTaxes = elements.reduce((acc, item) => {
                if (!item.tax_id) return acc;
                const itemTotal = parseFloat(item.unit_value) * parseFloat(item.units)
                const itemBase = (itemTotal/(1 + (item.tax_rate/100)))
                const taxTotal = itemBase * (item.tax_rate/100);
                if (!acc[item.tax_id]) {
                    acc[item.tax_id] = {
                        id: item.tax_id,
                        rate: item.tax_rate,
                        name: item.tax_name,
                        total: taxTotal,
                        account:item.tax_account
                    };
                } else {
                    acc[item.tax_id].total += taxTotal;
                }
                return acc;
            }, {});
            setTaxes(Object.values(groupedTaxes));
        };

        // Base de retención: subtotal neto del documento (antes de IVA).
        const getSubtotalNet = () => items.reduce((sum, item) => {
            const itemTotal = parseFloat(item.unit_value || 0) * parseFloat(item.units || 0);
            const rate = parseFloat(item.tax_rate || 0);
            return sum + itemTotal / (1 + rate / 100);
        }, 0);

        // Marca/desmarca una retención (aplicación opcional).
        const toggleRetention = (id) => {
            setAvailableRetentions(prev =>
                prev.map(r => r.id === id ? { ...r, applied: !r.applied } : r)
            );
        };

        // Monto de una retención aplicada, redondeado a pesos (0 si no supera la base).
        const getRetentionAmount = (retention, subtotalNet) => {
            if (!retention.applied || subtotalNet < retention.base) return 0;
            return Math.round(subtotalNet * (retention.rate / 100));
        };

        const addPaymentMethod = (newPayment) => {
            if(newPayment.id != undefined){
                setPaymentMethod(prev => [...prev, newPayment]);
            }
        };

        const removePaymentMethod = (id) => {
            setPaymentMethod(prev => prev.filter(item => item.id !== id));
        };

        const setAplyVoucher = (id,value)=>{
            setPaymentMethod(prev=>
                prev.map(item =>
                    item.id === id
                        ?{...item,["aplyVoucher"]:value}
                        :item
                )
            )
        }

        const updateVoucher = (id,voucher)=>{
            setPaymentMethod(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, ["voucher"]: voucher }
                        : item
                )
            )
        }

        const updatePaymentValue = (id, key, newValue) => {
            setPaymentMethod(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, [key]: newValue }
                        : item
                )
            );
        };

        const calcTotalFromPayments = ()=>{
            // Neto a pagar al proveedor = bruto (items + IVA) menos retenciones practicadas.
            const netToPay = totalToPay - totalRetentions;
            let newTTl = 0;
            if(paymentMethod.length == 0){
                if(netToPay == 0) return;
                setDisabledToSubmit(true);
                setDisabledByValue(true)
                return;
            }
            paymentMethod.forEach(element => {
                if(element.value != "" && element.value != undefined){
                    newTTl += parseFloat(element.value)
                }
            });
            if(Math.abs(newTTl - netToPay) > 0.9){
                setDisabledToSubmit(true);
                setDisabledByValue(true);
            }else{
                setDisabledToSubmit(false);
                setDisabledByValue(false);
            }
            setTotal(newTTl)
        }

        const buildPurchaseItemsPayload = () => items.map(item => ({
            product_id: item.product_id ?? item.id,
            units: item.units,
            unit_value: item.unit_value,
            total: parseFloat(item.units || 0) * parseFloat(item.unit_value || 0),
            description: item.description
        }));

        const buildTransactionDetails = () => {
            const transactionDetails = [];

            items.forEach(item => {
                const subtotal = parseFloat(item.units) * parseFloat(item.unit_value) / (1 + (parseFloat(item.tax_rate ?? 0) / 100));

                transactionDetails.push({
                    account_id:item.entry_account,
                    subtotal,
                    total:subtotal,
                    type:item.type == 'service'? 'serviceMovement':'inventoryMovement',
                    nature:'DB'
                });
            });

            taxes.forEach(tax => {
                transactionDetails.push({
                    account_id:tax.account,
                    subtotal:tax.total,
                    total:tax.total,
                    type:'tax',
                    nature:'DB',
                    cashBox_id,
                    shift_id,
                });
            });

            // Retenciones practicadas: crédito a la cuenta de retención por pagar.
            // Disminuyen el neto a pagar al proveedor manteniendo el documento cuadrado.
            const subtotalNet = getSubtotalNet();
            availableRetentions.forEach(retention => {
                const amount = getRetentionAmount(retention, subtotalNet);
                if(amount <= 0) return;
                transactionDetails.push({
                    account_id:retention.account_id,
                    subtotal:amount,
                    total:amount,
                    type:'withholding',
                    nature:'CR',
                });
            });

            paymentMethod.forEach(element => {
                transactionDetails.push({
                    account_id:element.account_id,
                    subtotal:element.value,
                    total:element.value,
                    type:'payment',
                    paymentMethod_id:element.id,
                    nature:'CR',
                    due_date:addDaysToCurrentDate(element.for_wallet ? creditTerm:0),
                    for_wallet:element.for_wallet,
                    voucher:element.voucher,
                    cashBox_id,
                    shift_id,
                });
            });

            return transactionDetails;
        };

        const buildPurchasePayload = () => ({
            ...FormInfo,
            user_id:userInfo.user_id,
            items:buildPurchaseItemsPayload(),
            transactionDetails:buildTransactionDetails()
        });

    // Función de creación

        const createPurchase = async()=>{
            setDisabled(true)
            setLoading(true)
            const purchasePayload = buildPurchasePayload();
            let res = await postInfo('/facturation/newPurchase',purchasePayload);
            console.log('Creation of Purchase: ',res)
            if(res.status !== "OK" || !Number.isFinite(Number(res.id))){
                addNotification({
                    type:'error',
                    title:`Error al crear la compra`,
                    description:res.message ?? `Error al crear la compra`
                });
                setLoading(false);
                setDisabled(false);
                return;
            }
            addNotification({
                type:'aproved',
                title:`Compra #${res.ownSerial} creada correctamente`,
                description:`La compra #${res.ownSerial} fue creada correctamente`
            })
            popOutAlert();
            setLoading(false);
            setDisabled(false);
            reloadFun?.();
        }

        // Contexto que consumen los handlers de reglas (validaciones).
        const buildValidationContext = () => ({
            ...FormInfo,
            lines: items,
            items,
            grossTotal: totalToPay,
            subtotalNet: getSubtotalNet(),
            taxesTotal: totalTaxes,
            retentionsTotal: totalRetentions,
            paymentsTotal: paymentMethod.reduce((sum, p) => sum + (parseFloat(p.value) || 0), 0)
        });

        const validateDocument = async () => {
            if (docRules.length === 0) {
                setDisabled(true);
                console.warn('Documento sin parametrizar');
                return;
            }
            setVisibleError(false);
            const context = buildValidationContext();
            // Honramos enabled/event/execution_order en cliente (getDocParams se deja intacto
            // para no alterar el comportamiento de otros documentos en producción).
            const orderedRules = [...docRules]
                .filter(rule => rule.enabled !== false && (rule.event === undefined || rule.event === 'POST'))
                .sort((a, b) => Number(a.execution_order) - Number(b.execution_order));
            for (const rule of orderedRules) {
                const res = await executeDocumentAction(rule.action, context);

                if (res.isValid === false) {
                    setError(`Error de validación: ${res.message}`);
                    setVisibleError(true);
                    return;
                }
            }
            createPurchase();
        };

    // Event listeners

    useEffect(()=>{
        if(thirdPartyInfo.id != undefined){
            getPaymentMethods();
        }
    },[thirdPartyInfo])

    useEffect(()=>{
        let itemsTotal = 0;
        items.forEach(item => {
            itemsTotal += (parseFloat(item.unit_value || 0) * parseFloat(item.units || 0));
        });
        handleTaxes(items);
        setTotalToPay(itemsTotal);
    },[items])

    useEffect(()=>{
        let totalTax = 0;
        taxes.forEach(element => {
            totalTax += element.total;
        });
        setTotalTaxes(totalTax);
    },[taxes])

    // Recalcula el total de retenciones ante cambios en ítems o en las retenciones marcadas.
    useEffect(()=>{
        const subtotalNet = getSubtotalNet();
        let total = 0;
        availableRetentions.forEach(retention => {
            total += getRetentionAmount(retention, subtotalNet);
        });
        setTotalRetentions(total);
    },[items,availableRetentions])

    useEffect(()=>{
        calcTotalFromPayments();
    },[paymentMethod,totalToPay,totalRetentions])

    useEffect(()=>{
        getDocumentRules();
        handleUserConfig();
        getProductsAndServices();
    },[])

    useEffect(()=>{
        console.log('PM list: ',paymentMehtods);
    },[paymentMehtods])

    return(
        <div className="FormNewCashRecipt FormNewPurchase">
            {visibleError && (
                <div className="errorContainer">
                    <span>{error}</span>
                    <i title="Ocultar advertencia" className="fa-solid fa-xmark closeErrorBtn" onClick={()=>{
                        setVisibleError(false);
                    }}/>
                </div>
            )}
            <div className="headForm">
                <BoldTitle text={thirdPartyInfo.id != undefined ? `Nueva compra a ${thirdPartyInfo.names}`:'Nueva compra'}>
                    <i className="fa-solid fa-cart-shopping"/>
                </BoldTitle>
                <div className="headerTotalsContainer">
                    <div className="valuesCashRecipt">
                        <h6 className="valueCashRecipt">Valor a pagar: $ {formatCurrency(totalToPay)}</h6>
                    </div>
                    {total > 0 && (
                        <div className="valuesCashRecipt">
                            <h6 className="valueCashRecipt">Valor pago: $ {formatCurrency(total)}</h6>
                        </div>
                    )}
                </div>
                <i className="fa-solid fa-xmark closeFormBtn" onClick={()=>{
                    popOutAlert();
                }}/>
            </div>
            {!loading && (
                <form action="" disabled={disabledToSubmit? true:disabled} onSubmit={(e)=>{
                    e.preventDefault();
                    validateDocument();
                }}>
                    {info.store_id == undefined && (
                        <SearchinList action={setStore_id} title={'Tienda'} placeHolder={'Seleccione la tienda'} list={stores} disabled={disabled}/>
                    )}
                    {info.bussines_id == undefined && (
                        <SearchinList action={setBussines_id} title={'Negocio'} placeHolder={'Seleccione el negocio'} list={bussines} disabled={disabled}/>
                    )}
                    {info.costCenter_id == undefined && (
                        <SearchinList action={setCostCenter_id} title={'Centro de costo'} placeHolder={'Seleccione el centro de costo'} list={costCenters} disabled={disabled}/>
                    )}
                    <SearchinList action={handleThirdPartyChange} title={'Proveedor'} placeHolder={'Seleccione el proveedor'} list={suppliers} disabled={disabled} specialOption={
                        <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                            popInAlert(<FormNewThirdParties reloadFun={getSuppliers} quickCreation={true}/>)
                        }}/>
                    }/>
                    {info.instance_id == undefined && (
                        <SearchinList action={handleSelectInstance} noActVal={true} title={'Proceso adjunto'} placeHolder={'Seleccione el proceso (opcional)'} list={instances} disabled={disabled}/>
                    )}
                    {info.concept_id == undefined && (
                        <SearchinList action={handleConceptChange} title={'Concepto'} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>
                    )}
                    {info.thirdPatyPurchaseTerm == undefined && (
                        <FormInput title={'Plazo pago (días)'} type={'number'} placeholder={'Plazo pago a proveedor en (días)'} min={0} required={false} value={creditTerm} action={setCreditTerm} disabled={disabled}/>
                    )}
                    {info.cashBox_id == undefined && (
                        <SearchinList action={handleCashBoxChange} title={'Caja'} placeHolder={'Seleccione la caja (si aplica pago en efectivo)'} list={cashBoxes} disabled={disabled}/>
                    )}
                    
                    <div className="gridItemsContainer">
                        <div className="itemBlock">
                            <div className="headBlock">
                                <strong>Ítems de la compra</strong>
                                <span>Total: $ {formatCurrency(totalToPay)}</span>
                            </div>
                            <div className="personalizaedView">
                                <SearchinList noActVal={true} list={productsAndServices} action={handleAddItem} placeHolder={'+ Agregar producto o servicio comprado'}/>
                            </div>
                            <div className="gridItems">
                                {items.map((element,index)=>(
                                    <div className="itemRow" key={index}>
                                        <UserCard imgSrc={element.img} name={element.name}/>
                                        <strong className="valueItemRow rowInputItem">
                                            <FormInput
                                                title={'Unidades'}
                                                type={'number'}
                                                min={0}
                                                required={true}
                                                value={element.units != undefined ? element.units: 0}
                                                placeholder={element.units != undefined ? element.units: 0}
                                                action={(value) => {
                                                    handleEditItemDetail(index, 'units', value);
                                                }}
                                            />
                                        </strong>
                                        <strong className="valueItemRow rowInputItem">
                                            <FormInput
                                                title={'Val unidad'}
                                                type={'number'}
                                                step={0.01}
                                                min={0}
                                                required={false}
                                                defaultValue={element.unit_value ?? 0}
                                                placeholder={element.unit_value ?? 0}
                                                disabled={disabled}
                                                action={(value) => {
                                                    handleEditItemDetail(index, 'unit_value', value);
                                                }}
                                            />
                                        </strong>
                                        <strong className="valueItemRow">Total: {moneyFormat(parseFloat(element.units||0)*parseFloat(element.unit_value||0))}</strong>
                                        <span className="quitContainer" onClick={()=>{
                                            handleDeleteItem(index)
                                        }}>
                                            <i className="fa-solid fa-trash"/>    
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                        </div>
                    </div>
                    {availableRetentions.length > 0 && (
                        <div className="retentionsContainer">
                            <strong>Retenciones (opcional)</strong>
                            <div className="gridRetentions">
                                {availableRetentions.map((retention)=>{
                                    const amount = getRetentionAmount(retention, getSubtotalNet());
                                    return(
                                        <label key={retention.id} className={`retentionRow ${retention.applied? 'retentionApplied':''}`}>
                                            <input
                                                type="checkbox"
                                                checked={retention.applied}
                                                disabled={disabled}
                                                onChange={()=>toggleRetention(retention.id)}
                                            />
                                            <span className="retentionName">{retention.code} · {retention.name} ({retention.rate}%)</span>
                                            <span className="retentionAmount">$ {formatCurrency(amount)}</span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    <div className="paymentMehtodsContainer">
                        <SearchinList disabled={disabled} action={addPaymentMethod} list={paymentMehtods} placeHolder={'Seleccione los metodos de pago'} title={'Metodos de pago'} noActVal={true}/>
                        <div className="gridPaymentMethods">
                            {disabledByValue && (
                                <span className="warnByValue">
                                    El valor ingresado es menor a el monto del documento,
                                    modifique el valor o agrege un metodo valido.
                                </span>
                            )}
                            {paymentMethod.map((element,index)=>(
                                <div key={index} className={`PaymentMethodCard ${disabledByValue? 'disabledPaymentMethodCard':''}`}>
                                    <div className="payMC">
                                        <strong>{element.name}</strong>
                                        <input className="inputPaymentValue" step={0.001} type="number" placeholder="$0" onChange={(e)=>{
                                            updatePaymentValue(element.id,"value",e.target.value)
                                        }}/>
                                        <i title={`Eliminar ${element.name}`} className="fa-solid fa-trash delPaymentBtn" onClick={()=>{
                                            removePaymentMethod(element.id)
                                        }}/>
                                    </div>
                                    {!element.aplyVoucher && (
                                        <button className="addVoucherToPayment" onClick={()=>{
                                            setAplyVoucher(element.id,true)
                                        }}>
                                            <i className="fa-solid fa-plus"/>
                                            Añadir voucher o referencia a {element.name}
                                        </button>
                                    )}
                                    {element.aplyVoucher && (
                                        <div className="voucherC">
                                            <strong>
                                                <i className="fa-solid fa-ticket"/>
                                                Voucher o referencia
                                            </strong>
                                            <input type="text" placeholder="Ej: AR23..." onChange={(e)=>{
                                                updateVoucher(element.id,e.target.value);
                                            }}/>
                                            <i title={`Eliminar voucher de ${element.name}`} className="fa-solid fa-trash delPaymentBtn" onClick={()=>{
                                                setAplyVoucher(element.id,false)
                                            }}/>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="footerDetailsContainer">
                        <FormInput title={'Descripción'} textArea={true} placeholder={'Añade una descripción a tu compra'} action={setDescription} disabled={disabled}/>
                        <FileInput action={setAttached} placeholder={'Adjuntar soporte'} disabled={disabled} setDisabled={setDisabled} multiple={true}/>
                        <FormButton className={disabledByValue? 'disabledByValueBtn':''} text={disabledByValue? 'El valor ingresado no es valido':'Crear compra'} disabled={disabledToSubmit? true:disabled} loading={loading}/>
                    </div>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'}/>
            )}
        </div>
    )
}
