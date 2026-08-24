import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import './FormNewENote.css'
import { SearchinList } from "../../components/SearchInList";
import { moneyFormat, newElectronicNote, postInfo, printCashRecipt } from "../../../../utils/functions";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { isElectron } from "../../../../App";
import { NoResults } from "../NoResults";
import { LoadingSpace } from "../LoadingSpace";

export function FormNewENote({InfoParams,reloadFun}){

    // Requirtements
    const {addNotification} = useNotifications();
    const {appInfo,userConfig,userInfo,appConfig} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();
    const [docParams,setDocParams] = useState({});

    // Control
    const [info,setInfo] = useState(InfoParams != undefined? InfoParams:{})
    const [step,setStep] = useState(0);
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [loadingInvoice,setLoadingInvoice] = useState(false);
    const [thirdparties,setThirdParties] = useState([]);
    const [invoices,setInvoices] = useState([]);
    const [bussines,setBussines] = useState([]);
    const [costCenters,setCostCenters] = useState([]);
    const [stores,setStores] = useState([]);

    
    // FormInfo
    const [mode,setMode] = useState();
    const [type,setType] = useState('Credit Note');
    const [bussines_id,setBussines_id] = useState();
    const [thirdParyInfo,setThirdPartyInfo] = useState({});
    const [invoiceInfo,setInvoiceInfo] = useState({});
    const [correction_code,setCorrection_code] = useState();
    const [description,setDescription] = useState('');
    const [costCenter_id,setCostCenter_id] = useState();
    const [items,setItems] = useState([]);
    const [store_id,setStore_id] = useState();
    const [total,setTotal] = useState();

    const FormInfo = {
        company_info:appInfo,
        customer:thirdParyInfo,
        user_id:userInfo.user_id,
        document:{
            company_id:appInfo.company_id,
            store_id:6,
            type:'Sell Invoice',
            thirdParty_id:thirdParyInfo.id,
            status:'active',
            subTotal:total,
            total:total,
            created_by:userInfo.user_id,
            description:description,
            attached:[],
            instances:[],
        },
        items,
        bill_id:invoiceInfo.bill_id,
        bill_number:invoiceInfo.bill_number
    }

    // Getters of Info

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

    const getInvoices = async()=>{
        let res = await postInfo('/electronicFacturation/getDocuments',{
            company_id:appInfo.company_id,
            type:'electronic invoice'
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.number,
                    value:element
                })
            });
            setInvoices(C)
        }
    }

    const getInvoiceInfo = async(bill_number,thirdParty_id)=>{
        setDisabled(true);
        setLoadingInvoice(true);
        let res = await postInfo('/electronicFacturationController.getDocumentFullInfo',{
            bill_numer:bill_number
        });
        if(res.status == 'OK'){
            setInvoiceInfo(res.data)
            setThirdPartyInfo({
                id:thirdParty_id,
                indentification_number:res.data.customer.identification,
                names:res.data.customer.names,
                address:res.data.customer.address,
                phone:res.data.customer.phone,
                mail:res.data.customer.email
            })
            setItems(res.data.items);
        };
        setLoadingInvoice(false);
        setDisabled(false);
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

    // Creation Functions

        const handleUserConfig = async()=>{
        setDisabled(true)
        setLoading(true)
        await getThirdParties();
        let temInfo = {}
        if(userConfig.access != undefined){
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
        }
        
        if(temInfo != {}){
            setInfo(temInfo);
        }
        setLoading(false);
        setDisabled(false);
    }

    const handleCreationOfNote = async(doc_id)=>{
        let itemsToFac = [];
        items.forEach(item => {
            itemsToFac.push(
                {
                    "code_reference": item.code_reference? item.code_reference:'-',
                    "name": item.name? item.name:item.service_name,
                    "quantity": parseFloat(item.quantity),
                    "discount": 0,
                    "discount_rate": 0,
                    "price": parseFloat(item.price),
                    "tax_rate": "19.00",
                    "unit_measure_id": 70,
                    "standard_code_id": 1,
                    "is_excluded": 0,
                    "tribute_id": 1,
                    "withholding_taxes": []
                }
            )
        });
        let res = await newElectronicNote({
            company_info:appInfo,
            customer:thirdParyInfo,
            user_id:userInfo.user_id,
            document:FormInfo,
            items:itemsToFac,
            bill_id:invoiceInfo.bill.id,
            doc_id,
            type
        });
        if(res.status == 'Created'){
            addNotification({
                type:'aproved',
                title:`Factura Electronica #${res.data.bill.number} creada exitosamente`,
                description:'Para consultar y previsualizar la factura haga click en esta notificación.',
                onClick:()=>{
                    window.open(`${res.data.bill.public_url}`,'_blank','noopener,noreferrer')
                }
            })
        }
    }

    const createNote = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/facturation/newNote',FormInfo.document);
        if(typeof(parseInt(res.id)) == 'number'){
            addNotification({
                type:'aproved',
                title:`Nota ${type == 'Credit Note'? 'crédito':'débito'} #${res.ownSerial} creada correctamente`,
                description:`El recibo de caja #${res.id} fue creado correctamente`
            })
            handleCreationOfNote(res.id);
            FormInfo["doc_id"] = res.id
            FormInfo["ownSerial"] = res.ownSerial;
            if(isElectron){
                //await printCashRecipt(FormInfo,appInfo,true);
                //await printCashRecipt(FormInfo,appInfo,false);
            }
            FormInfo["user_id"] = userInfo.user_id,
            FormInfo['transactionDetails'] = []     
            items.forEach(element => {
                FormInfo.transactionDetails.push({
                    account_id:element.account_id,
                    subtotal:element.value,
                    total:element.value,
                    type:'payment',
                    paymentMethod_id:element.id,
                    nature: type == 'Credit Note'? 'CR':'DB',
                    due_date:0,
                    for_wallet:element.for_wallet,
                    voucher:element.voucher,
                    cashBox_id,
                    shift_id,
                })
            });
            // Pendiente definir como se contabiliza la nota debito o credito
            await toAccount();
        }else{
            addNotification({
                type:'error',
                title:`Error al crear nota ${type == 'Credit Note'? 'crédito':'débito'}`,
                description:`Hubo un problema al crear la nota ${type == 'Credit Note'? 'crédito':'débito'}.`
            })
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
        reloadFun?.();
    }

     const toAccount = async()=>{
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

    // utils functions
    
    const handleSelectInvoice = async(element)=>{
        if(element.id == undefined) return;
        await getInvoiceInfo(element.number);
    }

        // Values change Handle events
        
        const updateItemValue = (itemIndex, value,units) => {
            items.forEach((element,index) => {
            });
            setItems(prev => 
                prev.map((item,index) => 
                    itemIndex === index
                        ? { ...item, ['total']: (parseFloat(value) * parseFloat(units))} 
                        : item
                    )
                );
            };

    // EventsListeners

    useEffect(()=>{
        if(mode == undefined || mode == null)return;
        getInvoices(); 
        handleUserConfig();
        setStep(1);
    },[mode]);

    useEffect(()=>{
    },[thirdParyInfo])

    useEffect(() => {
        const s = items.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
        setTotal(s);
    }, [items]);

    useEffect(() => {
        if(invoiceInfo.bill == undefined) return;
        if(total > parseFloat(invoiceInfo.bill.total)){
            setType('Debit Note');
        }else{
            setType('Credit Note');
        }
    }, [total,invoiceInfo]);

    return(
        <div className="FormNewENote">
            <div className="headForm">
                <BoldTitle 
                    text={`Nueva nota ${type == 'Credit Note'? 'crédito':'débito'} electronica`}
                    children={<i className="fa-solid fa-note-sticky"/>}
                />
            </div>
            {step == 0 && (
                <form className="step1Form initialSelection" action="" onSubmit={(e)=>{
                    e.preventDefault();
                    setStep(1);
                }}>
                    <SearchinList disabled={disabled} action={setMode} title={'Tipo de nota'} placeHolder={'Seleccionar tipo de nota'} list={[
                        {text:'Asociada a una factura registrada en SGA',value:'1'},  
                        {text:'Asociada a un tercero',value:'2'}
                    ]}/>
                </form>
            )}
            {step == 1 && (
                <form className="step2Form" action="" onSubmit={(e)=>{
                    e.preventDefault();
                    createNote();
                }}>
                    <SearchinList disabled={disabled} action={setCorrection_code} title={'Concepto'} placeHolder={'Seleccione el concepto de corrección'} list={[
                        {text:'Devolución parcial de los bienes y/o no aceptación parcial del servicio',value:'1'},
                        {text:'Anulación de factura electrónica',value:'2'},
                        {text:'Rebaja o descuento parcial',value:'3'},
                        {text:'Ajuste de precio',value:'4'},
                        {text:'Otras',value:'5'},
                    ]}/>
                    {mode == 1 && (
                        <SearchinList title={'Facturas'} list={invoices} action={handleSelectInvoice} placeHolder={'Seleccione la factura'} disabled={disabled}/>
                    )}
                    {mode == 2 && (
                        <SearchinList title={'Terceros'} list={thirdparties} placeHolder={'Seleccione el tercero'} disabled={disabled}/>
                    )}
                    {loadingInvoice && (
                        <LoadingSpace title={'Cargando informacion de la factura'} description={'Esto no debe tardar mucho'}/>
                    )}
                    {!loadingInvoice && invoiceInfo.bill == undefined && (
                        <NoResults title={'Selecciona una factura para generar la nota'} img={'https://cdn-icons-png.flaticon.com/512/2432/2432926.png'} />
                    )}
                    {!loadingInvoice && invoiceInfo.bill != undefined && (
                        <div className="invoiceInfoContainer">
                            <div className="invoiceHead">
                                <FormInput title={'Tercero'} value={invoiceInfo.customer.names} disabled={true}/>
                                <FormInput title={'NIT Tercero'} value={invoiceInfo.customer.identification} disabled={true}/>
                                <FormInput title={'Correo Tercero'} value={invoiceInfo.customer.email} disabled={true}/>
                                <FormInput title={'Fecha de creación'} value={invoiceInfo.bill.created_at} disabled={true}/>
                                <FormInput title={'Fecha de validación'} value={invoiceInfo.bill.validated} disabled={true}/>
                            </div>
                        </div>
                    )}
                    {items.length > 0  && (
                        <div className="resumeInvoice">
                            {items.map((element,index)=>(
                                <div className="itemRow" key={index}>
                                    <FormInput 
                                        title={'Item'}
                                        value={element.name}
                                        disabled={true}/>
                                    <FormInput 
                                        title={'Unidades'}
                                        type={'number'}
                                        action={(value)=>{
                                            updateItemValue(index,element.price,value);
                                        }}
                                        defaultValue={parseFloat(element.quantity)?.toFixed(2)}
                                        disabled={disabled}/>
                                    <FormInput 
                                        title={'Precio'}
                                        type={'number'}
                                        defaultValue={element.price}
                                        action={(value)=>{
                                            updateItemValue(index,value,element.quantity);
                                        }}
                                        disabled={disabled}/>
                                    <FormInput 
                                        title={'Descuento %'}
                                        defaultValue={element.discount_rate}
                                        min={0}
                                        step={0.01}
                                        type={'number'}
                                        disabled={disabled}/>
                                    <FormInput 
                                        title={'Retenciones %'}
                                        value={0}
                                        min={0}
                                        step={0.01}
                                        type={'number'}
                                        disabled={true}/>
                                    <FormInput 
                                        title={'Impuestos %'}
                                        value={element.tax_rate}
                                        min={0}
                                        step={0.01}
                                        disabled={true}/>
                                    <div className="totalItemValue">
                                        <span>Valor:</span>
                                        <strong>{moneyFormat(parseFloat(element.total))}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {invoiceInfo.bill != undefined && (
                        <div className="sumaryContainer">
                            <div className="sumary">
                                <span>Total factura original: 
                                    <b>{moneyFormat(invoiceInfo.bill != undefined? invoiceInfo.bill.total:0)}</b></span>
                                <hr />
                                <span>Total Nota: 
                                    <b>{moneyFormat(total)}</b>
                                </span>
                                <span>Tipo nota: 
                                    <b>{type == 'Credit Note'? 'Crédito':'Débito'}</b>
                                </span>
                                <hr />
                                <span>Diferencia: 
                                    <b>{moneyFormat(invoiceInfo.bill != undefined? invoiceInfo.bill.total - total:0)}</b>
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="submitContainer">
                        <FormButton negative={true} text={'Cancelar'} onClick={()=>{
                            popOutAlert();
                        }}/>
                        <FormButton disabled={mode == undefined? true:disabled} text={'Generar nota'}/>
                    </div>
                </form>
            )}
        </div>
    )
}