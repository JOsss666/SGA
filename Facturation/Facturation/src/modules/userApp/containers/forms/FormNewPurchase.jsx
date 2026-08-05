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
import { colombiaPurchaseRetentionHandler, moneyFormat, postInfo } from "../../../../utils/functions";
import { executeDocumentAction } from "../../../../utils/DocumentsControl";
import './FormNewCashRecipt.css'
import './FormNewPurchase.css'
import { SwitchOption } from "../../components/SwitchOption";
import { RetentionCard } from "../../components/RetentionCard";
import { CapsuleButtonAi } from "../../components/ChatAiComponents/CapsuleButtonAi";
import { AutoCompletePurchase } from "./AiAutoComplete/AutoCompletePurchase";

// JSON prefabricado con los campos EDITABLES del formulario de compra. Los valores
// derivados (impuestos, retenciones, totales) NO viven aquí: se recalculan aparte.
const createInitialPurchaseData = () => ({
    thirdParty_id:null,
    thirdPartyInfo:{},
    bussines_id:null,
    store_id:null,
    costCenter_id:null,
    concept_id:null,
    cashBox_id:null,
    shift_id:null,
    instance_id:null,
    step_id:null,
    status:'active',
    description:null,
    attached:'-',
    creditTerm:0,
    aplyRetentions:true,
    paymentMethod:[],
    items:[]
});

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

    // control
    const [error,setError] = useState(``);
    const [visibleError,setVisibleError] = useState(false);
    const [loading,setLoading] = useState();
    const [disabled,setDisabled] = useState();
    const [disabledToSubmit,setDisabledToSubmit] = useState(false);
    const [disabledByValue,setDisabledByValue] = useState(false);

    // form info — JSON prefabricado; solo se editan sus valores.
    const [formData,setFormData] = useState(() => ({
        ...createInitialPurchaseData(),
        ...(InfoParams ?? {})
    }));
    const {
        thirdParty_id,
        thirdPartyInfo,
        paymentMethod,
        bussines_id,
        store_id,
        costCenter_id,
        description,
        attached,
        instance_id,
        step_id,
        concept_id,
        cashBox_id,
        shift_id,
        status,
        creditTerm,
        aplyRetentions,
        items
    } = formData;

    // Setters sobre el JSON prefabricado.
    const updateField = (field,value) => setFormData(cur => ({...cur, [field]:value}));
    const updateFields = (fields) => setFormData(cur => ({...cur, ...fields}));
    const updateItems = (updater) => setFormData(cur => ({...cur, items:updater(cur.items)}));
    const updatePayments = (updater) => setFormData(cur => ({...cur, paymentMethod:updater(cur.paymentMethod)}));

    // Valores derivados / de control (no forman parte del JSON editable).
    const [total,setTotal] = useState(0);
        // Valor indicativo a pagar (items + impuestos)
        const [totalToPay,setTotalToPay] = useState(0);

    // Control para impuestos
    const [totalTaxes,setTotalTaxes] = useState(0);
    const [taxes,setTaxes] = useState([]);

    // Control para retenciones (opcionales, parametrizadas por concepto vía taxes.isRetention)
    const [availableRetentions,setAvailableRetentions] = useState([]);
    const [totalRetentions,setTotalRetentions] = useState(0);

    // Retenciones agrupadas calculadas por ítem (base gravable y total por retención,
    // sumando bases/totales cuando la misma retención aparece en varios ítems).
    const [aviableRetentions,setAviableRetentions] = useState([]);

    // Retenciones que el árbol de decisión (Colombia compra) determinó aplicar.
    const [withholdingsToAply,setWithholdingsToAply] = useState([]);

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
            const conceptAccess = userConfig.access.sections?.concepts;
            if(conceptAccess?.overAll === false && conceptAccess.enabled?.length === 1){
                const onlyConceptId = conceptAccess.enabled[0];
                updateField('concept_id',onlyConceptId);
                await getConceptRetentions(onlyConceptId);
            }

            // Filtro para busqueda de tiendas
            if(!userConfig.access.stores.overAll){
                if(userConfig.access.stores.enabled.length > 1){
                    await getStores(userConfig.access.stores.enabled);
                }else{
                    console.log('Tienda ya definida')
                    updateField('store_id',userConfig.access.stores.enabled[0])
                }
            }else{
                await getStores();
            }

            // Filtro para busqueda de negocios
            if(!userConfig.access.bussines.overAll){
                if(userConfig.access.bussines.enabled.length > 1){
                    await getBussines(userConfig.access.bussines.enabled)
                }else{
                    updateField('bussines_id',userConfig.access.bussines.enabled[0])
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
                    updateField('costCenter_id',userConfig.access.costCenters.enabled[0])
                }
            }else{
                await getCostCenters();
            }

            // Filtro para busqueda de Instancias de Procesos
            if(!userConfig.access.process_instances.overAll){
                if(userConfig.access.process_instances.enabled.length > 1){
                    await getInstances(userConfig.access.process_instances.enabled);
                }else{
                    updateField('instance_id',userConfig.access.process_instances.enabled[0])
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
            updateField('concept_id',element.id);
            getConceptRetentions(element.id);
        }
    }

    const handleThirdPartyChange = (element)=>{
        updateFields({thirdParty_id:element.id, thirdPartyInfo:element});
    }

    const handleCashBoxChange = (element)=>{
        if(element.id != undefined){
            updateFields({cashBox_id:element.id, shift_id:element.shift_id});
        }
    }

    const handleSelectInstance = (element) => {
        if (!element.id) return;
        updateFields({instance_id:element.id, step_id:element.step_id});
    };

    // Control de ítems de la compra

        const handleAddItem = (element) => {
            if(element.name == undefined) return;
            // El producto trae unit_cost y units como texto ("unit"): inicializamos
            // valores numéricos para que los cálculos de impuestos no den NaN.
            updateItems(prev => [...prev, {
                ...element,
                manualPrice:false,
                unit_value: Number(element.unit_cost) || 0,
                units: 1
            }]);
        };

        const handleEditItemDetail = (index, key, value) => {
            updateItems(prev =>
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
            updateItems(prev => prev.filter((_, idx) => idx !== index));
        };

        const handleAutoCompletePurchase = ({selectedThirdParty,items: mappedItems}) => {
            if(!selectedThirdParty) return;

            const onlyDigits = value => String(value ?? '').replace(/\D/g,'');
            const normalizeText = value => String(value ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g,'')
                .trim()
                .toLowerCase();
            const extractedIdentification = onlyDigits(selectedThirdParty.identificationNumber);
            const extractedMail = normalizeText(selectedThirdParty.mail);
            const supplierOption = suppliers.find(option => {
                const supplier = option?.value ?? option;
                const supplierIdentification = onlyDigits(supplier?.indentification_number);
                const supplierMail = normalizeText(supplier?.mail);
                const sameIdentification = extractedIdentification
                    && (
                        supplierIdentification === extractedIdentification
                        || supplierIdentification.slice(0,-1) === extractedIdentification
                        || extractedIdentification.slice(0,-1) === supplierIdentification
                    );
                const sameMail = extractedMail && supplierMail === extractedMail;
                return sameIdentification || sameMail;
            });
            const registeredThirdParty = supplierOption?.value ?? supplierOption;

            updateFields({
                thirdParty_id:registeredThirdParty?.id ?? registeredThirdParty?.thirdParty_id ?? null,
                thirdPartyInfo:registeredThirdParty ?? selectedThirdParty,
                items:mappedItems ?? []
            });

            if(!registeredThirdParty){
                addNotification({
                    type:'error',
                    title:'Proveedor sin relacionar',
                    description:'Los ítems fueron cargados, pero no se encontró el proveedor registrado por identificación o correo.'
                });
            }
        };

    // Getters de información

        const getDocumentRules = async()=>{
            let res = await postInfo('/getDocParams',{
                company_id:appInfo.company_id,
                docType:'Purchase Invoice'
            })
            console.log('Reglas compra: ',res);
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
                company_id:appInfo.company_id,
                allowedCashBoxes
            })
            if(res[0]){
                let C = [];
                res[1].forEach(element => {
                    C.push({
                        text:element.name,
                        value:element
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
            console.log('Res tiendas: ',res)
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
                        source: 'concept',
                        applied: aplyRetentions
                    }));
                // Conservamos las retenciones de los items: si la misma retención
                // viene por item y por concepto, gana la del item (más específica).
                setAvailableRetentions(prev => {
                    const itemRets = prev.filter(r => r.source === 'item');
                    const newOnes = rets.filter(r => !itemRets.some(i => i.id === r.id));
                    return [...itemRets, ...newOnes];
                });
            }else{
                setAvailableRetentions(prev => prev.filter(r => r.source === 'item'));
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
            let purchaseRelationsRes = await postInfo('/inventory/getPurchaseRelations',{
                company_id:appInfo.company_id
            });
            console.log('Servicios disponibles para compra: ',res)
            console.log('Relaciones para compra: ',purchaseRelationsRes)
            if(res[0]){
                const relationsByProduct = {};
                if(purchaseRelationsRes[0]){
                    purchaseRelationsRes[1].forEach(relation => {
                        relationsByProduct[relation.product_id] = relation;
                    });
                }

                let C = []
                res[1].forEach(element => {
                    const relations = relationsByProduct[element.id];
                    // purchase_taxes viene ordenado por priority: el primero es el principal.
                    const purchaseTax = relations?.purchase_taxes?.[0];
                    const item = {
                        ...element,
                        product_id: element.id,
                        tax_id: purchaseTax?.tax_id ?? null,
                        tax_name: purchaseTax?.tax_name ?? null,
                        tax_base: purchaseTax?.base ?? 0,
                        tax_rate: purchaseTax?.rate ?? 0,
                        tax_account: purchaseTax?.tax_account ?? null,
                        retentions: relations?.retentions ?? []
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
            console.log('Elemntos agregados con id: ',elements);
            const groupedTaxes = elements.reduce((acc, item) => {
                if (!item.tax_id) return acc;
                const itemTotal = parseFloat(item.unit_value) * parseFloat(item.units)
                const itemBase = (itemTotal/(1 + (item.tax_rate/100)))
                // Number(...) porque toFixed devuelve string y rompería la suma acumulada.
                const taxTotal = Number((itemBase * (item.tax_rate/100)).toFixed(2));
                if (!acc[item.tax_id]) {
                    acc[item.tax_id] = {
                        id: item.tax_id,
                        rate: item.tax_rate,
                        name: item.tax_name,
                        total: taxTotal,
                        account:item.tax_account,
                        retention:item.retention ? true:false
                    };
                } else {
                    acc[item.tax_id].total += taxTotal;
                }
                return acc;
            }, {});
            setTaxes(Object.values(groupedTaxes));
        };

        // Agrupa las retenciones de compra que traen los items (relaciones
        // purchase_withholding) y las expone como disponibles. Conserva las del
        // concepto y el estado applied que el usuario ya haya marcado.
        const handleRetentions = (elements) => {
            const groupedRetentions = elements.reduce((acc, item) => {
                (item.retentions ?? []).forEach(ret => {
                    if (!ret.tax_id || acc[ret.tax_id]) return;
                    acc[ret.tax_id] = {
                        id: ret.tax_id,
                        code: ret.tax_code,
                        name: ret.tax_name,
                        rate: parseFloat(ret.rate) || 0,
                        base: parseFloat(ret.base) || 0,
                        account_id: ret.tax_account,
                        source: 'item',
                        applied: aplyRetentions
                    };
                });
                return acc;
            }, {});

            setAvailableRetentions(prev => {
                const itemRets = Object.values(groupedRetentions);
                // Las del concepto sobreviven salvo que el item traiga la misma.
                const conceptRets = prev.filter(r =>
                    r.source !== 'item' && groupedRetentions[r.id] === undefined
                );
                return [...conceptRets, ...itemRets].map(ret => {
                    const existing = prev.find(p => p.id === ret.id);
                    return existing ? { ...ret, applied: existing.applied } : ret;
                });
            });
        };

        // Construye la lista de retenciones agrupadas calculando cada una sobre la
        // base gravable (neta) del ítem que la origina. Si una retención se repite
        // en varios ítems, acumula sus bases y sus totales en una sola entrada.
        const handleAviableRetentions = (elements) => {
            const grouped = elements.reduce((acc, item) => {
                // Base gravable del ítem: total del ítem descontando su propio impuesto.
                const itemTotal = parseFloat(item.unit_value || 0) * parseFloat(item.units || 0);
                const itemBase = itemTotal / (1 + (parseFloat(item.tax_rate || 0) / 100));

                (item.retentions ?? []).forEach(ret => {
                    if (!ret.tax_id) return;
                    const rate = parseFloat(ret.rate) || 0;
                    // Total de la retención para este ítem: base gravable * tasa.
                    const retTotal = Number((itemBase * (rate / 100)).toFixed(2));

                    if (!acc[ret.tax_id]) {
                        acc[ret.tax_id] = {
                            id: ret.tax_id,
                            code: ret.tax_code,
                            name: ret.tax_name,
                            rate,
                            account_id: ret.tax_account,
                            // Umbral (UVT) que trae el backend en taxes.base; se preserva aparte.
                            minimumBase: parseFloat(ret.base) || 0,
                            base: Number(itemBase.toFixed(2)),
                            total: retTotal,
                        };
                    } else {
                        // Misma retención en otro ítem: acumular base gravable y total.
                        acc[ret.tax_id].base = Number((acc[ret.tax_id].base + itemBase).toFixed(2));
                        acc[ret.tax_id].total = Number((acc[ret.tax_id].total + retTotal).toFixed(2));
                    }
                });
                return acc;
            }, {});

            const list = Object.values(grouped);
            setAviableRetentions(list);
            console.log('Retenciones agrupadas disponibles (aviableRetentions): ', list);
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

        // Switch maestro: aplica (o quita) todas las retenciones de una vez.
        const toggleAllRetentions = (value) => {
            updateField('aplyRetentions', value);
        };

        // Monto de una retención aplicada, redondeado a pesos (0 si no supera la base).
        const getRetentionAmount = (retention, subtotalNet) => {
            if (!retention.applied || subtotalNet < retention.base) return 0;
            return Math.round(subtotalNet * (retention.rate / 100));
        };

        const addPaymentMethod = (newPayment) => {
            if(newPayment.id != undefined){
                updatePayments(prev => [...prev, newPayment]);
            }
        };

        const removePaymentMethod = (id) => {
            updatePayments(prev => prev.filter(item => item.id !== id));
        };

        const setAplyVoucher = (id,value)=>{
            updatePayments(prev=>
                prev.map(item =>
                    item.id === id
                        ?{...item,["aplyVoucher"]:value}
                        :item
                )
            )
        }

        const updateVoucher = (id,voucher)=>{
            updatePayments(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, ["voucher"]: voucher }
                        : item
                )
            )
        }

        const updatePaymentValue = (id, key, newValue) => {
            updatePayments(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, [key]: newValue, autoGenerated:false }
                        : item
                )
            );
        };

        const getDefaultPayableMethod = () => {
            const option = paymentMehtods.find(methodOption => {
                const method = methodOption?.value ?? methodOption;
                return method.for_wallet === true
                    && method.name?.toUpperCase().includes('COMPRA');
            });
            return option?.value ?? option;
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
            // Se toman las que determinó el árbol de decisión (withholdingsToAply).
            if(aplyRetentions){
                withholdingsToAply.forEach(retention => {
                    const amount = Number(retention.total) || 0;
                    if(amount <= 0) return;
                    transactionDetails.push({
                        account_id:retention.account_id,
                        subtotal:amount,
                        total:amount,
                        type:'withholding',
                        nature:'CR',
                    });
                });
            }

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
        handleRetentions(items);
        handleAviableRetentions(items);
        setTotalToPay(itemsTotal);
    },[items])

    useEffect(()=>{
        let totalTax = 0;
        taxes.forEach(element => {
            totalTax += element.total;
        });
        setTotalTaxes(totalTax);
    },[taxes])

    // Total de retenciones = las que el árbol determinó aplicar (withholdingsToAply),
    // sujeto al switch maestro. Alimenta el neto a pagar y la validación de pagos.
    useEffect(()=>{
        const total = aplyRetentions
            ? withholdingsToAply.reduce((sum, r) => sum + (Number(r.total) || 0), 0)
            : 0;
        setTotalRetentions(total);
    },[withholdingsToAply,aplyRetentions])

    useEffect(()=>{
        calcTotalFromPayments();
    },[paymentMethod,totalToPay,totalRetentions])

    // Si la compra no tiene un medio de pago seleccionado, se asume a crédito.
    // El detalle for_wallet=true hace que el backend cree accounts_payable.
    useEffect(()=>{
        const netToPay = Math.max(0,totalToPay - totalRetentions);
        const defaultPayableMethod = getDefaultPayableMethod();

        if(items.length > 0 && paymentMethod.length === 0 && defaultPayableMethod && netToPay > 0){
            updatePayments(() => [{
                ...defaultPayableMethod,
                value:netToPay,
                autoGenerated:true
            }]);
            return;
        }

        if(paymentMethod.some(method => method.autoGenerated)){
            updatePayments(prev => prev.map(method => (
                method.autoGenerated
                    ? {...method,value:netToPay}
                    : method
            )));
        }
    },[items.length,paymentMethod.length,paymentMehtods,totalToPay,totalRetentions])

    useEffect(()=>{
        getDocumentRules();
        handleUserConfig();
        getProductsAndServices();
    },[])

    useEffect(()=>{
        console.log('Taxes list: ',taxes);
    },[taxes])

    // Ejecuta el árbol de decisión de retenciones de compra (Colombia) con las
    // retenciones ya agrupadas y muestra el resultado por consola.
    useEffect(()=>{
        const result = colombiaPurchaseRetentionHandler(
            thirdPartyInfo?.taxConfig,
            appInfo?.taxConfig,
            aviableRetentions,
            {
                minimumBase: 0, // valor fijo temporal (UVT global pendiente)
                municipalityCode: thirdPartyInfo?.municipality_code ?? null,
            }
        );
        setWithholdingsToAply(result);
        console.log('Resultado árbol de retenciones (Colombia compra): ', result);
    },[aviableRetentions,thirdPartyInfo])

    const hasSingleEnabledStore = userConfig.access?.stores?.overAll === false
        && userConfig.access.stores.enabled?.length === 1;
    const hasSingleEnabledBussines = userConfig.access?.bussines?.overAll === false
        && userConfig.access.bussines.enabled?.length === 1;
    const hasSingleEnabledCostCenter = userConfig.access?.costCenters?.overAll === false
        && userConfig.access.costCenters.enabled?.length === 1;
    const hasSingleEnabledConcept = userConfig.access?.sections?.concepts?.overAll === false
        && userConfig.access.sections.concepts.enabled?.length === 1;
    const hasSingleEnabledCashBox = userConfig.access?.sections?.cashBoxes?.overAll === false
        && userConfig.access.sections.cashBoxes.enabled?.length === 1;

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
                <CapsuleButtonAi onClick={()=>{
                    popInAlert(
                        <AutoCompletePurchase
                            thirdParties={suppliers}
                            onComplete={handleAutoCompletePurchase}
                        />
                    )
                }}>
                    <span>
                        Registrar con IA
                        <i className="fa-solid fa-flask"/>
                    </span>
                </CapsuleButtonAi>
            </div>
            {!loading && (
                <form action="" disabled={disabledToSubmit? true:disabled} onSubmit={(e)=>{
                    e.preventDefault();
                    validateDocument();
                }}>
                    {info.store_id == undefined && !hasSingleEnabledStore && (
                        <SearchinList value={store_id} action={(v)=>updateField('store_id',v)} title={'Tienda'} placeHolder={'Seleccione la tienda'} list={stores} disabled={disabled}/>
                    )}
                    {info.bussines_id == undefined && !hasSingleEnabledBussines && (
                        <SearchinList value={bussines_id} action={(v)=>updateField('bussines_id',v)} title={'Negocio'} placeHolder={'Seleccione el negocio'} list={bussines} disabled={disabled}/>
                    )}
                    {info.costCenter_id == undefined && !hasSingleEnabledCostCenter && (
                        <SearchinList value={costCenter_id} action={(v)=>updateField('costCenter_id',v)} title={'Centro de costo'} placeHolder={'Seleccione el centro de costo'} list={costCenters} disabled={disabled}/>
                    )}
                    <SearchinList value={thirdParty_id} action={handleThirdPartyChange} title={'Proveedor'} placeHolder={'Seleccione el proveedor'} list={suppliers} disabled={disabled} specialOption={
                        <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                            popInAlert(<FormNewThirdParties reloadFun={getSuppliers} quickCreation={true}/>)
                        }}/>
                    }/>
                    {info.instance_id == undefined && (
                        <SearchinList action={handleSelectInstance} noActVal={true} title={'Proceso adjunto'} placeHolder={'Seleccione el proceso (opcional)'} list={instances} disabled={disabled}/>
                    )}
                    {info.concept_id == undefined && !hasSingleEnabledConcept && (
                        <SearchinList value={concept_id} action={handleConceptChange} title={'Concepto'} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>
                    )}
                    {info.thirdPatyPurchaseTerm == undefined && (
                        <FormInput title={'Plazo pago (días)'} type={'number'} placeholder={'Plazo pago a proveedor en (días)'} min={0} required={false} value={creditTerm} action={(v)=>updateField('creditTerm',v)} disabled={disabled}/>
                    )}
                    {info.cashBox_id == undefined && !hasSingleEnabledCashBox && (
                        <SearchinList value={cashBox_id} action={handleCashBoxChange} title={'Caja'} placeHolder={'Seleccione la caja (si aplica pago en efectivo)'} list={cashBoxes} disabled={disabled}/>
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
                                        <input className="inputPaymentValue" step={0.001} type="number" placeholder="$0" value={element.value ?? ''} onChange={(e)=>{
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
                    <div className="withholdingsContainer">
                        <div className="headWithholding">
                            <h6>Resumen de la compra</h6>
                            <div className="controlRetentionsC">
                                <span>Desea aplicar las retenciones?</span>
                                <SwitchOption action={toggleAllRetentions} defaultValue={aplyRetentions}/>
                            </div>
                        </div>
                        <div className="subTotalContainer">
                            <span>Subtotal: </span>
                            <h6>$ {moneyFormat(totalToPay - totalTaxes)}</h6>
                        </div>
                        {(taxes.length > 0 || withholdingsToAply.length > 0) && (
                            <div className="bodyRetentions">
                                {taxes.filter(element => !element.retention).map((element,index)=>(
                                    <RetentionCard info={element} key={index}/>
                                ))}
                                {withholdingsToAply.map((retention)=>(
                                    <RetentionCard
                                        key={retention.id}
                                        aply={true}
                                        info={{
                                            name: retention.name,
                                            rate: retention.rate,
                                            total: retention.total,
                                            retention: true
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <div className="subTotalContainer">
                            <span>Valor total compra: </span>
                            <h6>$ {moneyFormat(totalToPay)}</h6>
                        </div>
                    </div>
                    <div className="footerDetailsContainer">
                        <FormInput title={'Descripción'} textArea={true} placeholder={'Añade una descripción a tu compra'} action={(v)=>updateField('description',v)} disabled={disabled}/>
                        <FileInput category="files" action={(v)=>updateField('attached',v)} placeholder={'Adjuntar soporte'} disabled={disabled} setDisabled={setDisabled} multiple={true}/>
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
