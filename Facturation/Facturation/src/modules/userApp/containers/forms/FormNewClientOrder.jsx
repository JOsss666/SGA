import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { LoadingSpace } from "../LoadingSpace";
import './FormNewClientOrder.css'
import { postInfo } from "../../../../utils/functions";
import { ProcessStatusAlert } from "../Alerts/ProcessStatusAlert";
import { FileInput } from "../../components/FileInput";

export function FormNewClientOrder({params,reloadFun}){

    // requirements
    const [info,setInfo] = useState(params != undefined? params:{})
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popInAlert,popOutAlert} = useAlert();
    const [stores,setStores] = useState([]);
    const [thirdParties,setThirdParties] = useState([]);
    const [processInstances,setProcessInstances] = useState([]);
    const [step_id,setStep_id] = useState();
    const [productsServicesArray,setProductsServicesArray] = useState([]);

    // control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [cotizationView,setCotizationView] = useState(true);
    const [canSetManualValue,setCanSetManualValue] = useState(false);

    // formInfo

    const [thirdParty_id,setThirdParty_id] = useState(params != undefined? params.thirdParty_id:undefined);
    const [status,setStatus] = useState('active');
    const [total,setTotal] = useState(0);
    const [description,setDescription] = useState('');
    const [attached,setAttached] = useState('');
    const [instance_id,setInstace_id] = useState();
    const [store_id,setStore_id] = useState();
    const [productsServices,setProductsServices] = useState([]);

    let formInfo = {
        company_id:appInfo.company_id,
        created_by:userInfo.user_id,
        thirdParty_id,
        doc_type:'Client Order',
        status,
        subTotal:total,
        total,
        description,
        attached,
        instance_id,
        step_id,
        store_id,
        productsServices
    }

    // handlersFunctions

    const formatCurrency = (value) =>
        new Intl.NumberFormat("es-CO").format(value);

    const handleInstnaceSelect = (element)=>{
        console.log(`Elemento seleccionado: ${element}`)
        setInstace_id(element.id);
        setStep_id(element.step_id);
        setThirdParty_id(element.thirdParty_id);
        setInfo(prevInfo => ({
            ...prevInfo,            // Mantenemos todas las propiedades actuales (nombre, fecha, etc.)
            thirdParty_id: element.thirdParty_id // Sobrescribimos solo el ID del tercero
        }));
    }

    const addPService = (newPayment) => {
            if(newPayment.id != undefined){
                setProductsServices(prev => {
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
        const removePService= (id) => {
            setProductsServices(prev => prev.filter(item => item.id !== id));
        };
    
       const updatePServiceValue = (id, key, newValue) => {
            setProductsServices(prev => 
                prev.map(item => {
                    if (item.id === id) {
                        // Creamos el nuevo valor para el campo específico
                        const updatedItem = { ...item, [key]: newValue };
                        
                        // Calculamos el total usando los datos más recientes
                        const units = updatedItem.units || 0;
                        const price = updatedItem.unit_value || 0;
                        
                        return { ...updatedItem, total: units * price };
                    }
                    return item;
                })
            );
        };

        const updatePServiceUnits = (id, newValue) => {
            setProductsServices(prev => 
                prev.map(item => {
                    if (item.id === id) {
                        const updatedItem = { ...item, units: newValue };
                        
                        const units = updatedItem.units || 0;
                        const price = updatedItem.unit_value || 0;
                        
                        return { ...updatedItem, total: units * price };
                    }
                    return item;
                })
            );
        };

        const updatePServiceDescription = (id, newValue) => {
            setProductsServices(prev =>
                prev.map(item =>
                item.id === id
                ? { ...item, ['description']: newValue }
                : item
                )
            );
        };
            

    // getters of info

    const getProducts = async()=>{
        console.log('Cargando productos')
        let res = await postInfo('/inventory/getProducts',{
            company_id:appInfo.company_id,
            type:'service',
        })
        console.log(res);
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`${element.name} - #${element.code}`,
                    value:element
                })
                setProductsServicesArray(C)
            });
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

    const getInstances = async(allowedInstances,allowedTypes)=>{
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id
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
            setProcessInstances(C);
        }
    }

    const getThirdParties = async()=>{
        let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.names}  ${element.indentification_type}_${element.indentification_number}`,
                    value:element.id
                })
            });
            setThirdParties(C);
        }
    }

    // PreProcess functions

    const handleUserConfig = async()=>{
        setDisabled(true)
        setLoading(true)
        await getThirdParties();
        await getProducts();
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

            // Filtro para busqueda de Instancias de Procesos
            if(!userConfig.access.process_instances.overAll && info.instance_id == undefined){
                if(userConfig.access.process_instances.enabled.length > 1){
                    await getInstances(userConfig.access.process_instances.enabled,undefined);
                }else{
                        temInfo.instance_id = userConfig.access.process_instances.enabled[0]
                        setInstace_id(userConfig.access.process_instances.enabled[0])
                }
            }else if(info.instance_id != undefined){
                temInfo.instance_id = info.instance_id;
                temInfo.step_id = info.step_id;
                setInstace_id(info.instance_id);
                setStep_id(info.step_id);
            }
            else{
                await getInstances()
            }
        }

        temInfo.thirdParty_id = info.thirdParty_id;

        if(temInfo != {}){
            console.log(temInfo);
            setInfo(temInfo);
        }
        setLoading(false);
        setDisabled(false);
    }

    // Envents Hooks

    useEffect(()=>{
        console.log(productsServices)
        let newTtl = 0;
        productsServices.forEach(element => {
            if(element.total != "" && element.total != undefined){
                newTtl += parseFloat(element.total);
            }
        });
        setTotal(newTtl);
    },[productsServices])

    useEffect(()=>{
        handleUserConfig();
    },[])

    useEffect(()=>{
        console.log(`---> ${thirdParty_id}`)
    },[thirdParty_id])

    // create function

    const createClientOrder = async()=>{
        setDisabled(true);
        setLoading(true)
        let res = await postInfo('/facturation/newClientOrder',formInfo);
        if(typeof(parseInt(res.id)) == 'number'){
            addNotification({
                type:'aproved',
                title:`Orden de cliente #${res.id}`,
                description:`La orden de cliente #${res.id}, fue creada correctamente.`
            });
        }else{
            addNotification({
                type:'error',
                title:`Error al crear la orden de cliente`,
                description:`Hubo un problema al crear la orden de cliente, intentelo de nuevo.`
            });
        }
        setDisabled(false);
        setLoading(false);
        popOutAlert();
        reloadFun?.();
        if(instance_id != undefined){
            popInAlert(<ProcessStatusAlert instance_id={instance_id} reloadFun={reloadFun}/>)
        }
    }

    return(
        <div className="FormNewClientOrder">
            {!loading && (
                <>
                    <BoldTitle text={'Nueva orden de cliente'}/>
                    <form action="" onSubmit={(e)=>{
                        e.preventDefault();
                        console.log(formInfo);
                        createClientOrder();
                    }}>
                        {info.store_id == undefined && (
                            <SearchinList title={'Tienda'} action={setStore_id} list={stores} placeHolder={'Seleccione la tienda'} disabled={disabled}/>
                        )}
                        {info.instance_id == undefined && (
                            <SearchinList title={'Proceso'} action={handleInstnaceSelect} list={processInstances} placeHolder={'Seleccione el proceso (opcional)'} disabled={disabled}/>
                        )}
                        {info.thirdParty_id == undefined && (
                            <SearchinList title={'Cliente'} action={setThirdParty_id} list={thirdParties} placeHolder={'Seleccione el tercero'} disabled={disabled}/>
                        )}
                        {canSetManualValue && (
                            <div className="SwitchValCot" onClick={()=>{
                                setCotizationView(!cotizationView)
                            }}>
                                <strong className={cotizationView? 'activeStichH':''}>Cotización</strong>
                                <strong className={!cotizationView? 'activeStichH':''}>Valor</strong>
                            </div>
                        )}
                        {!cotizationView && (
                            <FormInput title={'Valor'} type={'number'} disabled={disabled} action={setTotal} placeholder={'$ 0'}/>
                        )}
                        {cotizationView && (
                            <div className="gridServicesProductsContainer">
                                <SearchinList title={'Productos - Servicios'}
                                    action={addPService}
                                    list={productsServicesArray}
                                    placeHolder={'Agregar producto o servicio'}
                                    disabled={disabled}
                                />
                                <div className="gridPaymentMethods">
                                    {productsServices.map((element,index)=>(
                                        <div key={index} className="PaymentMethodCard">
                                            <strong>{element.name}</strong>
                                            <input className="unitsInp" step={1} required type="number" min={1} placeholder="unidades" onChange={(e)=>{
                                                updatePServiceUnits(element.id,e.target.value)
                                            }}/>
                                            <input step={0.001} type="number" required placeholder="Valor unitatio: $0" onChange={(e)=>{
                                                updatePServiceValue(element.id,"unit_value",e.target.value)
                                            }}/>
                                            <input step={0.001} type="text" placeholder="Descripción" onChange={(e)=>{
                                                updatePServiceDescription(element.id,e.target.value)
                                            }}/>
                                            <span className="ttlValUnitIndicator">{formatCurrency(element.total || 0)}</span>
                                            <i title={`Eliminar ${element.name}`} className="fa-solid fa-trash delPaymentBtn" onClick={()=>{
                                                removePService(element.id)
                                            }}/>
                                        </div>
                                    ))}
                                </div>
                                <h5 className="IndicatorTotalValue">
                                    Valor total: $ {formatCurrency(total)}
                                </h5>
                            </div>
                        )}
                        <FormInput title={'Descripción'} textArea={true} disabled={disabled} action={setDescription} placeholder={'Referencia de la orden'}/>
                        <FileInput placeholder={'Adjuntar archivo'} action={setAttached}/>
                        <SearchinList title={'Estado'} action={setStatus} list={[
                            {text:'active'},
                            {text:'disabled'},
                            {text:'blocked'},
                            {text:'reported'},
                            {text:'canceled'},
                            {text:'pending'}
                        ]} placeHolder={'Estado de la orden de cliente'} disabled={disabled}/>
                        <FormButton text={'Crear orden de cliente'}/>
                    </form>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho...'}/>
            )}
        </div>
    )
}