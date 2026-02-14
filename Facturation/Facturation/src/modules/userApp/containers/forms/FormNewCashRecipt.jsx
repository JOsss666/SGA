import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { SearchinList } from "../../components/SearchInList";
import { FormInput } from "../../components/FormInput";
import { InputFiles } from "../../components/InputFiles";
import { FormButton } from "../../components/FormButton";
import './FormNewCashRecipt.css'
import { FileInput } from "../../components/FileInput";
import { LoadingSpace } from "../LoadingSpace";
import { postInfo } from "../../../../utils/functions";
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormNewThirdParties } from "./FormNewThirdParties";
import { ProcessStatusAlert } from "../Alerts/ProcessStatusAlert";

export function FormNewCashRecipt({InfoParams,reloadFun,process_instance_id}){

    // Requieremnets
    const [info,setInfo] = useState(InfoParams != undefined? InfoParams:{})
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const {popOutAlert,popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const [instances,setInstances] = useState([]);
    const [thirdparties,setThirdParties] = useState([]);
    const [paymentMehtods,setPaymentMethods] = useState([]);
    const [stores,setStores] = useState([]);
    const [bussines,setBussines] = useState([]);
    const [costCenters,setCostCenters] = useState([]);
    const [concepts,setConcepts] = useState([]);
    const [documents,setDocuments] = useState([]);
    const [cashBoxes,setCashBoxes] = useState([]);
        // BirefCase Bills requirements
        const [briefCaseBills,setBriefCaseBills] = useState([]);

    // control
    const [mode,setMode] = useState('process_instance');
    const [loading,setLoading] = useState();
    const [disabled,setDisabled] = useState();
    const [disabledByValue,setDisabledByValue] = useState(false);
        // control of credit conditions of thirdParty
        const [ableCredit,setAbleCredit] = useState(false);
        const [aviableCredit,setAviableCredit] = useState(0);
        // Control of the conditions of the document
        const [documentNature,setDocumentNature] = useState('DB');
    
    // form info
    const [thirdParty_id,setThirdParty_id] = useState();
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [paymentMethod,setPaymentMethod] = useState([]);
    const [bussines_id,setBussines_id] = useState();
    const [store_id,setStore_id] = useState();
    const [costCenter_id,setCostCenter_id] = useState();
    const [total,setTotal] = useState(0);
        // Valor indicativo d a pagar
        const [totalToPay,setTotalToPay] = useState(0);
    const [description,setDescription] = useState();
    const [attached,setAttached] = useState('-');
    const [instance_id,setInstance_id] = useState();
    const [step_id,setStep_id] = useState();
    const [concept_id,setConcept_id] = useState();
    const [conceptAccount_id,setConcept_account_id] = useState();
    const [cashBox_id,setCashBox_id] = useState();
    const [shift_id,setShift_id] = useState();
    const [status,setStatus] = useState('active');

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
        bussines_id,
        doc_type:'Cash Recipt',
        status,
        subTotal:total,
        total,
        attached,
        instance_id,
        step_id,
        payedBills:briefCaseBills,
        cashBox_id
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

    useEffect(()=>{
        console.log(documentNature);
    },[documentNature])

    const handleThirdPartyChange = (element)=>{
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

    useEffect(()=>{
        handleUserConfig();
    },[])

    // Getters of info

    const handleSelectInstance = (element)=>{
        setInstance_id(element.id)
        setStep_id(element.step_id)
        setThirdParty_id(element.thirdParty_id)
        setInfo(prevInfo => ({
            ...prevInfo,            // Mantenemos todas las propiedades actuales (nombre, fecha, etc.)
            thirdParty_id: element.thirdParty_id // Sobrescribimos solo el ID del tercero
        }));
        if(element.id != undefined){
            getDocuments(element.id);
        }
        calcTotalFromPayments();
    }

    const getInstances = async(allowedInstances,allowedTypes)=>{
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            status:['active']
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

    const getDocuments = async(instance_id)=>{
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            instance_id,
            status:'active',
            // Arreglo temporal de tipo de documentos
            allowedTypes:['Client Order']
        })
        if(res[0]){
            setDocuments(res[1]);
        }
    }

     const getThirdParties = async(id,limit)=>{
        let res = await postInfo('/getThirdParties',{
            company_id:appInfo.company_id,
            comercialInfo:true,
            id:id,
            limit:limit
        });
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


    // Control functions

    const addPaymentMethod = (newPayment) => {
        if(newPayment.id != undefined){
            setPaymentMethod(prev => {
                // Verificamos si ya existe un objeto con ese ID
                const exists = prev.some(item => item.id === newPayment.id);
                if (exists) {
                    // Opcional: Podrías lanzar una alerta o simplemente no hacer nada
                    console.warn("Este método de pago ya ha sido agregado.");
                    alert(`El metodo de pago ${newPayment.name} ya fue agregado`)
                    return prev; 
                }
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
        paymentMethod.forEach(element => {
            if(element.value != "" && element.value != undefined){
                newTTl += parseFloat(element.value)
            }
        });
        if(instance_id != undefined){
            if(newTTl > totalToPay){
                setDisabled(true);
                setDisabledByValue(true);
            }else{
                setDisabled(false);
                setDisabledByValue(false);
            }
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

    useEffect(()=>{
        calcTotalFromPayments();
    },[paymentMethod])

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


    // Function for control payments of BirefCaseBills
    const updateBriefCasePayedValue = (newValue,id)=>{
        setBriefCaseBills(prev => 
            prev.map(item => 
                item.id === id 
                    ? { ...item, ["paid_value"]: newValue } 
                    : item
            )
        );
    }

    useEffect(()=>{
        console.log(briefCaseBills)
    },[briefCaseBills])

    useEffect(()=>{
        console.log(documents)
        if(documents.length > 0){
            let newTotalToPay = 0;
            documents.forEach(element => {
                newTotalToPay += parseInt(element.total);
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
    },[documents,briefCaseBills])

    // Creation Function

    const createCashRecipt = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/facturation/newCashRecipt',FormInfo);;
        if(typeof(parseInt(res.id)) == 'number'){
            addNotification({
                type:'aproved',
                title:`Recibo de caja #${res.id} creado correctamente`,
                description:`El recibo de caja #${res.id} fue creado correctamente`
            })
            FormInfo["doc_id"] = res.id
            FormInfo["user_id"] = userInfo.user_id,
            FormInfo['transactionDetails'] = []
            FormInfo['instance_id'] = instance_id;
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
            FormInfo.transactionDetails.push({
                account_id:conceptAccount_id,
                subtotal:total,
                total:total,
                type:'operation',
                nature: documentNature == 'DB'? 'CR':'DB'
            })
            await toAccount();
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
        if(instance_id != undefined){
            popInAlert(<ProcessStatusAlert instance_id={instance_id} reloadFun={reloadFun}/>)
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
            getPaymentMethods();
        }
    },[aviableCredit,ableCredit])

    useEffect(()=>{
        if(instance_id != undefined && instance_id != ''){
            getThirdParties(thirdParty_id,1)
        }
    },[instance_id])

    return(
        <div className="FormNewCashRecipt">
            <div className="headForm">
                <BoldTitle text={documentNature == 'DB'? 'Recibo de caja':'Nuevo Egreso'}>
                    <i className="fa-solid fa-receipt"/>
                </BoldTitle>
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
                <form action="" disabled={disabled} onSubmit={(e)=>{
                    e.preventDefault();
                    console.log(FormInfo)
                    //createCashRecipt();
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
                    {info.instance_id == undefined && (
                        <SearchinList action={handleSelectInstance} title={'Proceso adjunto'} placeHolder={'Seleccione el proceso (opcional)'} list={instances} disabled={disabled}/>
                    )}
                    {info.thirdParty_id == undefined && (
                        <SearchinList action={handleThirdPartyChange} title={'Cliente'} placeHolder={'Seleccione el cliente'} list={thirdparties} disabled={disabled} specialOption={
                            <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                popInAlert(<FormNewThirdParties reloadFun={getThirdParties} quickCreation={true}/>)
                            }}/>
                        }/>
                    )}
                    {info.concept_id == undefined && (
                        <SearchinList action={handleConceptChange} title={'Concepto'} placeHolder={'Seleccione el concepto'} list={concepts} disabled={disabled}/>
                    )}
                    {info.cashBox_id == undefined && (
                        <SearchinList action={handleCashBoxChange} title={'Caja'} placeHolder={'Seleccione la caja'} list={cashBoxes} disabled={disabled}/>
                    )}
                    {mode == 'briefcase_payment' && (
                        <div className="aviableBriefCaseContainer">
                            <h6>Cuentas por cobrar</h6>
                            <div className="gridBirefCaseBills">
                                {briefCaseBills.map((element,index)=>(
                                    <div key={index} className="briefCaseCard">
                                        <strong>{`${element.process_code != undefined? element.process_code:'--'}#${element.instance_id != undefined? element.instance_id:'---'}`}</strong>
                                        <span>Valor: {formatCurrency(element.pending_amount)}</span>
                                        <span>Vence: {formatDate(element.due_date)}</span>
                                        <input type="number" min={0} max={element.pending_amount} step={0.1} disabled={disabled} placeHolder={'$ 0'} onChange={(e)=>{
                                            if(e.target.value != '' && e.target.value != undefined){
                                                updateBriefCasePayedValue(e.target.value,element.id)
                                            }else{
                                                updateBriefCasePayedValue(0,element.id);
                                            }
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {info.paymentMethod == undefined && (
                        <div className="paymentMehtodsContainer">
                            <SearchinList title={'Metodos de pago'} action={addPaymentMethod} noActVal={true} placeHolder={'Selecione metodos de pago'} list={paymentMehtods}/>
                            <div className="gridPaymentMethods">
                                {disabledByValue && (
                                    <span className="warnByValue">
                                        El valor ingresado supera el monto maximo del documento,
                                        modifique el valor o agrege un metodo de pago para saldo a favor.
                                    </span>
                                )}
                                {paymentMethod.map((element,index)=>(
                                    <div key={index} className={`PaymentMethodCard ${disabledByValue? 'disabledPaymentMethodCard':''}`}>
                                        <div className="payMC">
                                            <strong>{element.name}</strong>
                                            {!element.for_balance && (
                                                <input step={0.001} type="number" placeholder="$0" onChange={(e)=>{
                                                    updatePaymentValue(element.id,"value",e.target.value)
                                                }}/>
                                            )}
                                            {element.for_balance && (
                                                <input step={0.001} max={thirdPartyInfo.thirdParty_balance} type="number" placeholder={`Max $ ${formatCurrency(thirdPartyInfo.thirdParty_balance)}`} onChange={(e)=>{
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
                    <FormButton className={disabledByValue? 'disabledByValueBtn':''} text={disabledByValue? 'El valor excede el monto max':'Crear recibo de caja'} disabled={disabled} loading={loading}/>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'}/>
            )}
        </div>
    )
}