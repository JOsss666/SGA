import { useEffect, useState } from "react";
import { useAlert, useAppInfo } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import './FormNewENote.css'
import { SearchinList } from "../../components/SearchInList";
import { moneyFormat, newElectronicNote, postInfo, printCashRecipt } from "../../../../utils/functions";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { isElectron } from "../../../../App";

export function FormNewENote(){

    // Requirtements
    const {appInfo,userConfig,userInfo,appConfig} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();

    // Control
    const [step,setStep] = useState(0);
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [thirdparties,setThirdParties] = useState([]);
    const [invoices,setInvoices] = useState([]);
    
    // FormInfo
    const [mode,setMode] = useState();
    const [type,setType] = useState('Credit Note');
    const [thirdParyInfo,setThirdPartyInfo] = useState({});
    const [invoiceInfo,setInvoiceInfo] = useState({});
    const [correction_code,setCorrection_code] = useState();
    const [description,setDescription] = useState('')
    const [items,setItems] = useState([]);
    const [total,setTotal] = useState();

    const FormInfo = {
        company_info:appInfo,
        customer:thirdParyInfo,
        user_id:userInfo.user_id,
        document:{
            correction_code,
            description,    
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
        console.log(res);
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

    const getInvoiceInfo = async(bill_number)=>{
        let res = await postInfo('/electronicFacturationController.getDocumentFullInfo',{
            bill_numer:bill_number
        });
        console.log(res);
        if(res.status == 'OK'){
            setInvoiceInfo(res.data)
            setItems(res.data.items);
        };
    }

    // Creation Functions

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

    const handleCreationOfNote = async(doc_id)=>{
        let itemsToFac = [];
        itemBlocks.forEach(element => {
            element.items.forEach(item => {
                console.log('??? ',item)
                itemsToFac.push(
                    {
                        "code_reference": item.code? item.code:item.service_id,
                        "name": item.name? item.name:item.service_name,
                        "quantity": parseFloat(item.units),
                        "discount": 0,
                        "discount_rate": 0,
                        "price": parseFloat(item.unit_value),
                        "tax_rate": "19.00",
                        "unit_measure_id": 70,
                        "standard_code_id": 1,
                        "is_excluded": 0,
                        "tribute_id": 1,
                        "withholding_taxes": []
                    }
                )
            });
        });
        let res = await newElectronicNote({
            company_info:appInfo,
            customer:thirdParyInfo,
            user_id:userInfo.user_id,
            document:FormInfo,
            items:items,
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
        }
    }

    const createNote = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/facturation/newNote',{
            company_id:appInfo.company_id,
            store_id:6,

        });
        console.log(res);
        if(typeof(parseInt(res.id)) == 'number'){
            addNotification({
                type:'aproved',
                title:`Recibo de caja #${res.id} creado correctamente`,
                description:`El recibo de caja #${res.id} fue creado correctamente`
            })
            handleCreationOfNote(res.id);
            FormInfo["doc_id"] = res.id
            FormInfo['instance_id'] = instance_id;
            FormInfo["ownSerial"] = res.ownSerial;
            if(isElectron){
                await printCashRecipt(FormInfo,appInfo,true);
                await printCashRecipt(FormInfo,appInfo,false);
            }
            FormInfo["user_id"] = userInfo.user_id,
            FormInfo['transactionDetails'] = []
            /*
            itemBlocks.forEach(element => {
                console.log(element)
                element.items.forEach(item => {
                    console.log('EL> ',item)
                    FormInfo.transactionDetails.push({
                        account_id:item.exit_account,
                        subtotal:parseFloat(item.units)*parseFloat(item.unit_value),
                        total:parseFloat(item.units)*parseFloat(item.unit_value),
                        type:item.type == 'service'? 'serviceMovement':'inventoryMovement',
                        nature: type == 'Credit Note'? 'CR':'DB'
                    })
                });
            });
            items.forEach(element => {
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
            }); */
            // Pendiente definir como se contabiliza la nota debito o credito
            //await toAccount();
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

    // utils functions
    
    const handleSelectInvoice = async(element)=>{
        if(element.id == undefined) return;
        await getInvoiceInfo(element.number);
    }

        // Values change Handle events
        
        const updateItemValue = (itemIndex, value,units) => {
            items.forEach((element,index) => {
                console.log(index,itemIndex)
                console.log(element);
            });
            setItems(prev => 
                prev.map((item,index) => 
                    itemIndex === index
                        ? { ...item, ['total']: (parseFloat(value) * parseFloat(units)) * (1 + (parseFloat(item.tax_rate)/100)) } 
                        : item
                    )
                );
            };

    // EventsListeners

    useEffect(()=>{
        if(mode == undefined || mode == null)return;
        getThirdParties();
        getInvoices(); 
        handleUserConfig();
    },[mode]);


    useEffect(() => {
        console.log('Mod Items')
        const s = items.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
        setTotal(s);
    }, [items]);

    useEffect(() => {
        console.log('Act total',total)
        if(invoiceInfo.bill == undefined) return;
        console.log('Ttl Actual',total);
        console.log('Ttt Original ',invoiceInfo.bill.total);
        if(total > parseFloat(invoiceInfo.bill.total)){
            console.log('Es debito')
            setType('Debit Note');
        }else{
            console.log('Es crédito')
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
                <form className="step1Form" action="" onSubmit={(e)=>{
                    e.preventDefault();
                    setStep(1);
                }}>
                    <SearchinList disabled={disabled} action={setMode} title={'Tipo de nota'} placeHolder={'Seleccionar tipo de nota'} list={[
                        {text:'Asociada a una factura registrada en SGA',value:'1'},  
                        {text:'Asociada a un tercero',value:'2'}
                    ]}/>
                    <FormButton disabled={mode == undefined? true:disabled} text={'Continuar'}/>
                    <FormButton negative={true} text={'Cancelar'} onClick={()=>{
                        popOutAlert();
                    }}/>
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
                    {invoiceInfo.bill != undefined && (
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
                                        value={parseFloat(element.quantity)?.toFixed(2)}
                                        disabled={disabled}/>
                                    <FormInput 
                                        title={'Precio'}
                                        type={'number'}
                                        value={element.price}
                                        action={(value)=>{
                                            console.log(value)
                                            updateItemValue(index,value,element.quantity);
                                        }}
                                        disabled={disabled}/>
                                    <FormInput 
                                        title={'Descuento %'}
                                        value={element.discount_rate}
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