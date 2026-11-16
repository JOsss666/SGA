import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../context/context";
import { BoldTitle } from "./BoldTitle";
import { DescriptionSpan } from "./DescriptionSpan";
import { FormInput } from "./FormInput";
import { SearchinList } from "./SearchInList";
import { postInfo } from "../../../utils/functions";
import { ItemsList } from "../containers/forms/itemsList";
import './FormNewFacturationOrder.css'
import { LoadingSpace } from "../containers/LoadingSpace";
import { FileInput } from "./FileInput";
import { FormButton } from "./FormButton";
import { FacturationOrderPreview } from "./facturationOrderPreview";

const getAllowedIds = (access) => {
    if (!access || access.overAll === true) return undefined;
    return Array.isArray(access.enabled) ? access.enabled : [];
};

const getLocalDate = () => {
    const date = new Date();
    const month = `${date.getMonth() + 1}`.padStart(2,'0');
    const day = `${date.getDate()}`.padStart(2,'0');
    return `${date.getFullYear()}-${month}-${day}`;
};

export function FormNewFacturationOrder({clientOrders} = {}){
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popInAlert} = useAlert();

    const [loading,setLoading] = useState(false);
    const [loadingItems,setLoadingItems] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [thirdParties,setThirdParties] = useState([]);
    const [stores,setStores] = useState([]);
    const [documents,setDocuments] = useState([]);
    const [instances,setInstances] = useState([]);
    const [itemBlocks,setItemBlocks] = useState([]);
    const [selectionKey,setSelectionKey] = useState(0);
    const [processAccess,setProcessAccess] = useState(undefined);
    const [selectedInstanceIds,setSelectedInstanceIds] = useState([]);
    const [creating,setCreating] = useState(false);
    const [resetKey,setResetKey] = useState(0);

    const [info,setInfo] = useState({
        thirdParty_id:null,
        selectedDocs:[],
        doc_date:getLocalDate(),
        description:'',
        value:0,
        attached:'',
        store_id:null,
        instance_id:null,
        document_type:'Facturation Order',
        company_id:appInfo.company_id
    });

    const notifyError = (message) => addNotification?.({
        type:'error',
        title:'No fue posible cargar la información',
        description:message
    });

    const getThirdParties = async () => {
        const res = await postInfo('/getThirdParties',{
            company_id:appInfo.company_id
        });
        if(res?.[0]){
            setThirdParties(res[1]
                .filter(element => ['client','both'].includes(`${element.type ?? ''}`.toLowerCase()))
                .map(element => ({
                text:`${element.names} ${element.indentification_type ?? ''} ${element.indentification_number ?? ''}`.trim(),
                value:element
            })));
        }else{
            notifyError('No se pudieron consultar los clientes.');
        }
    };

    const getStores = async (allowedStores) => {
        const res = await postInfo('/getStores',{
            company_id:appInfo.company_id,
            allowedStores
        });
        if(res?.[0]){
            const options = res[1].map(element => ({text:element.name,value:element.id}));
            setStores(options);
            if(options.length === 1){
                setInfo(previous => ({...previous,store_id:options[0].value}));
            }
        }else{
            notifyError('No se pudieron consultar las tiendas autorizadas.');
        }
    };

    const getProcessInstances = async (thirdPartyId, allowedInstances) => {
        if(!thirdPartyId){
            setInstances([]);
            return;
        }
        const res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            status:['active'],
            thirdParty_id:thirdPartyId,
            allowedInstances
        });
        if(res?.[0]){
            const options = res[1].map(element => ({
                text:`${element.process_code}#${element.ownSerial}`,
                value:element
            }));
            setInstances(options);
        }else{
            notifyError('No se pudieron consultar los procesos autorizados del cliente.');
        }
    };

    const getDocuments = async (thirdPartyId, instanceId) => {
        if(!thirdPartyId){
            setDocuments([]);
            return;
        }
        const res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            thirdParty_id:thirdPartyId,
            instance_id:instanceId || undefined,
            allowedTypes:['Client Order']
        });
        if(res?.[0]){
            if(!instanceId){
                setDocuments(res[1].map(element => ({
                    text:`${element.document_type} #${element.ownSerial}`,
                    value:element
                })));
            }
            return res[1];
        }else{
            notifyError('No se pudieron consultar las órdenes de cliente.');
            return [];
        }
    };

    const getAttachedServices = async (documentId) => {
        const res = await postInfo('/getServiceMovements',{
            company_id:appInfo.company_id,
            doc_id:documentId
        });
        if(!res?.[0]){
            throw new Error('No fue posible consultar los productos y servicios de la orden.');
        }
        return res[1].map(item => {
            const units = Number(item.units) || 0;
            const total = Number(item.total) || 0;
            const storedUnitValue = Number(item.unit_value);
            const unitValue = storedUnitValue > 0
                ? storedUnitValue
                : (total > 0 && units > 0 ? total / units : storedUnitValue || 0);

            return {
                ...item,
                units,
                unit_value:unitValue,
                total:total || units * unitValue,
                facturation_description:item.description ?? ''
            };
        });
    };

    const handleUserConfig = async () => {
        setDisabled(true);
        setLoading(true);
        try{
            const storeAccess = userConfig?.access?.stores;
            const allowedStores = getAllowedIds(storeAccess);
            const processInstancesAccess = userConfig?.access?.process_instances;
            const allowedInstances = getAllowedIds(processInstancesAccess);

            setProcessAccess(allowedInstances);
            await Promise.all([
                getThirdParties(),
                getStores(allowedStores)
            ]);
            await preloadClientOrders(allowedInstances);
        }catch(error){
            console.error('Error al cargar datos de la orden de facturación:',error);
            notifyError('Ocurrió un error consultando los datos del formulario.');
        }finally{
            setLoading(false);
            setDisabled(false);
        }
    };

    const preloadClientOrders = async (allowedInstances) => {
        const ids = [...new Set((Array.isArray(clientOrders) ? clientOrders : [])
            .map(id => `${id ?? ''}`).filter(Boolean))];
        if(ids.length === 0) return;

        const res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            allowedIds:ids,
            allowedTypes:['Client Order']
        });
        const found = res?.[0] ? res[1] : [];
        // getDocuments puede repetir un documento si tiene varios procesos: se deduplica.
        const unique = [...new Map(found.map(document => [`${document.id}`,document])).values()];
        const available = unique.filter(document => !['cancelled','disabled'].includes(`${document.status}`));

        if(available.length === 0){
            notifyError('No se encontraron órdenes de cliente disponibles entre las seleccionadas.');
            return;
        }
        const clientIds = [...new Set(available.map(document => `${document.thirdParty_id}`))];
        if(clientIds.length > 1){
            notifyError(`Las órdenes seleccionadas pertenecen a ${clientIds.length} clientes distintos. Selecciona órdenes de un solo cliente.`);
            return;
        }
        if(available.length < ids.length){
            notifyError(`${ids.length - available.length} de las órdenes seleccionadas no están disponibles (canceladas o inexistentes) y no se incluyeron.`);
        }

        const thirdPartyId = available[0].thirdParty_id;
        setInfo(previous => ({...previous,thirdParty_id:thirdPartyId}));
        await Promise.all([
            getDocuments(thirdPartyId),
            getProcessInstances(thirdPartyId,allowedInstances)
        ]);
        await addDocuments(available);
    };

    const handleThirdPartySelect = async (thirdParty) => {
        const thirdPartyId = thirdParty?.id ?? null;
        setInfo(previous => ({
            ...previous,
            thirdParty_id:thirdPartyId,
            selectedDocs:[],
            instance_id:null
        }));
        setSelectedInstanceIds([]);
        setSelectionKey(previous => previous + 1);
        setDocuments([]);
        setInstances([]);
        setItemBlocks([]);
        try{
            await Promise.all([
                getDocuments(thirdPartyId),
                getProcessInstances(thirdPartyId,processAccess)
            ]);
        }catch(error){
            console.error('Error al consultar órdenes y procesos del cliente:',error);
            notifyError('Ocurrió un error consultando las órdenes o los procesos del cliente.');
        }
    };

    const handleInstanceSelect = async (instance) => {
        const instanceId = instance?.id;
        if(!instanceId || !info.thirdParty_id) return;

        try{
            const instanceDocuments = await getDocuments(info.thirdParty_id,instanceId);
            setSelectedInstanceIds(previous => previous.includes(instanceId) ? previous : [...previous,instanceId]);
            await addDocuments(instanceDocuments);
        }catch(error){
            console.error('Error al cargar órdenes del proceso:',error);
            notifyError('Ocurrió un error cargando las órdenes del proceso.');
        }
    };

    const addDocuments = async (newDocuments = []) => {
        const selectedIds = new Set(itemBlocks.map(block => `${block.docInfo?.id}`));
        const documentsToAdd = newDocuments.filter(document =>
            document?.id && !selectedIds.has(`${document.id}`)
        );
        if(documentsToAdd.length === 0) return;

        setLoadingItems(true);
        try{
            const results = await Promise.allSettled(documentsToAdd.map(async document => ({
                docInfo:document,
                items:await getAttachedServices(document.id)
            })));
            const newBlocks = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            const failedCount = results.length - newBlocks.length;

            if(newBlocks.length > 0){
                setItemBlocks(previous => {
                    const currentIds = new Set(previous.map(block => `${block.docInfo?.id}`));
                    return [...previous,...newBlocks.filter(block => !currentIds.has(`${block.docInfo.id}`))];
                });
                setSelectionKey(previous => previous + 1);
            }
            if(failedCount > 0){
                notifyError(`No se pudieron cargar los ítems de ${failedCount} orden${failedCount === 1 ? '' : 'es'}.`);
            }
        }catch(error){
            console.error('Error al cargar los ítems de las órdenes:',error);
            notifyError(error.message || 'No se pudieron cargar los ítems de las órdenes.');
        }finally{
            setLoadingItems(false);
        }
    };

    const addDocument = async (document) => {
        await addDocuments([document]);
    };

    const paymentSummary = itemBlocks.reduce((summary,block) => {
        block.items.forEach(item => {
            const units = Number(item.units) || 0;
            const unitValue = Number(item.unit_value) || 0;
            const lineTotal = units * unitValue;
            const rate = Math.max(0,Number(item.tax_rate) || 0);
            const lineSubtotal = lineTotal / (1 + rate / 100);
            const taxValue = lineTotal - lineSubtotal;

            summary.subtotal += lineSubtotal;
            summary.total += lineTotal;

            if(item.tax_id){
                const taxKey = `${item.tax_id}`;
                if(!summary.taxes[taxKey]){
                    summary.taxes[taxKey] = {
                        id:taxKey,
                        name:item.tax_name || 'Impuesto',
                        rate,
                        value:0
                    };
                }
                summary.taxes[taxKey].value += taxValue;
            }
        });
        return summary;
    },{subtotal:0,total:0,taxes:{}});
    const paymentTaxes = Object.values(paymentSummary.taxes);
    const formatCurrency = value => new Intl.NumberFormat('es-CO',{
        style:'currency',currency:'COP',minimumFractionDigits:2,maximumFractionDigits:2
    }).format(Number(value) || 0);

    const handlePreview = () => {
        if(!info.thirdParty_id){
            addNotification?.({
                type:'error',
                title:'Selecciona un cliente',
                description:'Para preparar la prefactura debes seleccionar un cliente.'
            });
            return;
        }

        if(itemBlocks.length === 0){
            addNotification?.({
                type:'error',
                title:'Agrega órdenes de cliente',
                description:'La prefactura necesita al menos una orden con sus ítems.'
            });
            return;
        }

        popInAlert(<FacturationOrderPreview data={{
            docInfo:info,
            thirdParty_id:info.thirdParty_id,
            items:itemBlocks.flatMap(block => block.items.map(item => ({
                ...item,
                sourceDocument:block.docInfo?.ownSerial || block.docInfo?.id
            }))),
            sourceDocuments:itemBlocks.map(block => block.docInfo),
            totals:{
                subtotal:paymentSummary.subtotal,
                total:paymentSummary.total,
                taxes:paymentTaxes
            }
        }} />);
    };

    const resetForm = () => {
        setInfo(previous => ({
            ...previous,
            selectedDocs:[],
            doc_date:getLocalDate(),
            description:'',
            attached:'',
            instance_id:null
        }));
        setSelectedInstanceIds([]);
        setItemBlocks([]);
        setSelectionKey(previous => previous + 1);
        setResetKey(previous => previous + 1);
    };

    const handleCreate = async () => {
        if(!info.thirdParty_id || itemBlocks.length === 0){
            addNotification?.({
                type:'error',
                title:'Faltan datos',
                description:'Selecciona un cliente y al menos una orden de cliente con sus ítems.'
            });
            return;
        }

        setCreating(true);
        setDisabled(true);
        try{
            const res = await postInfo('/facturation/newFacturationOrder',{
                company_id:appInfo.company_id,
                store_id:info.store_id,
                thirdParty_id:info.thirdParty_id,
                created_by:userInfo.user_id,
                description:info.description,
                attached:info.attached,
                source_doc_ids:itemBlocks.map(block => block.docInfo?.id),
                instances:selectedInstanceIds.map(id => ({id})),
                items:itemBlocks.flatMap(block => block.items.map(item => ({
                    service_id:item.service_id ?? item.product_id,
                    units:item.units,
                    unit_value:item.unit_value,
                    facturation_description:item.facturation_description
                })))
            });
            if(res?.status !== 'OK'){
                throw new Error(res?.message || 'No se pudo crear la orden de facturación.');
            }
            addNotification?.({
                type:'aproved',
                title:`Orden de facturación #${res.ownSerial} creada`,
                description:'La orden quedó en borrador y asociada a sus órdenes de cliente y procesos.'
            });
            resetForm();
        }catch(error){
            console.error('Error al crear la orden de facturación:',error);
            addNotification?.({
                type:'error',
                title:'No se pudo crear la orden de facturación',
                description:error?.message || 'Intenta nuevamente.'
            });
        }finally{
            setCreating(false);
            setDisabled(false);
        }
    };

    useEffect(() => {
        handleUserConfig();
        // La configuración de permisos se carga una vez al montar el formulario.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(() => {
        setInfo(previous => ({
            ...previous,
            selectedDocs:itemBlocks.map(block => block.docInfo)
        }));
    },[itemBlocks]);

    return(
        <div className="FormNewFacturationOrder" aria-busy={loading}>
            <BoldTitle text={'Nueva orden de facturación'}/>
            <DescriptionSpan text={'Selecciona las órdenes de cliente para preparar su prefacturación.'}/>
            {!loading && (
                <form onSubmit={event => event.preventDefault()}>
                    <div className="facturationOrderDateField">
                        <FormInput
                            title={'Fecha de la orden'}
                            type={'date'}
                            value={info.doc_date}
                            action={doc_date => setInfo(previous => ({...previous,doc_date}))}
                            disabled={disabled}
                        />
                    </div>
                    <SearchinList
                        title={'Cliente'}
                        placeHolder={'Selecciona un cliente'}
                        list={thirdParties}
                        value={info.thirdParty_id ?? undefined}
                        action={handleThirdPartySelect}
                        disabled={disabled || loadingItems}
                    />
                    {stores.length > 1 && (
                        <SearchinList
                            title={'Tienda'}
                            placeHolder={'Selecciona una tienda'}
                            list={stores}
                            value={info.store_id}
                            action={storeId => setInfo(previous => ({...previous,store_id:storeId}))}
                            disabled={disabled || loadingItems}
                        />
                    )}
                    {info.thirdParty_id && instances.length > 0 && (
                        <SearchinList
                            title={'Agregar órdenes del proceso'}
                            placeHolder={'Selecciona un proceso'}
                            list={instances}
                            action={handleInstanceSelect}
                            disabled={disabled || loadingItems}
                            noActVal
                        />
                    )}
                    {info.thirdParty_id && (
                        <>
                            <SearchinList
                                key={selectionKey}
                                title={'Órdenes de cliente'}
                                placeHolder={documents.length ? 'Selecciona una orden para agregarla' : 'No hay órdenes disponibles'}
                                list={documents.filter(option => !info.selectedDocs.some(document => document.id === option.value.id))}
                                action={addDocument}
                                disabled={disabled || loadingItems || documents.length === 0}
                            />
                            {loadingItems && (
                                <LoadingSpace title={'Cargando items...'} description={'no debe tardar mucho'}/>
                            )}
                            {itemBlocks.length > 0 ? (
                                <ItemsList
                                    title={'Ítems incluidos en la prefactura'}
                                    blocks={itemBlocks}
                                    setItems={setItemBlocks}
                                    disabled={disabled || loadingItems}
                                />
                            ) : !loadingItems && (
                                <div className="noItemsSelected">
                                    <i className="bi bi-bag"/>
                                    <h6>No hay items seleccionados por el momento</h6>
                                </div>
                            )}
                        </>
                    )}
                    {itemBlocks.length > 0 && (
                        <section className="facturationOrderSummary" aria-label="Resumen de la prefactura" aria-live="polite">
                            <div className="facturationOrderSummaryRows">
                                <div className="facturationOrderSummaryRow">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(paymentSummary.subtotal)}</span>
                                </div>
                                {paymentTaxes.map(tax => (
                                    <div className="facturationOrderSummaryRow" key={tax.id}>
                                        <span>{tax.name}{tax.rate > 0 ? ` (${tax.rate}%)` : ''}</span>
                                        <span>{formatCurrency(tax.value)}</span>
                                    </div>
                                ))}
                                <div className="facturationOrderSummaryRow facturationOrderSummaryTotal">
                                    <span>Total</span>
                                    <strong>{formatCurrency(paymentSummary.total)}</strong>
                                </div>
                                <div className="facturationOrderSummaryRow facturationOrderSummaryDue">
                                    <strong>Valor a pagar</strong>
                                    <strong>{formatCurrency(paymentSummary.total)}</strong>
                                </div>
                            </div>
                        </section>
                    )}
                    <FormInput
                        title={'Descripción'}
                        placeholder={'Nota u observación de la orde de facturación'}
                        textArea
                        value={info.description}
                        action={description => setInfo(previous => ({...previous,description}))}
                        disabled={disabled}
                    />
                    <FileInput key={resetKey} category="files" multiple={true} placeholder={'Selecicone archivos adjuntos'} action={attached => setInfo(previous => ({...previous,attached}))}/>
                    <div className="actionsForm">
                        <FormButton className="facturationOrderPreviewButton" text={'Previsualizar'} disabled={disabled || loadingItems} onClick={handlePreview} type="button" children={<i className="bi bi-eye"/>}/>
                        <FormButton text={'Cancelar'} disabled={disabled} negative={true}/>
                        <FormButton text={'Crear orden'} disabled={disabled || loadingItems || creating} loading={creating} onClick={handleCreate} type="button" children={<i className="bi bi-arrow-right-square-fill"/>}/>
                    </div>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    );
}
