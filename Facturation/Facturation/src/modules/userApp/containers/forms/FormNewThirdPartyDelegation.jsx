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

export function FormNewThirdPartyDelegation({instnacePreInfo,reloadFun,forUpdate=false,asignedDocument,clientOrders,ClientOrders,selectedDocumentIds=[],singleProvider=false}){

    // Requirements
    const {appInfo, userInfo} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();

    // Control
    const [data,setData] = useState(instnacePreInfo ?? {});
    const [loading,setLoading] = useState();
    const [disabled,setDisabled] = useState(false);
    const [processInstances,setProcessInstances] = useState([]);
    const [thirdparties,setThirdparties] = useState([]);
    const [loadingThirdparties,setLoadingThirdparties] = useState(false);
    const [thirdpartiesError,setThirdpartiesError] = useState('');
    const [loadedClientOrders,setLoadedClientOrders] = useState([]);
    const [loadingOrders,setLoadingOrders] = useState(false);
    const [ordersError,setOrdersError] = useState('');
    const [saving,setSaving] = useState(false);
    const [saveMessage,setSaveMessage] = useState('');
    const [saveError,setSaveError] = useState('');
    const [canAssign,setCanAssign] = useState(false);
    const [loadVersion,setLoadVersion] = useState(0);
    const requestId = useRef(null);
    const requestIdsByInstance = useRef(new Map());
    const savingRef = useRef(false);

    // FormInfo
    const [instnaceInfo,setInstanceInfo] = useState(()=>({id:instnacePreInfo?.instance_id ?? instnacePreInfo?.id}));
    const [orderRelations,setOrderRelations] = useState([]);
    const [bulkSupplier,setBulkSupplier] = useState(null);
    const requestedClientOrders = Array.isArray(clientOrders)
        ? clientOrders
        : Array.isArray(ClientOrders)
            ? ClientOrders
            : selectedDocumentIds;
    const selectedDocumentIdsKey = requestedClientOrders.map(String).sort().join(',');
    const selectedDocumentIdSet = useMemo(() => new Set(selectedDocumentIdsKey ? selectedDocumentIdsKey.split(',') : []), [selectedDocumentIdsKey]);
    const hasRequestedClientOrders = selectedDocumentIdSet.size > 0;

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
    const relationsToSave = forUpdate
        ? orderRelations.filter(relation=>relation.asigned)
        : pendingRelations;
    const bulkSupplierPlaceholder = loadingThirdparties
        ? 'Cargando proveedores…'
        : thirdparties.length === 0
            ? 'No hay proveedores registrados'
            : !canAssign
                ? `${thirdparties.length} proveedores cargados; el proceso está bloqueado`
                : 'Seleccione un proveedor';

    // Info getters
    const getThirdParties =async()=>{
        if(appInfo.company_id == undefined) return;
        setLoadingThirdparties(true);
        setThirdpartiesError('');
        try {
            let res;
            try {
                res = await postInfo('/getThirdParties',{
                    company_id:appInfo.company_id,
                    type:'supplier'
                });
            } catch {
                res = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
            }
            if(res[0] !== true || !Array.isArray(res[1])) throw new Error('No fue posible cargar los proveedores.');
            let suppliers = res[1].filter(element => ['supplier','both'].includes(String(element.type ?? '').toLowerCase()));
            if(suppliers.length === 0){
                const fallback = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
                if(fallback[0] === true && Array.isArray(fallback[1])){
                    suppliers = fallback[1].filter(element => ['supplier','both'].includes(String(element.type ?? '').toLowerCase()));
                }
            }
            setThirdparties(suppliers.map(element => ({
                text:`${element.names} ${element.indentification_type}:${element.indentification_number}`,
                value:element
            })));
        } catch(error) {
            setThirdparties([]);
            setThirdpartiesError(error.message || 'No fue posible cargar los proveedores.');
        } finally {
            setLoadingThirdparties(false);
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
            const belongsToEditedDocument = forUpdate && String(relation.doc_id) === String(documentId);
            const isSelectedItem = String(relation.doc_id) === String(documentId) && String(relation.item_id) === String(itemId);
            if(disabled || relation.disabled || (!belongsToEditedDocument && !isSelectedItem)){
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

    const handleBulkSupplierChange = (supplier)=>{
        if(savingRef.current || !canAssign) return;
        setBulkSupplier(supplier || null);
        const supplierId = supplier?.id ?? null;
        setOrderRelations(previousRelations => previousRelations.map(relation => {
            if(relation.disabled) return relation;
            return {
                ...relation,
                thirdParty_id:supplierId,
                thirdParty_name:supplier?.names ?? '',
                asigned:Boolean(supplierId)
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
            await Promise.all([hasRequestedClientOrders ? Promise.resolve() : getProcessInstance(),getThirdParties()]);
        } catch(error) {
            setOrdersError(error.message || 'No se pudo cargar la información inicial.');
        } finally {
            setLoading(false);
            setDisabled(false);
        }
    }

    const handleSave = async()=>{
        if(savingRef.current || !canAssign || loadingOrders || !relationsToSave.length) return;
        savingRef.current = true;
        setSaving(true);
        setSaveError('');
        setSaveMessage('');
        try {
            const relationsByInstance = new Map();
            for(const relation of relationsToSave){
                const instanceId = relation.instance_id ?? instnaceInfo.id;
                if(instanceId === undefined || instanceId === null || instanceId === '') throw new Error('No fue posible identificar el proceso de una orden de cliente.');
                if(!relationsByInstance.has(String(instanceId))) relationsByInstance.set(String(instanceId), []);
                relationsByInstance.get(String(instanceId)).push(relation);
            }
            const results = [];
            for(const [instanceId, relations] of relationsByInstance){
                const payload = {
                    company_id:appInfo.company_id,
                    user_id:userInfo.user_id,
                    instance_id:instanceId,
                    consolidated:singleProvider,
                    relations:relations.map(({doc_id,item_id,thirdParty_id,asignationNote})=>({doc_id,item_id,thirdParty_id,asignationNote}))
                };
                const requestIdentifier = requestIdsByInstance.current.get(instanceId) ?? crypto.randomUUID();
                const result = forUpdate
                    ? await delegationRequest('update',{...payload,delegation_document_id:asignedDocument})
                    : await delegationRequest('register',{...payload,request_id:requestIdentifier});
                if(!forUpdate) requestIdsByInstance.current.set(instanceId, requestIdentifier);
                results.push({instanceId,result});
            }
            setSaveMessage(results.map(({result})=>result.message).join(' '));
            if(forUpdate) {
                reloadFun?.();
                return;
            }
            // Bloquear inmediatamente los ítems confirmados, incluso si falla la recarga.
            const savedItems = new Set(results.flatMap(({result})=>result.delegations.flatMap(group=>group.item_ids.map(String))));
            setOrderRelations(previous=>previous.map(relation=>savedItems.has(String(relation.item_id)) ? {...relation,disabled:true} : relation));
            requestId.current = null;
            results.forEach(({instanceId})=>requestIdsByInstance.current.delete(instanceId));
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
        setLoadedClientOrders([]);
        setOrderRelations([]);
        setOrdersError('');
        setCanAssign(false);
        setLoadingOrders(false);
        if((instnaceInfo.id == undefined && !hasRequestedClientOrders) || appInfo.company_id == undefined) return;

        const loadOrdersWithItems = async()=>{
            setLoadingOrders(true);
            try {
                const ordersResponse = await postInfo('/getDocuments', {
                    company_id:appInfo.company_id,
                    allowedTypes:['Client Order'],
                    ...(instnaceInfo.id != undefined && !hasRequestedClientOrders ? {instance_id:instnaceInfo.id} : {}),
                    ...(selectedDocumentIdSet.size ? {allowedIds:[...selectedDocumentIdSet]} : {})
                });
                if(cancelled) return;
                if(!Array.isArray(ordersResponse[1])){
                    throw new Error('No se pudieron cargar las órdenes de cliente.');
                }
                const orders = ordersResponse[1];
                const instanceIds = [...new Set(orders.map(order=>order.instance_id ?? instnaceInfo.id).filter(Boolean).map(String))];
                if(!instanceIds.length || instanceIds.length !== new Set(orders.map(order=>order.instance_id ?? instnaceInfo.id).map(String)).size){
                    throw new Error('Las órdenes seleccionadas deben estar vinculadas a un proceso.');
                }
                const savedByInstance = new Map(await Promise.all(instanceIds.map(async instanceId => [
                    instanceId,
                    await delegationRequest('list',{
                        company_id:appInfo.company_id,
                        user_id:userInfo.user_id,
                        instance_id:instanceId,
                        ...(forUpdate ? {delegation_document_id:asignedDocument} : {})
                    })
                ])));
                if(cancelled) return;
                if([...savedByInstance.values()].some(saved=>!saved.configured)) throw new Error('Uno de los procesos no tiene configuración de delegación.');
                setCanAssign([...savedByInstance.values()].every(saved=>saved.can_assign));
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
                const savedByItem = new Map([...savedByInstance.values()].flatMap(saved=>saved.relations).map(relation=>[String(relation.item_id),relation]));
                for(const item of itemsResponse[1]){
                    const documentId = String(item.doc_id);
                    if(!itemsByDocument.has(documentId)) itemsByDocument.set(documentId, []);
                    itemsByDocument.get(documentId).push(item);
                }
                const ordersWithItems = orders.map(order => ({
                    ...order,
                    items:itemsByDocument.get(String(order.id)) ?? []
                }));
                const delegatedDocumentIds = new Set([...savedByInstance.values()].flatMap(saved=>saved.relations).map(relation=>String(relation.doc_id)));
                const visibleOrders = forUpdate
                    ? ordersWithItems.filter(order=>delegatedDocumentIds.has(String(order.id)))
                    : selectedDocumentIdSet.size
                        ? ordersWithItems.filter(order=>selectedDocumentIdSet.has(String(order.id)))
                        : ordersWithItems;
                setLoadedClientOrders(visibleOrders);
                const relations = orders.flatMap(order => (
                    (itemsByDocument.get(String(order.id)) ?? []).map(item => savedByItem.get(String(item.id)) ?? ({
                        doc_id:order.id,
                        item_id:item.id,
                        instance_id:order.instance_id ?? instnaceInfo.id,
                        thirdParty_id:null,
                        thirdParty_name:'',
                        disabled:false,
                        asigned:false,
                        asignationNote:''
                    }))
                ));
                setOrderRelations(forUpdate
                    ? relations.filter(relation => delegatedDocumentIds.has(String(relation.doc_id)))
                    : selectedDocumentIdSet.size
                        ? relations.filter(relation => selectedDocumentIdSet.has(String(relation.doc_id)))
                        : relations);
            } catch(error) {
                if(!cancelled) setOrdersError(error.message || 'No se pudieron cargar las órdenes y sus ítems.');
            } finally {
                if(!cancelled) setLoadingOrders(false);
            }
        };

        loadOrdersWithItems();
        return ()=>{ cancelled = true; };
    },[instnaceInfo.id, appInfo.company_id, loadVersion, forUpdate, asignedDocument, selectedDocumentIdsKey, hasRequestedClientOrders])

    useEffect(()=>{
        if(appInfo.company_id == undefined) return;
        handleGetInitialInfo();
    },[appInfo.company_id])
    
    useEffect(()=>{
        console.log('Data: ',loadedClientOrders);
    },[loadedClientOrders])


    return(
        <div className="FormNewThirdPartyDelegation">
            <BoldTitle text={forUpdate ? 'Editar asignación a proveedores' : 'Asignación a proveedores'}/>
            <DescriptionSpan text={forUpdate ? 'Actualice el proveedor y las notas de esta asignación.' : 'Administre y asigne los ítems de las órdenes de cliente a proveedores'}/>
            {!loading && (
                <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                    handleSave();
                }}>
                    {!forUpdate && !hasRequestedClientOrders && instnaceInfo.id == undefined && (
                        <SearchinList title={'Proceso adjunto'} placeHolder={'Seleccione el proceso'} disabled={disabled || saving} list={processInstances} action={instance=>{
                            requestId.current=null;
                            setSaveMessage('');
                            setSaveError('');
                            setInstanceInfo(instance);
                        }}/>
                    )}
                    <div className="bulkSupplierAssignment">
                        <SearchinList
                            title={'Asignar todas a'}
                            placeHolder={bulkSupplierPlaceholder}
                            list={thirdparties}
                            value={bulkSupplier}
                            canClear
                            disabled={disabled || saving || loadingThirdparties || loadingOrders || !canAssign}
                            disabledPlaceholder={bulkSupplierPlaceholder}
                            action={handleBulkSupplierChange}
                        />
                        <span>Aplica el proveedor a todos los ítems disponibles. Después puede cambiar cada ítem individualmente.</span>
                    </div>
                    <div className="blokItemsContainer">
                        {loadingThirdparties && <LoadingSpace title={'Cargando proveedores'}/>}
                        {thirdpartiesError && <p role="alert">{thirdpartiesError}</p>}
                        {loadingOrders && <LoadingSpace title={'Cargando órdenes e ítems'}/>}
                        {ordersError && <p role="alert">{ordersError}</p>}
                        {!loadingOrders && !ordersError && (instnaceInfo.id != undefined || hasRequestedClientOrders) && loadedClientOrders.length === 0 && (
                            <p>No hay órdenes de cliente para este proceso.</p>
                        )}
                        {loadedClientOrders.map((order)=>(
                            <ClientOrderDelegationCard
                                key={order.id}
                                order={order}
                                relationsByItem={relationsByDocument.get(String(order.id))}
                                thirdparties={thirdparties}
                                disabled={disabled || saving || !canAssign}
                                initiallyCollapsed={hasRequestedClientOrders}
                                onSupplierChange={(itemId, supplier) => handleSupplierChange(order.id, itemId, supplier)}
                                onPreviewAttachment={handlePreviewAttachment}
                                onNoteChange={(itemId,value)=>{
                                    const index=orderRelations.findIndex(relation=>String(relation.doc_id)===String(order.id) && String(relation.item_id)===String(itemId));
                                    handleRelationChange(index,'asignationNote',value);
                                }}
                            />
                        ))}
                    </div>
                    {(instnaceInfo.id != undefined || hasRequestedClientOrders) && (
                        <>
                            {saveError && <p role="alert">{saveError}</p>}
                            {saveMessage && <p role="status">{saveMessage}</p>}
                            {!loadingOrders && !ordersError && !canAssign && <p>La asignación se habilita cuando el proceso está en el paso de asignación a proveedores.</p>}
                            <div className="footer">
                                <FormButton negative={true} disabled={saving} text={'Cerrar'} onClick={event=>{event.preventDefault();popOutAlert();}}/>
                                <FormButton disabled={saving || loadingOrders || !canAssign || !relationsToSave.length} loading={saving} text={saving ? 'Guardando…' : forUpdate ? 'Guardar cambios' : `Guardar asignaciones (${pendingRelations.length})`}/>
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
