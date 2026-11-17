import { useEffect, useRef, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FileInput } from "../../components/FileInput";
import { FormButton } from "../../components/FormButton";
import { WarningForm } from "../../components/WarningForm";
import { LoadingSpace } from "../LoadingSpace";
import { PurchaseOrderPreview } from "../../components/purchaseOrderPreview";
import { ItemsList } from "./itemsList";
import './FormNewPurchaseOrder.css'

const getAllowedIds = (access) => {
    if (!access || access.overAll === true) return undefined;
    return Array.isArray(access.enabled) ? access.enabled : [];
};

const newRequestId = () => (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}-purchase-order`);

const formatCurrency = value => new Intl.NumberFormat('es-CO',{
    style:'currency',currency:'COP',minimumFractionDigits:2,maximumFractionDigits:2
}).format(Number(value) || 0);

const emptyBlocks = () => [{items:[]}];

const AREA_UNITS = ['mm2','cm2','m2','km2','in2','ft2','yd2','m2_sheet'];
const isAreaUnit = unit => AREA_UNITS.includes(String(unit ?? '').trim().toLowerCase());

// Costo según escalas de cantidad (price_tiers.price = cost). Sin escalas => 0 (se digita a mano).
const getEffectiveCost = (product, quantity) => {
    const qty = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
    const tiers = (Array.isArray(product?.price_tiers) ? product.price_tiers : [])
        .map(tier => ({min_qty:Number(tier.min_qty) || 0,price:Number(tier.price)}))
        .filter(tier => Number.isFinite(tier.price))
        .sort((a,b) => a.min_qty - b.min_qty);
    if(tiers.length === 0) return 0;
    return ([...tiers].reverse().find(tier => qty >= tier.min_qty) ?? tiers[0]).price;
};

// Convierte un movimiento de una orden de cliente en un ítem editable de la compra: conserva
// producto y cantidad, pero el costo sale del catálogo del proveedor, no del precio de venta.
const buildItemFromMovement = (movement,product,sourceDocId) => {
    const units = Number(movement.units) || 0;
    const base = product ?? {
        product_id:movement.service_id,
        name:movement.service_name,
        img:movement.service_img,
        unit_measure:movement.service_units,
        tax_id:movement.tax_id,
        tax_name:movement.tax_name,
        tax_rate:movement.tax_rate,
        tax_account:movement.tax_account,
        exit_account:movement.exit_account,
        entry_account:movement.entry_account,
        price_tiers:[]
    };
    const area = isAreaUnit(base.unit_measure);
    return {
        ...base,
        units,
        // En unidades de área, las unidades salen de ancho x alto: se conserva la cantidad pedida.
        areaWidth:area ? units : '',
        areaHeight:area ? 1 : '',
        unit_value:getEffectiveCost(product,units),
        manualPrice:false,
        sell_desc:movement.description ?? '',
        source_doc_id:movement.doc_id ?? sourceDocId
    };
};

/**
 * Orden de compra: se le indica al proveedor qué se le va a comprar y a qué costo pactado.
 * El costo sale de la lista de precios (`priceList_items.cost`) asignada al proveedor; si no
 * tiene lista se usa el costo de la lista más reciente del producto, y si no hay ninguno el
 * costo se digita a mano en el ítem. No usa el precio de venta (`unit_price`).
 */
// `clientOrders`: ids de órdenes de cliente a incluir (p. ej. desde el informe de administración de
// procesos). Se agregan con sus ítems cuando se elige el proveedor, porque el costo depende de él.
export function FormNewPurchaseOrder({clientOrders} = {}){
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popOutAlert,popInAlert} = useAlert();

    const [loading,setLoading] = useState(false);
    const [loadingProducts,setLoadingProducts] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [creating,setCreating] = useState(false);
    const [thirdParties,setThirdParties] = useState([]);
    const [stores,setStores] = useState([]);
    const [productsAndServices,setProductsAndServices] = useState([]);
    const [itemBlocks,setItemBlocks] = useState(emptyBlocks());
    const [instances,setInstances] = useState([]);
    const [clientOrderOptions,setClientOrderOptions] = useState([]);
    const [selectedDocs,setSelectedDocs] = useState([]);
    const [initialOrders,setInitialOrders] = useState([]); // órdenes recibidas por prop
    const [loadingOrders,setLoadingOrders] = useState(false);
    const [selectionKey,setSelectionKey] = useState(0);
    const [priceList,setPriceList] = useState({id:null,status:'idle'}); // idle | ready | none | error
    const [resetKey,setResetKey] = useState(0);
    const requestId = useRef(newRequestId());
    const supplierRequest = useRef(0);

    const [info,setInfo] = useState({
        thirdParty_id:null,
        store_id:null,
        expected_date:'',
        description:'',
        attached:''
    });

    const notifyError = (title,description) => addNotification?.({type:'error',title,description});

    // ---------- Getters ----------

    const getThirdParties = async () => {
        const res = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
        if(res?.[0]){
            setThirdParties(res[1].map(element => ({
                text:`${element.names} ${element.indentification_type ?? ''} ${element.indentification_number ?? ''}`.trim(),
                value:element
            })));
        }else{
            notifyError('No fue posible cargar la información','No se pudieron consultar los terceros.');
        }
    };

    const getStores = async (allowedStores) => {
        const res = await postInfo('/getStores',{company_id:appInfo.company_id,allowedStores});
        if(res?.[0]){
            const options = res[1].map(element => ({text:element.name,value:element.id}));
            setStores(options);
            if(options.length === 1){
                setInfo(previous => ({...previous,store_id:options[0].value}));
            }
        }else{
            notifyError('No fue posible cargar la información','No se pudieron consultar las tiendas autorizadas.');
        }
    };

    // Lista de precios asignada al proveedor (si tiene varias se toma la primera).
    const getSupplierPriceList = async (thirdPartyId) => {
        const res = await postInfo('/inventory/getThirdPartyPricesList',{
            company_id:appInfo.company_id,
            thirdParty_id:thirdPartyId
        });
        if(!res?.[0]) throw new Error('No se pudo consultar la lista de precios del proveedor.');
        return res[1]?.[0]?.priceList_id ?? null;
    };

    // Productos y servicios con su costo (price_tiers.price = cost). Sin costo => tiers vacíos.
    const getPurchaseProducts = async (listId) => {
        const allowedProducts = getAllowedIds(userConfig?.access?.sections?.products);
        const res = await postInfo('/inventory/getPurchaseProducts',{
            company_id:appInfo.company_id,
            list_id:listId ?? undefined,
            allowedItems:allowedProducts?.length ? allowedProducts : undefined
        });
        if(!res?.[0]) throw new Error('No se pudieron consultar los productos y servicios.');
        // DEBUG: lista de la que viene cada costo del catálogo.
        console.log('[OrdenCompra] Catálogo recibido. list_id solicitado:',listId ?? '(ninguno: lista más reciente por producto)');
        console.table(res[1].map(element => ({
            product_id:element.product_id,
            nombre:element.name,
            price_list_id:element.price_list_id,
            costos_por_escala:JSON.stringify(element.price_tiers)
        })));
        return res[1].map(element => ({
            text:`${element.code ?? ''} ${element.name}`.trim(),
            value:{
                ...element,
                areaWidth:'',
                areaHeight:''
            }
        }));
    };

    // Procesos activos del proveedor seleccionado: sirven para traer sus órdenes de cliente.
    const getProcessInstances = async (thirdPartyId) => {
        const res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            status:['active'],
            thirdParty_id:thirdPartyId,
            allowedInstances:getAllowedIds(userConfig?.access?.process_instances)
        });
        if(!res?.[0]) throw new Error('No se pudieron consultar los procesos del proveedor.');
        return res[1];
    };

    const mapInstances = (rows) => {
        setInstances(rows.map(element => ({
            text:`${element.process_code}#${element.ownSerial}`,
            value:element
        })));
    };

    // Últimas órdenes de cliente activas (de cualquier cliente).
    const getClientOrders = async () => {
        const res = await postInfo('/process/getDocuments',{
            company_id:appInfo.company_id,
            type:'Client Order',
            status:'active',
            limint:300
        });
        if(res?.[0]){
            setClientOrderOptions(res[1].map(element => ({
                text:`Orden #${element.ownSerial}${element.names ? ` - ${element.names}` : ''}`,
                value:element
            })));
        }else{
            notifyError('No fue posible cargar la información','No se pudieron consultar las órdenes de cliente.');
        }
    };

    const getAttachedServices = async (documentId) => {
        const res = await postInfo('/getServiceMovements',{company_id:appInfo.company_id,doc_id:documentId});
        if(!res?.[0]) throw new Error('No fue posible consultar los productos y servicios de la orden.');
        return res[1];
    };

    // Órdenes de cliente recibidas por prop: se consultan por id y quedan listas para agregarse.
    const preloadClientOrders = async () => {
        const ids = [...new Set((Array.isArray(clientOrders) ? clientOrders : [])
            .map(id => `${id ?? ''}`).filter(Boolean))];
        if(ids.length === 0) return;
        const res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            allowedIds:ids,
            allowedTypes:['Client Order']
        });
        const found = res?.[0] ? res[1] : [];
        // getDocuments repite el documento si tiene varios procesos: se deduplica.
        const available = [...new Map(found
            .filter(document => !['cancelled','disabled'].includes(`${document.status}`))
            .map(document => [`${document.id}`,document])).values()];
        if(available.length === 0){
            notifyError('Sin órdenes disponibles','No se encontraron órdenes de cliente disponibles entre las seleccionadas.');
            return;
        }
        if(available.length < ids.length){
            notifyError('Órdenes no disponibles',`${ids.length - available.length} de las órdenes seleccionadas no están disponibles (canceladas o inexistentes) y no se incluirán.`);
        }
        setInitialOrders(available);
    };

    const handleUserConfig = async () => {
        setDisabled(true);
        setLoading(true);
        try{
            await Promise.all([
                getThirdParties(),
                getStores(getAllowedIds(userConfig?.access?.stores)),
                getClientOrders(),
                preloadClientOrders()
            ]);
        }catch(error){
            console.error('Error al cargar datos de la orden de compra:',error);
            notifyError('No fue posible cargar la información','Ocurrió un error consultando los datos del formulario.');
        }finally{
            setLoading(false);
            setDisabled(false);
        }
    };

    // ---------- Handlers ----------

    const handleSupplierSelect = async (thirdParty) => {
        const thirdPartyId = thirdParty?.id ?? null;
        const currentRequest = ++supplierRequest.current;
        setInfo(previous => ({...previous,thirdParty_id:thirdPartyId}));
        // Los costos pertenecen a la lista del proveedor anterior: se limpian los ítems.
        setItemBlocks(emptyBlocks());
        setSelectedDocs([]);
        setSelectionKey(previous => previous + 1);
        setProductsAndServices([]);
        setInstances([]);
        setPriceList({id:null,status:'idle'});
        if(!thirdPartyId) return;

        setLoadingProducts(true);
        try{
            const [listId,processes] = await Promise.all([
                getSupplierPriceList(thirdPartyId),
                getProcessInstances(thirdPartyId)
            ]);
            const products = await getPurchaseProducts(listId);
            if(currentRequest !== supplierRequest.current) return; // llegó otra selección
            setPriceList({id:listId,status:listId ? 'ready' : 'none'});
            setProductsAndServices(products);
            mapInstances(processes);
            if(initialOrders.length > 0){
                await addClientOrders(initialOrders,{catalog:products,ignoreSelected:true});
            }
        }catch(error){
            if(currentRequest !== supplierRequest.current) return;
            console.error('Error al consultar costos del proveedor:',error);
            setPriceList({id:null,status:'error'});
            notifyError('No fue posible cargar los costos',error?.message || 'Intenta nuevamente.');
        }finally{
            if(currentRequest === supplierRequest.current) setLoadingProducts(false);
        }
    };

    // Agrega los ítems de órdenes de cliente a la compra, con el costo del proveedor.
    // `catalog`/`ignoreSelected` permiten llamarla justo tras elegir proveedor, cuando el estado
    // aún no refleja el catálogo nuevo ni la limpieza de las órdenes anteriores.
    const addClientOrders = async (orders = [],{catalog:catalogOptions = productsAndServices,ignoreSelected = false} = {}) => {
        const selectedIds = new Set(ignoreSelected ? [] : selectedDocs.map(document => `${document.id}`));
        const toAdd = orders.filter(order =>
            order?.id && !selectedIds.has(`${order.id}`) && !['cancelled','disabled'].includes(`${order.status}`));
        if(toAdd.length === 0) return;

        setLoadingOrders(true);
        try{
            const results = await Promise.allSettled(toAdd.map(async order => ({
                order,
                movements:await getAttachedServices(order.id)
            })));
            const loaded = results.filter(result => result.status === 'fulfilled').map(result => result.value);
            const failed = results.length - loaded.length;

            if(loaded.length > 0){
                const catalog = new Map(catalogOptions.map(option => [`${option.value.product_id}`,option.value]));
                const newItems = loaded.flatMap(({order,movements}) => movements.map(movement =>
                    buildItemFromMovement(movement,catalog.get(`${movement.service_id}`),order.id)));
                // DEBUG: ítems agregados desde órdenes de cliente y su costo resuelto.
                console.log('[OrdenCompra] Lista de precios del proveedor:',priceList);
                console.table(newItems.map(item => ({
                    orden_cliente:item.source_doc_id,
                    product_id:item.product_id,
                    nombre:item.name,
                    unidades:item.units,
                    price_list_id:item.price_list_id ?? '(sin costo en catálogo)',
                    costo_escalas:JSON.stringify(item.price_tiers),
                    unit_value_resuelto:item.unit_value
                })));
                setItemBlocks(previous => previous.map((block,index) =>
                    index === 0 ? {...block,items:[...block.items,...newItems]} : block));
                setSelectedDocs(previous => [...previous,...loaded.map(({order}) => order)]);
                setSelectionKey(previous => previous + 1);
            }
            if(failed > 0){
                notifyError('No se pudieron cargar algunas órdenes',`No se cargaron los ítems de ${failed} orden${failed === 1 ? '' : 'es'}.`);
            }
        }catch(error){
            console.error('Error al cargar las órdenes de cliente:',error);
            notifyError('No se pudieron cargar las órdenes',error?.message || 'Intenta nuevamente.');
        }finally{
            setLoadingOrders(false);
        }
    };

    const handleInstanceSelect = async (instance) => {
        if(!instance?.id) return;
        setLoadingOrders(true);
        try{
            const res = await postInfo('/getDocuments',{
                company_id:appInfo.company_id,
                instance_id:instance.id,
                allowedTypes:['Client Order']
            });
            if(!res?.[0]) throw new Error('No se pudieron consultar las órdenes del proceso.');
            // getDocuments repite el documento si tiene varios procesos: se deduplica.
            const orders = [...new Map(res[1].map(order => [`${order.id}`,order])).values()];
            if(orders.length === 0){
                notifyError('Proceso sin órdenes','El proceso seleccionado no tiene órdenes de cliente.');
                return;
            }
            await addClientOrders(orders);
        }catch(error){
            console.error('Error al cargar órdenes del proceso:',error);
            notifyError('No se pudieron cargar las órdenes',error?.message || 'Intenta nuevamente.');
        }finally{
            setLoadingOrders(false);
        }
    };

    const handleRemoveOrder = (orderId) => {
        setSelectedDocs(previous => previous.filter(document => `${document.id}` !== `${orderId}`));
        setItemBlocks(previous => previous.map(block => ({
            ...block,
            items:block.items.filter(item => `${item.source_doc_id}` !== `${orderId}`)
        })));
        setSelectionKey(previous => previous + 1);
    };

    const resetForm = () => {
        // Se conserva el proveedor para poder crear otra orden; se limpia lo demás.
        setInfo(previous => ({...previous,expected_date:'',description:'',attached:''}));
        setItemBlocks(emptyBlocks());
        setSelectedDocs([]);
        setSelectionKey(previous => previous + 1);
        setResetKey(previous => previous + 1);
        requestId.current = newRequestId();
    };

    // ---------- Cálculos ----------

    const items = itemBlocks.flatMap(block => block.items);
    const isItemInvalid = item => !(Number(item.units) > 0) || !(Number(item.unit_value) > 0);
    const itemsWithoutCost = items.filter(item => !(Number(item.unit_value) > 0));

    const summary = items.reduce((result,item) => {
        const lineTotal = (Number(item.units) || 0) * (Number(item.unit_value) || 0);
        const rate = Math.max(0,Number(item.tax_rate) || 0);
        const lineSubtotal = lineTotal / (1 + rate / 100);
        result.subtotal += lineSubtotal;
        result.total += lineTotal;
        if(item.tax_id){
            const key = `${item.tax_id}`;
            result.taxes[key] = result.taxes[key] ?? {id:key,name:item.tax_name || 'Impuesto',rate,value:0};
            result.taxes[key].value += lineTotal - lineSubtotal;
        }
        return result;
    },{subtotal:0,total:0,taxes:{}});
    const taxes = Object.values(summary.taxes);

    const canCreate = Boolean(info.thirdParty_id && info.store_id)
        && items.length > 0
        && !items.some(isItemInvalid)
        && !loadingProducts;

    // Simulación de la orden con los ítems actuales (sin guardar).
    const handlePreview = () => {
        if(!info.thirdParty_id){
            notifyError('Selecciona un proveedor','Para previsualizar la orden debes seleccionar un proveedor.');
            return;
        }
        if(items.length === 0){
            notifyError('Agrega ítems','La previsualización necesita al menos un producto o servicio.');
            return;
        }
        popInAlert(<PurchaseOrderPreview data={{
            docInfo:{description:info.description},
            observations:info.description,
            expectedDate:info.expected_date,
            thirdParty_id:info.thirdParty_id,
            items:items.map(item => ({
                ...item,
                description:item.sell_desc || item.description,
                sourceDocument:selectedDocs.find(document => `${document.id}` === `${item.source_doc_id}`)?.ownSerial
            }))
        }} />);
    };

    const handleCreate = async () => {
        if(!canCreate){
            notifyError('Faltan datos','Selecciona proveedor y tienda, y agrega al menos un ítem con cantidad y costo.');
            return;
        }
        setCreating(true);
        setDisabled(true);
        try{
            const res = await postInfo('/facturation/newPurchaseOrder',{
                company_id:appInfo.company_id,
                store_id:info.store_id,
                thirdParty_id:info.thirdParty_id,
                created_by:userInfo.user_id,
                price_list_id:priceList.id ?? undefined,
                expected_date:info.expected_date || undefined,
                description:info.description,
                attached:info.attached,
                source_doc_ids:selectedDocs.map(document => document.id),
                request_id:requestId.current,
                items:items.map(item => ({
                    service_id:item.product_id ?? item.service_id,
                    units:item.units,
                    unit_value:item.unit_value,
                    description:item.sell_desc ?? item.description
                }))
            });
            if(res?.status !== 'OK'){
                throw new Error(res?.message || 'No se pudo crear la orden de compra.');
            }
            addNotification?.({
                type:'aproved',
                title:`Orden de compra #${res.ownSerial} creada`,
                description:'La orden quedó en borrador con los costos pactados con el proveedor.'
            });
            resetForm();
        }catch(error){
            console.error('Error al crear la orden de compra:',error);
            notifyError('No se pudo crear la orden de compra',error?.message || 'Intenta nuevamente.');
        }finally{
            setCreating(false);
            setDisabled(false);
        }
    };

    useEffect(() => {
        handleUserConfig();
        // La configuración se carga una sola vez al montar el formulario.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const priceListMessage = {
        ready:`Costos de la lista de precios #${priceList.id} del proveedor.`,
        none:'El proveedor no tiene lista de precios asignada: se muestra el costo de la lista más reciente de cada producto. Puedes ajustarlo a mano.',
        error:'No se pudieron cargar los costos: digítalos a mano en cada ítem.'
    }[priceList.status];

    return(
        <div className="FormNewPurchaseOrder" aria-busy={loading}>
            <BoldTitle text={'Nueva orden de compra'}/>
            <DescriptionSpan text={'Selecciona el proveedor y los productos o servicios que le vas a comprar con su costo pactado.'}/>
            {!loading && (
                <form onSubmit={event => event.preventDefault()}>
                    <div className="purchaseOrderDateField">
                        <FormInput
                            title={'Fecha esperada de entrega'}
                            type={'date'}
                            required={false}
                            value={info.expected_date}
                            action={expected_date => setInfo(previous => ({...previous,expected_date}))}
                            disabled={disabled}
                        />
                    </div>
                    <SearchinList
                        title={'Proveedor'}
                        placeHolder={'Selecciona un proveedor'}
                        list={thirdParties}
                        value={info.thirdParty_id ?? undefined}
                        action={handleSupplierSelect}
                        disabled={disabled}
                    />
                    {stores.length > 1 && (
                        <SearchinList
                            title={'Tienda'}
                            placeHolder={'Selecciona una tienda'}
                            list={stores}
                            value={info.store_id}
                            action={storeId => setInfo(previous => ({...previous,store_id:storeId}))}
                            disabled={disabled}
                        />
                    )}
                    {!info.thirdParty_id && initialOrders.length > 0 && (
                        <span className="purchaseOrderPriceListInfo" role="status">
                            <i className="bi bi-info-circle" aria-hidden="true"/> {initialOrders.length} orden{initialOrders.length === 1 ? '' : 'es'} de cliente seleccionada{initialOrders.length === 1 ? '' : 's'}: se agregarán con sus ítems cuando elijas el proveedor, porque el costo depende de él.
                        </span>
                    )}
                    {info.thirdParty_id && !loadingProducts && instances.length > 0 && (
                        <SearchinList
                            title={'Agregar órdenes del proceso'}
                            placeHolder={'Selecciona un proceso'}
                            list={instances}
                            action={handleInstanceSelect}
                            disabled={disabled || loadingOrders}
                            noActVal
                        />
                    )}
                    {info.thirdParty_id && !loadingProducts && (
                        <SearchinList
                            key={selectionKey}
                            title={'Órdenes de cliente'}
                            placeHolder={clientOrderOptions.length ? 'Selecciona una orden para agregar sus ítems' : 'No hay órdenes disponibles'}
                            list={clientOrderOptions.filter(option => !selectedDocs.some(document => document.id === option.value.id))}
                            action={order => addClientOrders([order])}
                            disabled={disabled || loadingOrders || clientOrderOptions.length === 0}
                        />
                    )}
                    {selectedDocs.length > 0 && (
                        <ul className="purchaseOrderSources" aria-label="Órdenes de cliente incluidas">
                            {selectedDocs.map(document => (
                                <li className="purchaseOrderSource" key={document.id}>
                                    <span>Orden #{document.ownSerial}{document.names ? ` - ${document.names}` : ''}</span>
                                    <button type="button" title={`Quitar la orden #${document.ownSerial}`} aria-label={`Quitar la orden #${document.ownSerial}`} disabled={disabled || loadingOrders} onClick={() => handleRemoveOrder(document.id)}>
                                        <i className="bi bi-x-lg" aria-hidden="true"/>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {loadingOrders && (
                        <LoadingSpace title={'Cargando órdenes...'} description={'no debe tardar mucho'}/>
                    )}
                    {info.thirdParty_id && !loadingProducts && priceListMessage && (
                        <span className="purchaseOrderPriceListInfo" role="status">
                            <i className="bi bi-info-circle" aria-hidden="true"/> {priceListMessage}
                        </span>
                    )}
                    {info.thirdParty_id && (
                        loadingProducts ? (
                            <LoadingSpace title={'Cargando costos...'} description={'no debe tardar mucho'}/>
                        ) : (
                            <ItemsList
                                title={'Productos y servicios a comprar'}
                                blocks={itemBlocks}
                                setItems={setItemBlocks}
                                productsAndServices={productsAndServices}
                                disabled={disabled || loadingOrders}
                                visibleItemTotal={false}
                            />
                        )
                    )}
                    {!info.thirdParty_id && (
                        <div className="noItemsSelected">
                            <i className="bi bi-bag"/>
                            <h6>Selecciona un proveedor para ver sus productos y costos</h6>
                        </div>
                    )}
                    {itemsWithoutCost.length > 0 && !loadingProducts && (
                        <WarningForm
                            tittle={'Ítems sin costo'}
                            desc={`${itemsWithoutCost.length} ítem${itemsWithoutCost.length === 1 ? '' : 's'} sin costo pactado. Digítalo en "Val unitario" para poder crear la orden.`}
                        />
                    )}
                    {items.length > 0 && (
                        <section className="purchaseOrderSummary" aria-label="Resumen de la orden de compra" aria-live="polite">
                            <div className="purchaseOrderSummaryRows">
                                <div className="purchaseOrderSummaryRow">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(summary.subtotal)}</span>
                                </div>
                                {taxes.map(tax => (
                                    <div className="purchaseOrderSummaryRow" key={tax.id}>
                                        <span>{tax.name}{tax.rate > 0 ? ` (${tax.rate}%)` : ''}</span>
                                        <span>{formatCurrency(tax.value)}</span>
                                    </div>
                                ))}
                                <div className="purchaseOrderSummaryRow purchaseOrderSummaryTotal">
                                    <strong>Total a comprar</strong>
                                    <strong>{formatCurrency(summary.total)}</strong>
                                </div>
                            </div>
                        </section>
                    )}
                    <FormInput
                        title={'Descripción'}
                        placeholder={'Nota u observación para el proveedor'}
                        textArea
                        required={false}
                        value={info.description}
                        action={description => setInfo(previous => ({...previous,description}))}
                        disabled={disabled}
                    />
                    <FileInput key={resetKey} category="files" multiple={true} placeholder={'Selecciona archivos adjuntos'} action={attached => setInfo(previous => ({...previous,attached}))}/>
                    <div className="actionsForm">
                        <FormButton className="purchaseOrderPreviewButton" text={'Previsualizar'} disabled={disabled || creating || loadingProducts} onClick={handlePreview} type="button" children={<i className="bi bi-eye"/>}/>
                        <FormButton text={'Cancelar'} negative={true} disabled={creating} onClick={()=>popOutAlert()} type="button"/>
                        <FormButton text={'Crear orden'} disabled={disabled || creating || !canCreate} loading={creating} onClick={handleCreate} type="button" children={<i className="bi bi-arrow-right-square-fill"/>}/>
                    </div>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'}/>
            )}
        </div>
    )
}
