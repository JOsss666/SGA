import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { LoadingSpace } from "../LoadingSpace";


export function FormNewThirdPartyDelegation({forUpdate,instnacePreInfo}){

    // Requirements
    const {appInfo} = useAppInfo();

    // Control
    const [data,setData] = useState(instnacePreInfo ?? {});
    const [loading,setLoading] = useState();
    const [disabled,setDisabled] = useState(false);
    const [processInstances,setProcessInstances] = useState([]);
    const [thirdparties,setThirdparties] = useState([]);
    const [clientOrders,setClientOrders] = useState([]);
    const [loadingOrders,setLoadingOrders] = useState(false);
    const [ordersError,setOrdersError] = useState('');

    // FormInfo
    const [thirdPartyInfo,setThirdPartyInfo] = useState({});
    const [instnaceInfo,setInstanceInfo] = useState({});
    const [orderRelations,setOrderRelations] = useState([]);

    const FormInfo = {
        thirdParty_id:thirdPartyInfo.id,
        instance_id:instnaceInfo.id,
        instance_step:instnaceInfo.step_id,        
    };

    // Info getters
    const getThirdParties =async()=>{
        let res = await postInfo('/getSuppliers',{
            company_id:appInfo.company_id,
            type:'supplier'
        })
        if(res[0]===true){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.names} ${element.indentification_type}:${element.indentification_number}`,
                    value:element
                })
            });
            setThirdparties(C);
        }
    };

    const getProcessInstance =async()=>{
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            status:['active'],
            id:instnaceInfo.id
        })
        console.log(res);
        if(res[0] === true){
            if(res[1].length == 1){
                setData(res[1][0]);
                setInstanceInfo(res[1][0]);
                return;
            }
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.process_code}#${element.ownSerial}`,
                    value:element
                })
            });
            console.log('Procesos disponibles: ',C)
            setProcessInstances(C);
        }
    };


    // Handlers

    const handleGetInitialInfo = async()=>{
        setDisabled(true);
        setLoading(true);
        await getProcessInstance();
        await getThirdParties();
        setLoading(false);
        setDisabled(false);
    }


    // Events Listeners

    useEffect(()=>{
        let cancelled = false;
        setClientOrders([]);
        setOrdersError('');
        setLoadingOrders(false);
        if(instnaceInfo.id == undefined || appInfo.company_id == undefined) return;

        const loadOrdersWithItems = async()=>{
            setLoadingOrders(true);
            try {
                const ordersResponse = await postInfo('/getDocuments', {
                    company_id:appInfo.company_id,
                    allowedTypes:['Client Order'],
                    instance_id:instnaceInfo.id
                });
                if(cancelled) return;
                if(ordersResponse[0] !== true || !Array.isArray(ordersResponse[1])){
                    throw new Error('No se pudieron cargar las órdenes de cliente.');
                }
                const orders = ordersResponse[1];
                if(orders.length === 0) return;

                const itemsResponse = await postInfo('/getServiceMovements', {
                    company_id:appInfo.company_id,
                    doc_ids:[...new Set(orders.map(order => order.id))]
                });
                if(cancelled) return;
                if(itemsResponse[0] !== true || !Array.isArray(itemsResponse[1])){
                    throw new Error('No se pudieron cargar los ítems de las órdenes de cliente.');
                }

                const itemsByDocument = new Map();
                for(const item of itemsResponse[1]){
                    const documentId = String(item.doc_id);
                    if(!itemsByDocument.has(documentId)) itemsByDocument.set(documentId, []);
                    itemsByDocument.get(documentId).push(item);
                }
                setClientOrders(orders.map(order => ({
                    ...order,
                    items:itemsByDocument.get(String(order.id)) ?? []
                })));
            } catch(error) {
                if(!cancelled) setOrdersError(error.message || 'No se pudieron cargar las órdenes y sus ítems.');
            } finally {
                if(!cancelled) setLoadingOrders(false);
            }
        };

        loadOrdersWithItems();
        return ()=>{ cancelled = true; };
    },[instnaceInfo.id, appInfo.company_id])

    useEffect(()=>{
        handleGetInitialInfo();
    },[])
    
    useEffect(()=>{
        console.log('Data: ',clientOrders);
    },[clientOrders])


    return(
        <div className="FormNewThirdPartyDelegation">
            <BoldTitle text={forUpdate ? 'Editar asignación a proveedor':'Asiganción a proveedor'}/>
            <DescriptionSpan text={'Administre y asigne ordenes de cliente a proveedores'}/>
            {!loading && (
                <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                }}>
                    {data.id == undefined && (
                        <SearchinList title={'Proceso adjunto'} placeHolder={'Seleccione el proceso'} disabled={disabled} list={processInstances} action={setInstanceInfo}/>
                    )}
                    <div className="blokItemsContainer">
                        {loadingOrders && <LoadingSpace title={'Cargando órdenes e ítems'}/>}
                        {ordersError && <p role="alert">{ordersError}</p>}
                        {!loadingOrders && !ordersError && instnaceInfo.id != undefined && clientOrders.length === 0 && (
                            <p>No hay órdenes de cliente para este proceso.</p>
                        )}
                        {clientOrders.map((order)=>(
                            <div className="orderBlock" key={order.id}>
                                <div className="headOrderBlock">
                                    <h3>{`${order.document_type}#${order.ownSerial}`}</h3>
                                </div>
                                {order.items.length > 0 ? (
                                    <ul aria-label={`Ítems de la orden ${order.ownSerial}`}>
                                        {order.items.map(item => (
                                            <li key={item.id}>
                                                <span>{item.service_name || item.description || `Servicio #${item.service_id}`}</span>
                                                {' — Cantidad: '}{item.units}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>Esta orden no tiene ítems adjuntos.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}
