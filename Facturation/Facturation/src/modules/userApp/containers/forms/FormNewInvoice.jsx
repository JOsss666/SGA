import { useEffect, useEffectEvent, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { SearchinList } from "../../components/SearchInList";
import { FormInput } from "../../components/FormInput";
import { InputFiles } from "../../components/InputFiles";
import { FormButton } from "../../components/FormButton";
import './FormNewCashRecipt.css'
import './FormNewInvoice.css'
import { FileInput } from "../../components/FileInput";
import { LoadingSpace } from "../LoadingSpace";
import { moneyFormat, newElectronicInvoide, postInfo, printCashRecipt, printSellInvoice } from "../../../../utils/functions";
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormNewThirdParties } from "./FormNewThirdParties";
import { ProcessStatusAlert } from "../Alerts/ProcessStatusAlert";
import { isElectron, urlSer } from "../../../../App";
import { LabelValue } from "../../components/LabelValue";
import { SwitchOption } from "../../components/SwitchOption";
import { UserCard } from "../../components/UserCard";
import { executeDocumentAction } from "../../../../utils/DocumentsControl";

export function FormNewInvoice({InfoParams,reloadFun,process_instance_id}){

    // Requieremnets
    const [docRules,setDocRules] = useState([]);
    const [info,setInfo] = useState(InfoParams != undefined? InfoParams:{})
    const {appInfo,userInfo,userConfig, appConfig} = useAppInfo();
    const {popOutAlert,popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const [instances,setInstances] = useState([]);
    const [thirdparties,setThirdParties] = useState([]);
    const [paymentMehtods,setPaymentMethods] = useState([]);
    const [stores,setStores] = useState([]);
    const [bussines,setBussines] = useState([]);
    const [costCenters,setCostCenters] = useState([]);
    const [concepts,setConcepts] = useState([]);
    const [documents,setDocuments] = useState([{
        docInfo:{},
        items:[]
    }]);
    const [productsAndServices,setProductsAndServices] = useState([]);
    const [cashBoxes,setCashBoxes] = useState([]);
        // BirefCase Bills requirements
        const [briefCaseBills,setBriefCaseBills] = useState([]);

    // control
    const [error,setError] = useState(``);
    const [visibleError,setVisibleError] = useState(false);
    const [mode,setMode] = useState('process_instance');
    const [loading,setLoading] = useState();
    const [disabled,setDisabled] = useState();
    const [disabledToSubmit,setDisabledToSubmit] = useState(false);
    const [disabledByValue,setDisabledByValue] = useState(false);
        // control of credit conditions of thirdParty
        const [ableCredit,setAbleCredit] = useState(false);
        const [aviableCredit,setAviableCredit] = useState(0);
        // Control of the conditions of the document
        const [documentNature,setDocumentNature] = useState('DB');
        // Control of electronic facturation
        const [e_invoice,setE_invoice] = useState(true);
        // Control of ITEMS Blocks
        const [itemBlocks,setItemBlocks] = useState([{items:[]}]);
    
    // form info
    const [thirdParty_id,setThirdParty_id] = useState();
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [paymentMethod,setPaymentMethod] = useState([]);
    const [bussines_id,setBussines_id] = useState();
    const [store_id,setStore_id] = useState();
    const [costCenter_id,setCostCenter_id] = useState();
    const [paymentMethod_code, setPaymentMethod_code] = useState();
    const [total,setTotal] = useState(0);
        // Valor indicativo d a pagar
        const [totalToPay,setTotalToPay] = useState(0);
    const [description,setDescription] = useState();
    const [attached,setAttached] = useState('-');
        // Instances control
        const [instance_id,setInstance_id] = useState([]);
        const [selectedInstances, setSelectedInstances] = useState([]);
        const [instanceOwnSerial,setInstanceOwnSerial] = useState();
        const [step_id,setStep_id] = useState();
    const [concept_id,setConcept_id] = useState();
    const [conceptAccount_id,setConcept_account_id] = useState();
    const [cashBox_id,setCashBox_id] = useState();
    const [shift_id,setShift_id] = useState();
    const [status,setStatus] = useState('active');


    // Control to print
    const [totalTaxes,setTotalTaxes] = useState(0);
    const [attachedItems,setAttachedItems] = useState([]);
    const [taxes,setTaxes] = useState([]);
    const [electronicInfo,setElectronicInfo] = useState({});

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
        doc_type:'Sell Invoice',
        status,
        subTotal:total,
        total,
        attached,
        instance_id,
        instanceOwnSerial,
        step_id,
        payedBills:briefCaseBills,
        cashBox_id,
        instances: selectedInstances,
        paymentMethod_code
    }

    // PreProcess functions

    const formatCurrency = (value) =>
            new Intl.NumberFormat("es-CO").format(value);

    const formatDate = (date)=>{
        if(date != undefined){
            let x = date.split('T');
            let newDate = `${x[0]}`;
            return newDate;
        }
        return `--/--/--`
    }

    const addDaysToCurrentDate = (days) => {
        const date = new Date(); // Obtiene la fecha y hora actual del sistema  
        // Sumamos los días usando setDate y getDate para manejar cambios de mes/año automáticamente
        date.setDate(date.getDate() + parseInt(days)); 
        // Retornamos en formato ISO (YYYY-MM-DD) 
        return date.toISOString().split('T')[0];
    };

    const handleUserConfig = async()=>{
        console.log(appConfig.access)
        setDisabled(true)
        setLoading(true)
        await getThirdParties();
        await getConcepts();
        let temInfo = {}
        if(userConfig.access != undefined){
            console.log(userConfig.access)
            // Filtro para busqueda de tiendas
            if(!userConfig.access.stores.overAll){
                if(userConfig.access.stores.enabled.length > 1){
                    // GetStores con filtro
                    await getStores(userConfig.access.stores.enabled);
                }else{
                    temInfo.store_id = userConfig.access.stores.enabled[0]
                    setStore_id(userConfig.access.stores.enabled[0])
                }
            }else{
                // GetStores sin filtro
                await getStores();
            }

            // Filtro para busqueda de negocios
            if(!userConfig.access.bussines.overAll){
                if(userConfig.access.bussines.enabled.length > 1){
                    //GetBussines con filtro
                    await getBussines(userConfig.access.bussines.enabled)
                }else{
                    temInfo.bussines_id = userConfig.access.bussines.enabled[0]
                    setBussines_id(userConfig.access.bussines.enabled[0])
                }
            }else{
                // GetBussines sin filtro
                await getBussines();
            }

            if(userConfig.access.sections.cashBoxes.overAll){
                if(userConfig.access.bussines.enabled.length > 1){
                    //getCashBoxes con filtro
                    await getCashBoxes(userConfig.access.sections.cashBoxes.enabled)
                }else{
                    temInfo.cashBox_id = userConfig.access.sections.cashBoxes.enabled[0]
                    setBussines_id(userConfig.access.sections.cashBoxes.enabled[0])
                    getCashBoxes(userConfig.access.sections.cashBoxes.enabled)
                }
            }else{
                await getCashBoxes();
            }

            // Filtro para busqueda de Centros de costo
            if(!userConfig.access.costCenters.overAll){
                if(userConfig.access.costCenters.enabled.length > 1){
                    //GetCostCenters con filtro
                    await getCostCenters(userConfig.access.costCenters.enabled)
                }else{
                    temInfo.costCenter_id = userConfig.access.costCenters.enabled[0]
                    setCostCenter_id(userConfig.access.costCenters.enabled[0])
                }
            }else{
                // GetCostCenterSinFiltro
                await getCostCenters();
            }

            // Filtro para busqueda de Instancias de Procesos
            if(!userConfig.access.process_instances.overAll){
                if(userConfig.access.process_instances.enabled.length > 1){
                    await getInstances(userConfig.access.process_instances.enabled,undefined);
                }else{
                    temInfo.instance_id = userConfig.access.process_instances.enabled[0]
                    setInstance_id(userConfig.access.process_instances.enabled[0])
                }
            }else{
                await getInstances()
            }

        }
        
        if(temInfo != {}){
            console.log(temInfo);
            setInfo(temInfo);
        }
        setLoading(false);
        setDisabled(false);
    }

    // Processes Instances Control
        const handleAddInstanceID = (element) => {
            if (!element.id) return;
            if (selectedInstances.some(item => item.id === element.id)) return;
            setSelectedInstances(prev => [...prev, { 
                id: element.id, 
                step_id: element.step_id,
                ownSerial: element.ownSerial,
            }]);
        };
        
        const handleDeleteInstanceID = (id) => {
            setSelectedInstances(prev => prev.filter(item => item.id !== id));
        };

    let handleConceptChange = (element)=>{
        if(element.id != undefined){
            setConcept_id(element.id);
            setConcept_account_id(element.account_id);
            if(element.for_wallet){
                setMode('briefcase_payment')
                getBriefcasesBills();
            }else{
                setMode('process_instance')
                setBriefCaseBills([]);
            }

            if(element.for_cashExit){
                setDocumentNature('CR');
            }
        }
    }

    const handleThirdPartyChange = (element)=>{
        console.log(element);
        setThirdParty_id(element.id);
        setThirdPartyInfo(element);
    }

    const handleCashBoxChange = (element)=>{
        console.log('zzzzz ',element)
        if(element.id != undefined){
            console.log('Elemento actualizado correctamente')
            setCashBox_id(element.id)
            setShift_id(element.shift_id)
        }
    }

    // Getters of info

    const handleSelectInstance = (element) => {
        if (!element.id) return;
        
        handleAddInstanceID(element);
        
        // Sincronización de otros estados dependientes
        setStep_id(element.step_id);
        setInstanceOwnSerial(element.ownSerial);
        setThirdParty_id(element.thirdParty_id);
        
        if (element.id) {
            getDocuments(element.id);
        }
        calcTotalFromPayments();
    };

    // Control of Products and services in ITEM blocks

        const handleAddBlock = (newDocInfo = undefined) => {
            // 1. Definimos la estructura base de un bloque nuevo
            const newBlock = {
                docInfo: newDocInfo.docInfo, // Si no se pasa nada, será undefined (bloque manual)
                items: newDocInfo? newDocInfo.items:[],           // Siempre inicia con la lista de productos vacía
                aplyVoucher: false    // O cualquier otra propiedad por defecto que uses
            };

            // 2. Actualizamos el estado añadiendo el nuevo bloque al arreglo anterior
            setItemBlocks(prev => [...prev, newBlock]);
        };

        const handleAddProductAndService = async (element) => {
            if(element.name == undefined)return;
            setItemBlocks(prev =>
                prev.map((block, index) =>
                    index === 0
                        ? { 
                            ...block, 
                            items: [...block.items, element] // Copia los items actuales y añade el nuevo
                        }
                        : block // Mantiene los demás bloques sin cambios
                )
            );
        };

        const handleDeleteBlock = (blockIndex) => {
            const block = itemBlocks[blockIndex];
            if (block && block.docInfo && block.docInfo.instance_id) {
                handleDeleteInstanceID(block.docInfo.instance_id);
            }
            setItemBlocks(prev => {
                // 1. Buscamos el bloque que el usuario quiere "eliminar"
                const blockToProcess = prev[blockIndex];
                // Si por alguna razón el índice no existe, retornamos el estado actual
                if (!blockToProcess) return prev;

                // 2. Aplicamos tu lógica condicional:
                // Si docInfo es undefined (Bloque manual/vacío), solo limpiamos los items
                if (blockToProcess.docInfo === undefined) {
                    return prev.map((block, index) => 
                        index === blockIndex 
                            ? { ...block, items: [] } // Vaciamos el arreglo de ítems
                            : block
                    );
                } 

                // 3. Si docInfo tiene contenido (Viene de una Orden/Documento), eliminamos el bloque
                return prev.filter((_, index) => index !== blockIndex);
            });
        };

        const handleEditItemDetail = (blockIndex, itemIndex, key, value) => {
            setItemBlocks(prev =>
                prev.map((block, bIdx) => {
                    if (bIdx !== blockIndex) return block;

                    const updatedItems = block.items.map((item, iIdx) => {
                        if (iIdx !== itemIndex) return item;
                        let updatedItem = { ...item, [key]: value };
                        if (key === 'units') {
                            const newPrice = getEffectivePrice(item, value);
                            updatedItem.unit_value = newPrice;
                        }
                        console.log(updatedItem)
                        return updatedItem;
                    });

                    return { ...block, items: updatedItems };
                })
            );
        };

    const handleDeleteItem = (blockIndex, itemIndex) => {
        setItemBlocks(prev =>
            prev.map((block, bIdx) => {
                // 1. Si no es el bloque que buscamos, lo dejamos tal cual
                if (bIdx !== blockIndex) return block;

                // 2. Si es el bloque, filtramos su lista de ítems
                const filteredItems = block.items.filter((_, iIdx) => iIdx !== itemIndex);

                // 3. Retornamos el bloque actualizado con la nueva lista de ítems
                return { ...block, items: filteredItems };
            })
        );
    };

    const handleAddDocument = async(element)=>{
        let attachedItems = await getAttachedServices(element.id);
        if(element.instance_id != undefined){
            handleAddInstanceID(element.instance_id);
        }
        handleAddBlock({
            docInfo: element,
            items: attachedItems
        });
    }

    // Getters of info

        // Get Document Rules
        const getDocumentRules = async()=>{
            let res = await postInfo('/getDocParams',{
                company_id:appInfo.company_id,
                docType:'Sell Invoice'
            })
            if(res.status == 'OK'){
                setDocRules(res.data);
            }
        }

    const getInstances = async(allowedInstances,allowedTypes)=>{
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            status:['active'],
            thirdParty_id
        })
        console.log(res);
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
            //user_id:userInfo.user_id
        })
        console.log(res);
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                console.log(element);
                C.push({
                    text:element.name,
                    value:element,
                    allowedCashBoxes:allowedCashBoxes
                })
            });
            console.log(C)
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
                    setBussines(C);
                });
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
                setCostCenters(C);
            });
            
        }
    }
    
    const getConcepts = async()=>{
        let res = await postInfo('/getConcepts',{
            company_id:appInfo.company_id,
            typePlanAccount:appInfo.accountPlanType,
            allowedConcepts:userConfig.access.sections.concepts.overAll ? undefined:userConfig.access.sections.concepts.enabled
        })
        console.log(res)
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`SGA#${element.id} ${element.name}`,
                    value:element
                })
                setConcepts(C)
            });
        }else{
            setConcepts([])
        }
    }
    

    const getPaymentMethods = async(allowedPaymentMethods)=>{
        let res = await postInfo('/getPaymentMethods',{
            company_id:appInfo.company_id,
            allowedPaymentMethods,
            for_wallet:ableCredit ? undefined:false
        })
        console.log(res)
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

    const getAttachedServices = async(doc_id)=>{
        let res = await postInfo('/getServiceMovements',{
            company_id:appInfo.company_id,
            doc_id
        })
        if(res[0]){
            return(res[1])
        }
    }

    const getDocuments = async(instance_id)=>{
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            instance_id,
            thirdParty_id,
            status:'active',
            // Arreglo temporal de tipo de documentos
            allowedTypes:['Client Order']
        })
        console.log(res)
        if(res[0]){
            if(instance_id == undefined){
                let C = []
                res[1].forEach(element => {
                    C.push({
                        text:`${element.document_type}#${element.ownSerial}`,
                        value:element
                    })
                });
                setDocuments(C);
            }else{
                for (const element of res[1]) {
                console.log('Procesando elemento:', element.id);
                    let attachedItems = await getAttachedServices(element.id);
                    handleAddBlock({
                        docInfo: element,
                        items: attachedItems
                    });
                }
            }
        }
    }

    const getThirdParties = async(id,limit)=>{
        let res = await postInfo('/getThirdParties',{
            company_id:appInfo.company_id,
            comercialInfo:true,
            id:id,
            limit:limit
        });
        console.log('Ter ',res)
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.names}  ${element.indentification_type}_${element.indentification_number}`,
                    value:element
                })
            });
            setThirdParties(C);
            if(limit == 1){
                setThirdPartyInfo(C[0].value);
            }
        }
    }

    const getBriefcasesBills = async()=>{
        let res = await postInfo('/facturation/getBriefcaseBills',{
            company_id:appInfo.company_id,
            thirdParty_id
        })
        console.log(res);
        setBriefCaseBills(res[1]);
    }

    const getProductsAndServices = async()=>{
        let allowedStores = undefined;
        let allowedCellars = undefined;
        if(userConfig.access.stores.enabled.length > 1){
            allowedStores = userConfig.access.stores.enabled;
        }
        if(userConfig.access.cellars.enabled.length > 1){
            allowedCellars = userConfig.access.cellars.enabled.length;
        }
        let res = await postInfo('/inventory/getComercialProducts',{
            company_id:appInfo.company_id,
            allowedStores,
            allowedCellars,
            type:'service'
        })
        console.log('=======> ',res);
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`${element.code} ${element.name}`,
                    value:element
                })
            });
            setProductsAndServices(C)
        }else{
            setProductsAndServices([]);
        }
    }


    // Control functions

    const handleTaxes = (items) => {
        const groupedTaxes = items.reduce((acc, item) => {
            if (!item.tax_id) return acc;
            let itemTotal = parseFloat(item.unit_value) * parseInt(item.units);
            console.log('OOOOOOOOOOOOOOOO ',itemTotal)
            console.log('IIIIIIIIIIIIIIII ',item)
            const taxTotal = (itemTotal * item.tax_rate) / 100;
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

    const addPaymentMethod = (newPayment) => {
        if(newPayment.id != undefined){
            setPaymentMethod(prev => {
                
                // Permitir seleccionar varias veces el mismo metodo de pago
                /*
                const exists = prev.some(item => item.id === newPayment.id);
                if (exists) {
                    // Opcional: Podrías lanzar una alerta o simplemente no hacer nada
                    console.warn("Este método de pago ya ha sido agregado.");
                    alert(`El metodo de pago ${newPayment.name} ya fue agregado`)
                    return prev; 
                }
                    */
                // Si no existe, lo agregamos al array
                return [...prev, newPayment];
            });
        }
    };
    const removePaymentMethod = (id) => {
        setPaymentMethod(prev => prev.filter(item => item.id !== id));
    };

    const calcTotalFromPayments = ()=>{
        let newTTl = 0;
        if(paymentMethod.length == 0){
            if(totalToPay == 0) return;
            setDisabledToSubmit(true);
            setDisabledByValue(true)
            return;
        }
        console.log(paymentMethod)
        setPaymentMethod_code(paymentMethod[0].facturation_code);
        paymentMethod.forEach(element => {
            if(element.value != "" && element.value != undefined){
                newTTl += parseFloat(element.value)
            }
        });
        if(newTTl != totalToPay){
            setDisabledToSubmit(true);
            setDisabledByValue(true);
        }else{
            setDisabledToSubmit(false);
            setDisabledByValue(false);
        }
        setTotal(newTTl)
        return(newTTl)
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

    // function for update paid ammount
    const updatePaidAmount = async()=>{
        for(let doc of itemBlocks){
            console.log(itemBlocks)
            if(doc.docInfo != undefined){
                console.log(doc.docInfo)
                let res = await postInfo('/facturation/updatePaymentDocument',doc.docInfo);
                console.log(res);
            }
        }
    }

    // function for calculte the paidAmmoount for each document
    const calcPaidAmountDocuments = () => {
        let remainingTotal = total;
        // 1. Creamos un nuevo arreglo para no mutar el estado original directamente
        const updatedDocuments = itemBlocks.map((doc) => {
            // Si ya no queda saldo, el valor pagado es 0
            if (remainingTotal <= 0 || doc.docInfo == undefined) {
                return { ...doc};
            }
            let paymentForThisDoc;
            if(parseFloat(doc.docInfo.pending_value) <= remainingTotal){
                paymentForThisDoc = parseFloat(doc.docInfo.pending_value);
                remainingTotal -= paymentForThisDoc;
            }else{
                paymentForThisDoc = remainingTotal;
                remainingTotal = 0
            }
            return {
                ...doc,
                docInfo: {
                    ...doc.docInfo,
                    paid_amount: paymentForThisDoc
                }
            };
        }); 
        console.log(updatedDocuments)
        // 5. Actualizamos el estado de React
        setItemBlocks(updatedDocuments);
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

    // Creation Function

    const createSellInvoice = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/facturation/newSellInvoice',FormInfo);
        console.log(res);
        if(typeof(parseInt(res.id)) == 'number'){
            addNotification({
                type:'aproved',
                title:`Factura de venta #${res.ownSerial} creada correctamente`,
                description:`La factura de venta #${res.ownSerial} fue creada correctamente`
            })
            FormInfo["doc_id"] = res.id
            FormInfo['instance_id'] = instance_id[0] ?? undefined ;
            FormInfo["ownSerial"] = res.ownSerial;
            let e_info = electronicInfo;
            if(e_invoice){
                e_info = await handleCreationOfEinvoice(res.id);
                console.log(e_info);
                if(e_info.id == undefined){
                    alert('Error al crear la facttura')
                    return;
                }
                
            }
            if(isElectron){
                console.log(instance_id);
                let infoToPrtint = {
                    docInfo:{
                        doc_id:res.id,
                        doc_type:FormInfo.doc_type,
                        instance_id:selectedInstances[0] ?? undefined,
                        description:FormInfo.description,
                        ownSerial: res.ownSerial,
                        total,
                        paymentMethod,
                        instanceOwnSerial:selectedInstances[0]?.ownSerial ?? undefined 
                    },
                    thirdPartyInfo:{
                        thirdParty_name:thirdPartyInfo.names
                    },
                    total,
                    paymentMethods:paymentMethod,
                    electronInfo:e_info,
                    totalTaxes,
                    taxes,
                    attachedItems
                }
                await printSellInvoice(infoToPrtint,appInfo,true);
                await printSellInvoice(infoToPrtint,appInfo,false);
            }
            FormInfo["user_id"] = userInfo.user_id,
            FormInfo['transactionDetails'] = []
            itemBlocks.forEach(element => {
                console.log(element)
                element.items.forEach(item => {
                    console.log('EL> ',item)
                    FormInfo.transactionDetails.push({
                        account_id:item.exit_account,
                        subtotal:(parseFloat(item.units)*parseFloat(item.unit_value)*(1-(parseFloat(item.tax_rate??0)/100))),
                        total:(parseFloat(item.units)*parseFloat(item.unit_value)*(1-(parseFloat(item.tax_rate??0)/100))),
                        type:item.type == 'service'? 'serviceMovement':'inventoryMovement',
                        nature: documentNature == 'DB'? 'CR':'DB'
                    })
                });
            });
            taxes.forEach(tax => {
                console.log('Tax:  ',tax)
                FormInfo.transactionDetails.push({
                    account_id:tax.account,
                    subtotal:tax.total,
                    total:tax.total,
                    type:'tax',
                    nature: documentNature == 'DB'? 'CR':'DB'
                })
            });
            paymentMethod.forEach(element => {
                FormInfo.transactionDetails.push({
                    account_id:element.account_id,
                    subtotal:element.value,
                    total:element.value,
                    type:'payment',
                    paymentMethod_id:element.id,
                    nature: documentNature,
                    due_date:addDaysToCurrentDate(thirdPartyInfo.credit_term != undefined? thirdPartyInfo.credit_term:0),
                    for_wallet:element.for_wallet,
                    voucher:element.voucher,
                    cashBox_id,
                    shift_id,
                })
            });
            /*FormInfo.transactionDetails.push({
                account_id:conceptAccount_id,
                subtotal:total,
                total:total,
                type:'operation',
                nature: documentNature == 'DB'? 'CR':'DB'
            })*/
           console.log('==========> ',FormInfo.transactionDetails)
            await toAccount();
            await updatePaidAmount();
        }else{
            addNotification({
                type:'error',
                title:`Error al crear recibo de caja #`,
                description:`Hubo un problema al crear el recibo de caja #.`
            })
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
        reloadFun?.();
        if(instance_id != undefined && instance_id.length == 1){
            //popInAlert(<ProcessStatusAlert instance_id={instance_id[0]} reloadFun={reloadFun}/>)
        }
    }

    const toAccount = async()=>{
        console.log(FormInfo)
        let res = await postInfo('/createTransaction',FormInfo);
        const insertId = parseInt(res[0]);
        if(typeof(insertId) == 'number' && insertId != NaN && insertId != undefined){
            addNotification({
                type:'aproved',
                title:`Movimiento contabilizado correctamente`,
                description:`La transacción ${insertId} fue contabilizada correctamente.`
            })
            updateTransactions(insertId);
        }else{
            addNotification({
                type:'error',
                title:`Error al contabilizar movimiento`,
                description:`Hubo un problema al intentar contabilizar el movimiento ${FormInfo.doc_id} de inventario`
            })
        }
        popOutAlert();
    }

    const updateTransactions = async(id)=>{
        let res = await postInfo('/updateTransactionState',{
            status:FormInfo.status == 'active'? 'posted':'draft',
            transaction_id:id
        })
        if(res[0]){
            addNotification({
                type:'aproved',
                title:'Transacciones Actualziadas',
                description:'Totas las transacciónes fueron actualizadas correctamente.'
            })
        }
    }


    const handleCreationOfEinvoice = async(doc_id)=>{
        let itemsToFac = [];
        itemBlocks.forEach(element => {
            element.items.forEach(item => {
                itemsToFac.push(
                    {
                        "code_reference": item.code? item.code:item.service_id,
                        "name": item.name? item.name:item.service_name,
                        "quantity": parseFloat(item.units),
                        "discount": 0,
                        "discount_rate": 0,
                        "price": parseFloat(item.unit_value),
                        "tax_rate": `${(item.tax_rate).toFixed(2) || "19.00"}`,
                        //"tax_rate": "19.00",
                        "unit_measure_id": 70,
                        "standard_code_id": 1,
                        "is_excluded": 0,
                        "tribute_id": 1,
                        "withholding_taxes": []
                    }
                )
            });
        });
        let res = await newElectronicInvoide({
            company_info:appInfo,
            customer:thirdPartyInfo,
            user_id:userInfo.user_id,
            document:FormInfo,
            items:itemsToFac,
            doc_id
        });
        console.log(res)
        if(res.status == 'Created'){
            addNotification({
                type:'aproved',
                title:`Factura Electronica #${res.data.bill.number} creada exitosamente`,
                description:'Para consultar y previsualizar la factura haga click en esta notificación.',
                onClick:()=>{
                    window.open(`${res.data.bill.public_url}`,'_blank','noopener,noreferrer')
                    //window.open(`${res.data.bill.public_url}`,'_blank','noopener,noreferrer')
                }
            })
        }else{
            setLoading(false);
            setDisabled(false);
            return({
                id:undefined,
                code:undefined,
                url:undefined
            })
        }
        return({
            id: res.sga_id.id,
            code:res.data.bill.cufe,
            url: res.data.bill.public_url
        })
    }

    const getEffectivePrice = (product, quantity) => {
    const qty = parseInt(quantity) || 0;
        if (!product.price_tiers || product.price_tiers.length === 0) {
            return product.unit_price || 0;
        }
        const applicableTier = [...product.price_tiers]
            .sort((a, b) => b.min_qty - a.min_qty) 
            .find(tier => qty >= tier.min_qty);
        return applicableTier 
            ? applicableTier.price 
            : [...product.price_tiers].sort((a, b) => a.min_qty - b.min_qty)[0].price;
    };

    const validateDocument = async () => {
        if (docRules.length === 0) {
            setDisabled(true);
            console.warn('Documento sin parametrizar');
            return;
        }
        setVisibleError(false);
        for (const rule of docRules) {
            const res = await executeDocumentAction(rule.action, FormInfo);
            console.log(res);

            if (res.isValid === false) {
            setError(`Error de validación: ${res.message}`);
            setVisibleError(true);
            return; 
            }
        }
        // Execution after all filters temporal, first implementation of doc_rules
        console.log(taxes)
        createSellInvoice();
    };

    // Event listeners
    
    useEffect(()=>{
        console.log(thirdPartyInfo)
        if(thirdPartyInfo.id != undefined){
            // Update of crefit conditions of thirdParty
            setAbleCredit(thirdPartyInfo.credit != undefined ? thirdPartyInfo.credit:0);
            setAviableCredit(thirdPartyInfo.aviable_credit != undefined? thirdPartyInfo.aviableCredit:0);
            
        }
    },[thirdPartyInfo])


    useEffect(()=>{
        if(thirdPartyInfo.id != undefined){
            console.log('Obteniedo metodos de pago')
            getPaymentMethods();
        }
    },[aviableCredit,ableCredit])

    useEffect(()=>{
        if(instance_id != undefined && instance_id != ''){
            getThirdParties(thirdParty_id,1)
        }
    },[instance_id])

    useEffect(()=>{
        calcTotalFromPayments();
    },[paymentMethod])

    useEffect(()=>{
        console.log(documents)
        if(documents.length > 0){
            let newTotalToPay = 0;
            console.log('XXX',itemBlocks)
            itemBlocks.forEach(element => {
                if(element.docInfo == undefined){
                    let tempTtl = 0;
                    element.items.forEach(element => {
                        tempTtl += (parseFloat(element.unit_value? element.unit_value:0)*parseFloat(element.units? element.units:0))
                    });
                    newTotalToPay += tempTtl;
                }else{
                    newTotalToPay += (element.docInfo.pending_value != undefined && element.docInfo.pending_value != "" ? parseFloat(element.docInfo.pending_value):0);
                }
            });
            setTotalToPay(newTotalToPay);
        }
        if(briefCaseBills.length >0 && documents.length == 0){
            let newTotalToPay = 0;
            briefCaseBills.forEach(element => {
                newTotalToPay += (element.paid_value != undefined && element.paid_value != "" ? element.paid_value:0);
            });
            setTotalToPay(newTotalToPay)
        }
        calcTotalFromPayments();
    },[documents,briefCaseBills,itemBlocks])

    useEffect(()=>{
        if(itemBlocks.length == 0) return;
        let C = [];
        itemBlocks.forEach(element => {
            if(element.items != undefined){
                element.items.forEach(item => {
                    C.push(item);
                });
            }
        });
        setAttachedItems(C);
    },[itemBlocks])

    useEffect(()=>{
        handleTaxes(attachedItems);
    },[attachedItems])

    useEffect(()=>{
        let totalTax = 0;
        taxes.forEach(element => {
            totalTax += element.total;
        });
        setTotalTaxes(totalTax);
    },[taxes])

    useEffect(()=>{
        getDocumentRules();
        handleUserConfig();
        getProductsAndServices();
    },[])

    useEffect(()=>{
        if(thirdParty_id != undefined){
            getDocuments();
            getInstances();
        }
    },[thirdParty_id])

    useEffect(()=>{
        console.log('---> ',disabled)
    },[disabled])

     useEffect(()=>{
        if(documents.length > 0){
            calcPaidAmountDocuments();
        }
    },[total])

    return(
        <div className="FormNewCashRecipt FormNewInvoice">
            {visibleError && (
                <div className="errorContainer">
                    <span>{error}</span>
                    <i title="Ocultar advertencia" className="fa-solid fa-xmark closeErrorBtn" onClick={()=>{
                        setVisibleError(false);
                    }}/>
                </div>
            )}
            <div className="headForm">
                <BoldTitle text={'Factura de venta'}>
                    <i className="fa-solid fa-file-invoice"/>
                </BoldTitle>
                {false && (
                    <>
                        {appConfig?.access?.services?.e_facturation?.use == true && (
                            <LabelValue title={"Generar factura electronica"}>
                                <SwitchOption action={setE_invoice}/>    
                            </LabelValue> 
                        )}
                    </>
                )}
                <div className="valuesCashRecipt">
                    {(instance_id != undefined || mode == 'briefcase_payment')&& (
                        <h6 className="valueCashRecipt">Valor a cobrar: $ {formatCurrency(totalToPay)}</h6>
                    )}
                    <h6 className="valueCashRecipt">Valor: $ {formatCurrency(total)}</h6>
                </div>
                <i className="fa-solid fa-xmark closeFormBtn" onClick={()=>{
                    popOutAlert();
                }}/>
            </div>
            {!loading && (
                <form action="" disabled={disabledToSubmit? true:disabled} onSubmit={(e)=>{
                    e.preventDefault();
                    //createSellInvoice();
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
                    <SearchinList action={handleThirdPartyChange} title={'Cliente'} placeHolder={'Seleccione el cliente'} list={thirdparties} disabled={disabled} specialOption={
                        <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                            popInAlert(<FormNewThirdParties reloadFun={getThirdParties} quickCreation={true}/>)
                        }}/>
                    }/>
                    {info.instance_id == undefined && (
                        <SearchinList action={handleSelectInstance} noActVal={true} title={'Proceso adjunto'} placeHolder={'Seleccione el proceso (opcional)'} list={instances} disabled={thirdPartyInfo.id != undefined? disabled:true}/>
                    )}
                    <SearchinList action={handleAddDocument} noActVal={true} title={'Documentos'} placeHolder={'Seleccione el documento'} list={documents} disabled={thirdParty_id != undefined? disabled:true}/>
                    {info.concept_id == undefined && (
                        <SearchinList action={handleConceptChange} title={'Concepto'} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>
                    )}
                    {info.cashBox_id == undefined && (
                        <SearchinList action={handleCashBoxChange} title={'Caja'} placeHolder={'Seleccione la caja'} list={cashBoxes} disabled={disabled}/>
                    )}
                    <div className="gridItemsContainer">
                        {itemBlocks?.map((element,index_block)=>(
                            <div key={index_block} className="itemBlock">
                                <div className="headBlock">
                                    <strong>
                                        {element.docInfo != undefined ? `${element.docInfo.document_type}#${element.docInfo.ownSerial}`:'Adicionar producto o servicio'}
                                    </strong>
                                    <span>Total: ${element.docInfo != undefined ? moneyFormat(element.docInfo.pending_value):0}</span>
                                    <span className="quitContainer" onClick={()=>{
                                        handleDeleteBlock(index_block)
                                    }}>
                                        <i className="fa-solid fa-trash"/>
                                    </span>
                                </div>
                                <div className="gridItems">
                                    {element.docInfo != undefined && element.items.map((element,index)=>(
                                        <div className="itemRow" key={index}>
                                            <UserCard imgSrc={element.service_img} name={element.service_name}/>
                                            <strong className="valueItemRow">Unidades: {element.units}</strong>
                                            <strong className="valueItemRow">Val unidad: {moneyFormat(element.unit_value)}</strong>
                                            <strong className="valueItemRow">Total: {moneyFormat(parseFloat(element.units)*parseFloat(element.unit_value))}</strong>
                                        </div>
                                    ))}
                                     {element.docInfo == undefined && element.items.map((element,index)=>(
                                        <div className="itemRow" key={index}>
                                            <UserCard imgSrc={element.img} name={element.name}/>
                                            <strong className="valueItemRow rowInputItem">
                                                <FormInput 
                                                    title={'unidades'}
                                                    type={'number'}
                                                    min={0}
                                                    required={true}
                                                    value={element.units || ''}
                                                    action={(value) => {
                                                        handleEditItemDetail(index_block, index, 'units', value);
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
                                                    defaultValue={element.unit_value}
                                                    placeholder={element.unit_value} 
                                                    disabled={disabled}
                                                    action={(value) => {
                                                        handleEditItemDetail(index_block, index, 'unit_value', value);
                                                    }}
                                                />
                                            </strong>
                                            <strong className="valueItemRow">Total: {moneyFormat(parseFloat(element.units)*parseFloat(element.unit_value))}</strong>
                                        </div>
                                    ))}
                                </div>
                                {element.docInfo == undefined && (
                                    <div className="personalizaedView">
                                        <SearchinList noActVal={true} list={productsAndServices} action={handleAddProductAndService} placeHolder={'+ Agregar producto o servicio'}/>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {info.paymentMethod == undefined && (
                        <div className="paymentMehtodsContainer">
                            <SearchinList title={'Metodos de pago'} action={addPaymentMethod} noActVal={true} placeHolder={'Selecione metodos de pago'} list={paymentMehtods}/>
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
                                            {!element.for_balance && (
                                                <input className="inputPaymentValue" step={0.001} type="number"  placeholder="$0" onChange={(e)=>{
                                                    updatePaymentValue(element.id,"value",e.target.value)
                                                }}/>
                                            )}
                                            {element.for_balance && (
                                                <input className="inputPaymentValue" step={0.001} max={thirdPartyInfo.thirdParty_balance} type="number" placeholder={`Max $ ${formatCurrency(thirdPartyInfo.thirdParty_balance)}`} onChange={(e)=>{
                                                    updatePaymentValue(element.id,"value",e.target.value)
                                                }}/>
                                            )}
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
                                                    Voucher o referencia
                                                </strong>
                                                <input type="text" placeholder="Ej: AR23..." onChange={(e)=>{
                                                    updateVoucher(element.id,e.target.value);
                                                }}/>
                                                <i title={`Eliminar ${element.name}`} className="fa-solid fa-trash delPaymentBtn" onClick={()=>{
                                                    setAplyVoucher(element.id,false)
                                                }}/>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <FormInput title={'Descripción'} textArea={true} placeholder={'Descripción'} action={setDescription} disabled={disabled}/>
                    <FileInput action={setAttached} placeholder={'Adjuntar comprobante'} disabled={disabled} setDisabled={setDisabled} multiple={true}/>
                    <FormButton className={disabledByValue? 'disabledByValueBtn':''} text={disabledByValue? 'El valor ingresado no es valido':'Crear factura de venta'} disabled={disabledToSubmit? true:disabled} loading={loading}/>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'}/>
            )}
        </div>
    )
}