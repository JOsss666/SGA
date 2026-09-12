import { useEffect, useMemo, useRef, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { SearchinList } from "../../components/SearchInList";
import { useAlert, useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { LoadingSpace } from "../LoadingSpace";
import { FormButton } from "../../components/FormButton";
import './FormNewThirdPartyDelegation.css'
import { ClientOrderDelegationCard } from "../../components/clientOrderDelegationCard";
import { PreviewFile } from "../Preview/PreviewFile";
import { urlSer } from '../../../../App';

async function delegationRequest(path, payload) {
    const response = await fetch(`${urlSer}/process/orders-delegation/${path}`, {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json','X-SGA-Company-Id':String(payload.company_id)},
        body:JSON.stringify(payload), signal:AbortSignal.timeout(60000)
    });
    const result = await response.json();
    if(!response.ok || !result.ok) throw new Error(result.error?.message || result.error || 'No se pudo completar la operación.');
    return result;
}

export function FormNewThirdPartyDelegation({instnacePreInfo,reloadFun}){

    // Requirements
    const {appInfo} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();

    // Control
    const [data,setData] = useState(instnacePreInfo ?? {});
    const [loading,setLoading] = useState();
    const [disabled,setDisabled] = useState(false);
    const [processInstances,setProcessInstances] = useState([]);
    const [thirdparties,setThirdparties] = useState([]);
    const [clientOrders,setClientOrders] = useState([]);
    const [loadingOrders,setLoadingOrders] = useState(false);
    const [ordersError,setOrdersError] = useState('');
    const [saving,setSaving] = useState(false);
    const [saveMessage,setSaveMessage] = useState('');
    const [saveError,setSaveError] = useState('');
    const [canAssign,setCanAssign] = useState(false);
    const [loadVersion,setLoadVersion] = useState(0);
    const requestId = useRef(null);
    const savingRef = useRef(false);

    // FormInfo
    const [instnaceInfo,setInstanceInfo] = useState(()=>({id:instnacePreInfo?.instance_id ?? instnacePreInfo?.id}));
    const [orderRelations,setOrderRelations] = useState([]);

    const relationsByDocument = useMemo(()=>{
        const grouped = new Map();
        for(const relation of orderRelations){
            const documentId = String(relation.doc_id);
            if(!grouped.has(documentId)) grouped.set(documentId, new Map());
            grouped.get(documentId).set(String(relation.item_id), relation);
        }
        return grouped;
    },[orderRelations]);

    const pendingRelations = orderRelations.filter(relation=>relation.asigned && !relation.disabled);

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
            //status:['active'],
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

    const handleRelationChange = (index, field, value)=>{
        const allowedFields = ['doc_id', 'item_id', 'thirdParty_id', 'thirdParty_name', 'disabled', 'asigned', 'asignationNote'];
        if(savingRef.current || !canAssign || !Number.isInteger(index) || !allowedFields.includes(field)) return;
        requestId.current = null;

        setOrderRelations(previousRelations => {
            if(index < 0 || index >= previousRelations.length || previousRelations[index].disabled) return previousRelations;
            return previousRelations.map((relation, relationIndex) => (
                relationIndex === index ? {...relation, [field]:value} : relation
            ));
        });
    };

    const handleSupplierChange = (documentId, itemId, supplier)=>{
        if(savingRef.current || !canAssign) return;
        requestId.current = null;
        const supplierId = supplier?.id ?? null;
        const asigned = supplierId !== null && supplierId !== '';
        setOrderRelations(previousRelations => previousRelations.map(relation => {
            if(disabled || relation.disabled || String(relation.doc_id) !== String(documentId) || String(relation.item_id) !== String(itemId)){
                return relation;
            }
            return {
                ...relation,
                thirdParty_id:asigned ? supplierId : null,
                thirdParty_name:asigned ? supplier?.names ?? '' : '',
                asigned
            };
        }));
    };

    const handlePreviewAttachment = (attachmentId)=>{
        popInAlert(<PreviewFile id={attachmentId}/>);
    };

    const handleGetInitialInfo = async()=>{
        setDisabled(true);
        setLoading(true);
        try {
            await Promise.all([getProcessInstance(),getThirdParties()]);
        } catch(error) {
            setOrdersError(error.message || 'No se pudo cargar la información inicial.');
        } finally {
            setLoading(false);
            setDisabled(false);
        }
    }

    const handleSave = async()=>{
        if(savingRef.current || !canAssign || loadingOrders || !pendingRelations.length) return;
        savingRef.current = true;
        setSaving(true);
        setSaveError('');
        setSaveMessage('');
        requestId.current ??= crypto.randomUUID();
        try {
            const result = await delegationRequest('register', {
                company_id:appInfo.company_id, instance_id:instnaceInfo.id,
                request_id:requestId.current,
                relations:pendingRelations.map(({doc_id,item_id,thirdParty_id,asignationNote})=>({doc_id,item_id,thirdParty_id,asignationNote}))
            });
            setSaveMessage(result.message);
            // Bloquear inmediatamente los ítems confirmados, incluso si falla la recarga.
            const savedItems = new Set(result.delegations.flatMap(group=>group.item_ids.map(String)));
            setOrderRelations(previous=>previous.map(relation=>savedItems.has(String(relation.item_id)) ? {...relation,disabled:true} : relation));
            requestId.current = null;
            setLoadVersion(version=>version+1);
            reloadFun?.();
        } catch(error) {
            setSaveError(`${error.message} Puedes reintentar: la solicitud conserva su identificador para evitar duplicados.`);
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };


    // Events Listeners

    useEffect(()=>{
        let cancelled = false;
        setClientOrders([]);
        setOrderRelations([]);
        setOrdersError('');
        setCanAssign(false);
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
                if(!Array.isArray(ordersResponse[1])){
                    throw new Error('No se pudieron cargar las órdenes de cliente.');
                }
                const orders = ordersResponse[1];
                const saved = await delegationRequest('list',{company_id:appInfo.company_id,instance_id:instnaceInfo.id});
                if(cancelled) return;
                if(!saved.configured) throw new Error('Este proceso no tiene configuración de delegación.');
                setCanAssign(saved.can_assign);
                if(orders.length === 0) return;

                const itemsResponse = await postInfo('/getServiceMovements', {
                    company_id:appInfo.company_id,
                    doc_ids:[...new Set(orders.map(order => order.id))]
                });
                if(cancelled) return;
                if(!Array.isArray(itemsResponse[1])){
                    throw new Error('No se pudieron cargar los ítems de las órdenes de cliente.');
                }

                const itemsByDocument = new Map();
                const savedByItem = new Map(saved.relations.map(relation=>[String(relation.item_id),relation]));
                for(const item of itemsResponse[1]){
                    const documentId = String(item.doc_id);
                    if(!itemsByDocument.has(documentId)) itemsByDocument.set(documentId, []);
                    itemsByDocument.get(documentId).push(item);
                }
                setClientOrders(orders.map(order => ({
                    ...order,
                    items:itemsByDocument.get(String(order.id)) ?? []
                })));
                setOrderRelations(orders.flatMap(order => (
                    (itemsByDocument.get(String(order.id)) ?? []).map(item => savedByItem.get(String(item.id)) ?? ({
                        doc_id:order.id,
                        item_id:item.id,
                        thirdParty_id:null,
                        thirdParty_name:'',
                        disabled:false,
                        asigned:false,
                        asignationNote:''
                    }))
                )));
            } catch(error) {
                if(!cancelled) setOrdersError(error.message || 'No se pudieron cargar las órdenes y sus ítems.');
            } finally {
                if(!cancelled) setLoadingOrders(false);
            }
        };

        loadOrdersWithItems();
        return ()=>{ cancelled = true; };
    },[instnaceInfo.id, appInfo.company_id, loadVersion])

    useEffect(()=>{
        handleGetInitialInfo();
    },[])
    
    useEffect(()=>{
        console.log('Data: ',clientOrders);
    },[clientOrders])


    return(
        <div className="FormNewThirdPartyDelegation">
            <BoldTitle text={'Asignación a proveedores'}/>
            <DescriptionSpan text={'Administre y asigne los ítems de las órdenes de cliente a proveedores'}/>
            {!loading && (
                <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                    handleSave();
                }}>
                    {data.id == undefined && (
                        <SearchinList title={'Proceso adjunto'} placeHolder={'Seleccione el proceso'} disabled={disabled || saving} list={processInstances} action={instance=>{
                            requestId.current=null;
                            setSaveMessage('');
                            setSaveError('');
                            setInstanceInfo(instance);
                        }}/>
                    )}
                    <div className="blokItemsContainer">
                        {loadingOrders && <LoadingSpace title={'Cargando órdenes e ítems'}/>}
                        {ordersError && <p role="alert">{ordersError}</p>}
                        {!loadingOrders && !ordersError && instnaceInfo.id != undefined && clientOrders.length === 0 && (
                            <p>No hay órdenes de cliente para este proceso.</p>
                        )}
                        {clientOrders.map((order)=>(
                            <ClientOrderDelegationCard
                                key={order.id}
                                order={order}
                                relationsByItem={relationsByDocument.get(String(order.id))}
                                thirdparties={thirdparties}
                                disabled={disabled || saving || !canAssign}
                                onSupplierChange={(itemId, supplier) => handleSupplierChange(order.id, itemId, supplier)}
                                onPreviewAttachment={handlePreviewAttachment}
                                onNoteChange={(itemId,value)=>{
                                    const index=orderRelations.findIndex(relation=>String(relation.doc_id)===String(order.id) && String(relation.item_id)===String(itemId));
                                    handleRelationChange(index,'asignationNote',value);
                                }}
                            />
                        ))}
                    </div>
                    {instnaceInfo.id != undefined && (
                        <>
                            {saveError && <p role="alert">{saveError}</p>}
                            {saveMessage && <p role="status">{saveMessage}</p>}
                            {!loadingOrders && !ordersError && !canAssign && <p>La asignación se habilita cuando el proceso está en el paso de asignación a proveedores.</p>}
                            <div className="footer">
                                <FormButton negative={true} disabled={saving} text={'Cerrar'} onClick={event=>{event.preventDefault();popOutAlert();}}/>
                                <FormButton disabled={saving || loadingOrders || !canAssign || !pendingRelations.length} loading={saving} text={saving ? 'Guardando…' : `Guardar asignaciones (${pendingRelations.length})`}/>
                            </div>
                        </>
                    )}
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}
