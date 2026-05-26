import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { LoadingSpace } from "../LoadingSpace";
import './FormNewClientOrder.css'
import { postInfo, printClientOrder } from "../../../../utils/functions";
import { ProcessStatusAlert } from "../Alerts/ProcessStatusAlert";
import { FileInput } from "../../components/FileInput";
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormNewThirdParties } from "./FormNewThirdParties";
import { LabelValue } from "../../components/LabelValue";
import { SwitchOption } from "../../components/SwitchOption";
import { TagIndicator } from "../../components/TagIndicator";
import { isElectron } from "../../../../App";

export function FormNewClientOrder({params,reloadFun,canRepeatServices}){

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
    const [taxedTransactions,setTaxedTransactions] = useState(false);

    // control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [cotizationView,setCotizationView] = useState(true);
    const [canSetManualValue,setCanSetManualValue] = useState(false);

    // formInfo

    const [thirdParty_id,setThirdParty_id] = useState(params != undefined? params.thirdParty_id:undefined);
    const [thirdParty_name,setThirdParty_name] = useState(params != undefined? params.thirdParty_name:undefined);
    const [status,setStatus] = useState('active');
    const [total,setTotal] = useState(0);
    const [description,setDescription] = useState('');
    const [attached,setAttached] = useState('');
    const [instance_id,setInstace_id] = useState();
    const [instanceOwnSerial,setInstanceOwnSerial] = useState();
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
        instances: [{id:instance_id,step_id:step_id}],
        store_id,
        productsServices
    }

    // handlersFunctions

    const formatCurrency = (value) =>
        new Intl.NumberFormat("es-CO").format(value);

    const handleInstnaceSelect = (element)=>{
        setInstace_id(element.id);
        setInstanceOwnSerial(element.ownSerial);
        setStep_id(element.step_id);
        setThirdParty_id(element.thirdParty_id);
        setThirdParty_name(element.thirdParty_name);
        setInfo(prevInfo => ({
            ...prevInfo,            // Mantenemos todas las propiedades actuales (nombre, fecha, etc.)
            thirdParty_id: element.thirdParty_id // Sobrescribimos solo el ID del tercero
        }));
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

    const handleAddProduct = (newService) => {
        if (newService.product_id !== undefined) {
            const uniqueLineId = `${newService.product_id}-${Date.now()}-${Math.random()}`;

            const serviceWithLineId = {
            ...newService,
            id:newService.product_id,
            lineId: uniqueLineId,
            units: 0,
            manualPrice:false,
            unit_value: getEffectivePrice(newService, 0),
            total: 0
        };
            console.log(serviceWithLineId);
            
            setProductsServices(prev => [...prev, serviceWithLineId]);
        }
    };

    const removePService = (lineId) => {
        setProductsServices(prev => prev.filter(item => item.lineId !== lineId));
    };

  const handleEditItemDetail = (lineId, key, value) => {
    setProductsServices(prev =>
        prev.map(item => {

            if (item.lineId !== lineId) return item;

            let updatedValue =
                key === 'description'
                    ? value
                    : Number(value);

            let updatedItem = {
                ...item,
                [key]: updatedValue
            };

            if (key === 'unit_value') {
                updatedItem.manualPrice = true;
            }

            if (
                key === 'units' &&
                !updatedItem.manualPrice
            ) {
                const newPrice = getEffectivePrice(
                    item,
                    updatedValue
                );

                updatedItem.unit_value = newPrice;
            }

            updatedItem.total =
                (updatedItem.units || 0) *
                (updatedItem.unit_value || 0);

            return updatedItem;
        })
    );
};
            

    // getters of info

    const getProducts = async()=>{
        let res = await postInfo('/inventory/getComercialProducts',{
            company_id:appInfo.company_id,
            //type:'service',
        })
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
                    value:element
                })
            });
            setThirdParties(C);
        }
    }

    // PreProcess functions

     const handleThirdPartySelect = (element)=>{
        setThirdParty_id(element.id);
        setThirdParty_name(element.names);
    }

    const handleUserConfig = async()=>{
        setDisabled(true)
        setLoading(true)
        await getThirdParties();
        await getProducts();
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
            setInfo(temInfo);
        }
        setLoading(false);
        setDisabled(false);
    }

    const printItem = async()=>{
        await printClientOrder(formInfo,appInfo,true);
        await printClientOrder(formInfo,appInfo,false);
    }

    // Envents Hooks

    useEffect(()=>{
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
        if(isElectron){
            let prevInfo = {
                doc_type:'Client Order',
                company_id:appInfo.company_id,
                thirdParty_name,
                description,
                instance_id,
                instanceOwnSerial,
                doc_id:res.id,
                total,
                services:productsServices,
                ownSerial:res.ownSerial
            }
            await printClientOrder(prevInfo,appInfo,true);
            await printClientOrder(prevInfo,appInfo,false);
        }
        
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
                        createClientOrder();
                    }}>
                        {info.store_id == undefined && (
                            <SearchinList title={'Tienda'} action={setStore_id} list={stores} placeHolder={'Seleccione la tienda'} disabled={disabled}/>
                        )}
                        {info.instance_id == undefined && (
                            <SearchinList title={'Proceso'} action={handleInstnaceSelect} list={processInstances} placeHolder={'Seleccione el proceso (opcional)'} disabled={disabled}/>
                        )}
                        {info.thirdParty_id == undefined && (
                            <SearchinList title={'Cliente'} action={handleThirdPartySelect} list={thirdParties} placeHolder={'Seleccione el tercero'} disabled={disabled} specialOption={
                                <NewElementSelect title={'Crear nuevo tercero'} onClick={()=>{
                                    popInAlert(<FormNewThirdParties quickCreation={true} reloadFun={handleUserConfig}/>)
                                }}/>
                            }/>
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
                                    action={handleAddProduct}
                                    list={productsServicesArray}
                                    placeHolder={'Agregar producto o servicio'}
                                    disabled={disabled}
                                    noActVal={true}
                                    //canClear={true}
                                />
                                <div className="gridPaymentMethods">
                                    {productsServices.map((element)=>(
                                        <div key={element.lineId}>
                                            {taxedTransactions && element.taxed && (
                                                <div className="taxInfoC">
                                                    <div className="taxIndicator">
                                                        <i className="fa-solid fa-sack-dollar"/>
                                                        <span>{element.tax_name}</span>
                                                        <TagIndicator title={`${element.tax_rate}%`}/>
                                                        <strong>$ {formatCurrency(element.units * parseFloat(element.unit_value) * (parseFloat(element.tax_rate) / 100))}</strong>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="PaymentMethodCard">
                                                <strong>{element.name}</strong>
                                                <input className="unitsInp" step={1} required type="number" min={1} placeholder="unidades" onChange={(e)=>{
                                                    handleEditItemDetail(element.lineId,"units",e.target.value)
                                                }}/>
                                                <input step={0.001} type="number" placeholder={element.unit_value} onChange={(e)=>{
                                                    handleEditItemDetail(element.lineId,"unit_value",e.target.value)
                                                }}/>
                                                <input step={0.001} type="text" placeholder="Descripción" onChange={(e)=>{
                                                    handleEditItemDetail(element.lineId,"description",e.target.value)
                                                }}/>
                                                <span className="ttlValUnitIndicator">{formatCurrency(element.total || 0)}</span>
                                                <i title={`Eliminar ${element.name}`} className="fa-solid fa-trash delPaymentBtn" onClick={()=>{
                                                    removePService(element.lineId)
                                                }}/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <h5 className="IndicatorTotalValue">
                                    Valor total: $ {formatCurrency(total)}
                                </h5>
                            </div>
                        )}
                        <FormInput title={'Descripción'} textArea={true} disabled={disabled} action={setDescription} placeholder={'Referencia de la orden'}/>
                        <FileInput placeholder={'Adjuntar archivo'} action={setAttached} multiple={true}/>
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