import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom";
import { SearchBar } from "../../components/SearchBar";
import { useAlert, useAppInfo } from "../../../../context/context";
import { formatDate, moneyFormat, postInfo } from "../../../../utils/functions";
import { SearchResultsLoadingShader } from "./SearchResultsLoadingShader";
import { DocumentPreview } from "./DocumentPreview";
import { ProcessStatusAlert } from "./ProcessStatusAlert";
import { FormSelectNewProcess } from "../forms/FormSelectNewProcess";
import { FormNewClientOrder } from "../forms/FormNewClientOrder";
import { FormNewCashRecipt } from "../forms/FormNewCashRecipt";
import { FormNewInvoice } from "../forms/FormNewInvoice";
import { FormNewPurchase } from "../forms/FormNewPurchase";
import { FormNewENote } from "../forms/FormNewENote";
import { FormNewUser } from "../forms/FormNewUser";
import { FormNewThirdParties } from "../forms/FormNewThirdParties";
import { FormSelectMachine } from "../../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormSelectMachine";
import { FormClicksControl } from "../../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormClicksControl";
import './SearchResultsPannel.css'

const SECTIONS_RESULTS_LIMIT = 5;
const ACTIONS_RESULTS_LIMIT = 5;

const normalizeSearchText = (value = '') => value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const thirdPartyTypeDictionary = {
    'client':'Cliente',
    'supplier':'Proveedor',
    'employee':'Empleado',
    'contractor':'Contratista',
    'partner':'Socio',
    'other':'Otro',
    'both':'Cliente y Proveedor'
};

const documentTypeDictionary = {
    'Sell Invoice':'Factura de venta',
    'Purchase Invoice':'Factura de compra',
    'Purchase Document':'Documento de compra',
    'Purchase Order':'Orden de compra',
    'Equivalent Purchase Document':'Documento equivalente de compra',
    'Cash Recipt':'Recibo de caja',
    'Client Order':'Orden de cliente',
    'Credit Note':'Nota crédito',
    'Debit Note':'Nota débito',
    'Accounting Recipt':'Comprobante contable',
    'Transaction':'Transacción'
};

const electronicDocTypeDictionary = {
    'electronic invoice':'Factura electrónica',
    'Credit Note':'Nota crédito electrónica'
};


export function SearchResultsPannel({searchValue}){

    // requirements
    const {appInfo,userInfo,userConfig,appConfig} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();
    const navigate = useNavigate();
    const params = useParams();

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [search,setSearch] = useState(searchValue ?? "");
    const [searchResults,setSearchResults] = useState([]);
    const [categoryPages,setCategoryPages] = useState({sections:1, actions:1});
    const [categoryHasMore,setCategoryHasMore] = useState({});
    const [loadingMore,setLoadingMore] = useState({});

    // Getters
    const searchF = async(search)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/search',{
            searchValue:search,
            company_id:appInfo.company_id,
            user_id:userInfo.user_id
        });
        const nextResults = Array.isArray(res) ? res : [];
        setSearchResults(nextResults);
        setCategoryPages(nextResults.reduce((pages, category) => ({
            ...pages,
            [category.title]:category.page ?? 1
        }), {sections:1, actions:1}));
        setCategoryHasMore(nextResults.reduce((availability, category) => ({
            ...availability,
            [category.title]:category.results.length === SECTIONS_RESULTS_LIMIT
        }), {}));
        setLoadingMore({});
        setLoading(false);
        setDisabled(false);
    }


    useEffect(()=>{
        if(search == "" || search == undefined) return;
        setCategoryPages({sections:1, actions:1});
        const debounceTimer = setTimeout(()=>{
            searchF(search);
        },200);
        return ()=> clearTimeout(debounceTimer);
    },[search])

    // utils
    const iconsDictionary = {
        'sections':<i className="fa-solid fa-compass"/>,
        'actions':<i className="fa-solid fa-bolt"/>,
        'thirdParties':<i className="fa-solid fa-user"/>,
        'accounts':<i className="fa-solid fa-book-bookmark"/>,
        'transactions':<i className="fa-solid fa-arrow-right-arrow-left"/>,
        'documents':<i className="fa-regular fa-file-lines"/>,
        'electronicDocuments':<i className="fa-solid fa-file-invoice"/>,
        'processes':<i className="fa-solid fa-diagram-project"/>
    };

    const sectionTitles = {
        'sections':'Secciones',
        'actions':'Acciones',
        'thirdParties':'Terceros',
        'accounts':'Cuentas',
        'transactions':'Transacciones',
        'documents':'Documentos',
        'electronicDocuments':'Documentos electrónicos',
        'processes':'Procesos'
    };

    const sectionTitleColors = {
        'thirdParties':'#2AA63E',
        'accounts':'#7845F2',
        'transactions':'#F4499C',
        'documents':'#FF8318',
        'sections':'#B500F5',
        'actions':'#2A9689',
        'electronicDocuments':'#0EA5E9',
        'processes':'#F2B705'
    };

    const resultFields = (title,result)=>{
        switch(title){
            case 'sections': return [
                {text:result.text, strong:true},
                {text:result.group}
            ];
            case 'actions': return [
                {text:result.text, strong:true},
                {text:result.description}
            ];
            case 'thirdParties': return [
                {text:thirdPartyTypeDictionary[result.type] ?? result.type},
                {text:`${result.names ?? ''} ${result.lastNames ?? ''}`.trim(), strong:true},
                {text:result.indentification_number},
                {text:result.mail}
            ];
            case 'transactions': return [
                {text:documentTypeDictionary[result.doc_type] ?? result.doc_type},
                {text:formatDate(result.doc_date ?? result.created_at, true)},
                {text:`$ ${moneyFormat(result.total)}`, strong:true},
                {text:result.conceptName},
                {text:`${result.thirdPartyNames ?? ''} ${result.thirdPartyLastNames ?? ''}`.trim()}
            ];
            case 'documents': return [
                {text:documentTypeDictionary[result.document_type] ?? result.document_type},
                {text:formatDate(result.created_at, true)},
                {text:`$ ${moneyFormat(result.total)}`, strong:true},
                {text:result.description},
                {text:`${result.thirdPartyNames ?? ''} ${result.thirdPartyLastNames ?? ''}`.trim()},
                {text:result.electronicNumber}
            ];
            case 'electronicDocuments': return [
                {text:electronicDocTypeDictionary[result.type] ?? result.type},
                {text:`${documentTypeDictionary[result.document_type] ?? result.document_type} #${result.ownSerial}`},
                {text:result.number, strong:true},
                {text:formatDate(result.created_at, true)},
                {text:`${result.thirdPartyNames ?? ''} ${result.thirdPartyLastNames ?? ''}`.trim()}
            ];
            case 'processes': return [
                {text:result.processCode},
                {text:`#${result.ownSerial}`, strong:true},
                {text:formatDate(result.created_at, true)},
                {text:`$ ${moneyFormat(result.totalValue)}`, strong:true},
                {text:`${result.thirdPartyNames ?? ''} ${result.thirdPartyLastNames ?? ''}`.trim()},
                {text:result.processDescription}
            ];
            case 'accounts': return [
                {text:result.code, strong:true},
                {text:result.name}
            ];
            default: return [{text:result.name ?? result.description ?? `${result.id}`, strong:true}];
        }
    };

    const hasSearched = search != "" && search != undefined;

    // Catálogo vigente de navegación. Las rutas dinámicas de detalle no se
    // incluyen porque requieren un ID; sus entidades aparecen en los bloques
    // de resultados del backend.
    const navigationCatalog = [
        {text:'Inicio', path:'', group:'General', icon:<i className="fa-solid fa-house"/>},
        {text:'Crear nuevo', path:'new', group:'General', icon:<i className="fa-solid fa-plus"/>},
        {text:'Terceros', path:'thirdparties', group:'General', icon:<i className="fa-solid fa-users"/>},
        {text:'Acciones rápidas', path:'quickActions', group:'General', icon:<i className="fa-solid fa-bolt"/>},
        ...(userConfig?.access?.sections?.cashBoxes?.overAll ? [
            {text:'Cajas POS', path:'cashBoxes', group:'General', icon:<i className="fa-solid fa-cash-register"/>}
        ] : []),
        ...(userConfig?.access?.sections?.users?.overAll ? [
            {text:'Usuarios', path:'users', group:'General', icon:<i className="fa-solid fa-user-group"/>}
        ] : []),
        ...(appConfig?.access?.services?.e_facturation?.use ? [
            {text:'Documentos electrónicos', path:'edocuments', group:'Facturación', icon:<i className="fa-solid fa-file-invoice"/>}
        ] : []),
        {text:'Informes', path:'reports', group:'General', icon:<i className="fa-solid fa-chart-column"/>},
        {text:'Estadísticas', path:'analytics', group:'General', icon:<i className="fa-solid fa-chart-line"/>},
        {text:'Configuración', path:'settings', group:'General', icon:<i className="fa-solid fa-gear"/>},
        {text:'Tutoriales', path:'tutorials', group:'Ayuda', icon:<i className="fa-solid fa-graduation-cap"/>},
        {text:'Ayuda', path:'help', group:'Ayuda', icon:<i className="fa-solid fa-circle-question"/>},
        {text:'Plan de cuentas', path:'accounts', group:'Contabilidad', icon:<i className="fa-solid fa-book-bookmark"/>},
        {text:'Conceptos e impuestos', path:'concepts', group:'Contabilidad', icon:<i className="fa-solid fa-scale-balanced"/>},
        {text:'Mi empresa', path:'myBussines', group:'Empresa', icon:<i className="fa-solid fa-building"/>},
        {text:'Centros de costo', path:'myBussines/costCenters', group:'Empresa', icon:<i className="fa-solid fa-folder-tree"/>},
        {text:'Líneas de negocio', path:'myBussines/Bussines', group:'Empresa', icon:<i className="fa-solid fa-briefcase"/>},
        {text:'Unidades de negocio', path:'myBussines/Units', group:'Empresa', icon:<i className="fa-solid fa-store"/>},
        {text:'Servicios', path:'services', group:'General', icon:<i className="fa-solid fa-grid-2"/>},

        {text:'Configuración general', path:'settings', group:'Configuración', icon:<i className="fa-solid fa-building"/>},
        {text:'Configuración de cuenta', path:'settings/Account', group:'Configuración', icon:<i className="fa-solid fa-user-gear"/>},
        {text:'Configuración de notificaciones', path:'settings/Alerts', group:'Configuración', icon:<i className="fa-solid fa-bullhorn"/>},
        {text:'Personalización', path:'settings/Styles', group:'Configuración', icon:<i className="fa-solid fa-palette"/>},
        {text:'Configuración de facturación', path:'settings/Billing', group:'Configuración', icon:<i className="fa-solid fa-wallet"/>},
        {text:'Configuración de seguridad', path:'settings/Security', group:'Configuración', icon:<i className="fa-solid fa-fingerprint"/>},
        {text:'Dispositivos', path:'settings/Devices', group:'Configuración', icon:<i className="fa-solid fa-mobile-screen"/>},
        {text:'Configuración del sistema', path:'settings/System', group:'Configuración', icon:<i className="fa-solid fa-terminal"/>},

        {text:'Informe de órdenes de cliente', path:'reports/OCS', group:'Informes', icon:<i className="fa-solid fa-file-contract"/>},
        {text:'Informe de órdenes de producción', path:'reports/OPS', group:'Informes', icon:<i className="fa-solid fa-file-lines"/>},
        {text:'Informe de documentos de compra', path:'reports/DCS', group:'Informes', icon:<i className="fa-solid fa-file-lines"/>},
        {text:'Informe de consumos de inventario', path:'reports/CIS', group:'Informes', icon:<i className="fa-solid fa-boxes-stacked"/>},
        {text:'Informe de facturas de venta', path:'reports/FVS', group:'Informes', icon:<i className="fa-solid fa-file-invoice"/>},
        {text:'Informe de transacciones', path:'reports/TRS', group:'Informes', icon:<i className="fa-solid fa-magnifying-glass-chart"/>},
        {text:'Balance de prueba', path:'reports/Balance', group:'Informes', icon:<i className="fa-solid fa-scale-balanced"/>},
        {text:'Kardex de inventario', path:'reports/Kardex', group:'Informes', icon:<i className="fa-solid fa-boxes-stacked"/>},
        {text:'Informe de procesos', path:'reports/Processes', group:'Informes', icon:<i className="fa-solid fa-diagram-project"/>},
        {text:'Eficiencia de usuarios', path:'reports/Eficiency', group:'Informes', icon:<i className="fa-solid fa-gauge-high"/>},
        {text:'Informe de cartera', path:'reports/BriefCases', group:'Informes', icon:<i className="fa-solid fa-wallet"/>},
        {text:'Historial de procesos', path:'reports/ProcessInstanceHistorial', group:'Informes', icon:<i className="fa-solid fa-clock-rotate-left"/>},
        {text:'Informe de cierres de caja', path:'reports/CashBoxesCloseReport', group:'Informes', icon:<i className="fa-solid fa-cash-register"/>},

        {text:'Estadísticas de procesos', path:'analytics/processInstances', group:'Estadísticas', icon:<i className="fa-solid fa-chart-line"/>},
        ...(appConfig?.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access ? [
            {text:'Informe de clicks', path:'reports/zjClicksReport', group:'Informes personalizados', icon:<i className="fa-solid fa-arrow-pointer"/>},
            {text:'Informe de servicios', path:'reports/zjServicesReport', group:'Informes personalizados', icon:<i className="fa-solid fa-screwdriver-wrench"/>},
            {text:'Auditoría de clicks', path:'reports/zjAuditoryClicksReport', group:'Informes personalizados', icon:<i className="fa-solid fa-shield-halved"/>}
        ] : [])
    ];

    const sectionCanCreate = (sectionName) => (
        userConfig?.access?.sections?.[sectionName]?.can_create !== false
    );
    const canCreateDocuments = sectionCanCreate('newDocument');
    const canCreateThirdParties = sectionCanCreate('thirdparties');
    const canCreateUsers = sectionCanCreate('users');
    const canCreateCashReceipts = sectionCanCreate('cashBoxes') && canCreateDocuments;

    const actionsCatalog = userConfig?.access?.sections?.new?.overAll ? [
        ...(canCreateDocuments ? [
            {text:'Crear orden de trabajo', description:'Iniciar un nuevo proceso', icon:<i className="fa-solid fa-bell-concierge"/>, children:<FormSelectNewProcess/>},
            {text:'Crear orden de cliente', description:'Registrar una nueva orden de cliente', icon:<i className="fa-regular fa-file"/>, children:<FormNewClientOrder canRepeatServices={true}/>}
        ] : []),
        ...(userConfig?.access?.sections?.cashBoxes?.overAll && canCreateCashReceipts ? [
            {text:'Crear recibo de caja', description:'Registrar un ingreso de caja', icon:<i className="fa-solid fa-receipt"/>, children:<FormNewCashRecipt/>}
        ] : []),
        ...(canCreateDocuments ? [
            {text:'Crear factura de venta', description:'Generar una nueva factura', icon:<i className="fa-solid fa-file-invoice"/>, children:<FormNewInvoice/>},
            {text:'Crear compra', description:'Registrar una factura o documento de compra', icon:<i className="fa-solid fa-cart-shopping"/>, children:<FormNewPurchase/>},
            {text:'Crear nota débito o crédito', description:'Generar una nota para un documento', icon:<i className="fa-solid fa-note-sticky"/>, children:<FormNewENote/>}
        ] : []),
        ...(userConfig?.access?.sections?.users?.overAll && canCreateUsers ? [
            {text:'Crear usuario', description:'Agregar un usuario a la compañía', icon:<i className="fa-solid fa-person-circle-plus"/>, children:<FormNewUser/>}
        ] : []),
        ...(canCreateThirdParties ? [
            {text:'Crear tercero', description:'Registrar un cliente, proveedor u otro tercero', icon:<i className="fa-regular fa-user"/>, children:<FormNewThirdParties/>}
        ] : []),
        ...(appConfig?.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access ? [
            {text:'Crear reporte de uso de maquinaria', description:'Registrar movimientos de maquinaria', icon:<i className="fa-solid fa-tractor"/>, children:<FormSelectMachine appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} popOutAlert={popOutAlert}/>},
            {text:'Registrar clicks', description:'Crear el registro diario de clicks', icon:<i className="fa-solid fa-arrow-pointer"/>, children:<FormClicksControl appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} popOutAlert={popOutAlert}/>}
        ] : [])
    ] : [];

    const searchTerm = normalizeSearchText(search);
    const matchesCatalogSearch = (element) => normalizeSearchText(
        `${element.text} ${element.group ?? ''} ${element.description ?? ''}`
    ).includes(searchTerm);

    const uniqueNavigationCatalog = Array.from(
        new Map(navigationCatalog.map(element => [element.path, element])).values()
    );
    const allSectionsResults = hasSearched ? uniqueNavigationCatalog.filter(matchesCatalogSearch) : [];
    const allActionsResults = hasSearched ? actionsCatalog.filter(matchesCatalogSearch) : [];
    const sectionsResults = hasSearched
        ? allSectionsResults.slice(0, SECTIONS_RESULTS_LIMIT * (categoryPages.sections ?? 1))
        : [];
    const actionsResults = hasSearched
        ? allActionsResults.slice(0, ACTIONS_RESULTS_LIMIT * (categoryPages.actions ?? 1))
        : [];

    const visibleCategories = [
        ...(sectionsResults.length > 0 ? [{title:'sections', results:sectionsResults}] : []),
        ...(actionsResults.length > 0 ? [{title:'actions', results:actionsResults}] : []),
        ...searchResults.filter(element=>element.results.length > 0)
    ];

    const categoryCanLoadMore = (title) => {
        if(title === 'sections') return sectionsResults.length < allSectionsResults.length;
        if(title === 'actions') return actionsResults.length < allActionsResults.length;
        return categoryHasMore[title] === true;
    };

    const handleLoadMore = async(title) => {
        if(loadingMore[title] || !categoryCanLoadMore(title)) return;

        const nextPage = (categoryPages[title] ?? 1) + 1;
        setLoadingMore(current => ({...current, [title]:true}));

        if(title === 'sections' || title === 'actions'){
            setCategoryPages(current => ({...current, [title]:nextPage}));
            setLoadingMore(current => ({...current, [title]:false}));
            return;
        }

        try {
            const response = await postInfo('/search',{
                searchValue:search,
                company_id:appInfo.company_id,
                user_id:userInfo.user_id,
                category:title,
                page:nextPage
            });
            const nextCategory = Array.isArray(response)
                ? response.find(category => category.title === title)
                : undefined;
            const nextRows = nextCategory?.results ?? [];

            setSearchResults(current => current.map(category => category.title === title
                ? {
                    ...category,
                    page:nextCategory?.page ?? nextPage,
                    results:[...category.results, ...nextRows]
                }
                : category
            ));
            setCategoryPages(current => ({
                ...current,
                [title]:nextCategory?.page ?? nextPage
            }));
            setCategoryHasMore(current => ({
                ...current,
                [title]:nextRows.length === SECTIONS_RESULTS_LIMIT
            }));
        } finally {
            setLoadingMore(current => ({...current, [title]:false}));
        }
    };

    // Navega a la ruta específica de la app según el tipo de resultado (sección,
    // tercero, cuenta o transacción), o abre la previsualización correspondiente
    // (documentos, que no tienen una ruta propia dentro de la app).
    const handleNavigate = (title,result)=>{
        const goTo = (path)=>{
            navigate(`/SGA_management/${params.company_key}/${params.user_key}/${path}`);
            popOutAlert();
        };

        switch(title){
            case 'sections':
                goTo(result.path);
                return;
            case 'actions':
                popOutAlert();
                popInAlert(result.children);
                return;
            case 'thirdParties':
                goTo(`thirdParties/${result.id}`);
                return;
            case 'accounts':
                goTo(`reports/Balance/${result.id}`);
                return;
            case 'transactions':
                goTo(`reports/TRS/${result.id}`);
                return;
            case 'documents':
                popOutAlert();
                popInAlert(<DocumentPreview data={{
                    doc_id:result.id,
                    doc_type:result.document_type,
                    ownSerial:result.ownSerial,
                    created_at:result.created_at
                }}/>);
                return;
            case 'electronicDocuments':
                popOutAlert();
                popInAlert(<DocumentPreview data={{
                    doc_id:result.doc_id,
                    doc_type:result.document_type,
                    ownSerial:result.ownSerial,
                    created_at:result.created_at
                }}/>);
                return;
            case 'processes':
                popOutAlert();
                popInAlert(<ProcessStatusAlert instance_id={result.id}/>);
                return;
            default:
                return;
        }
    };

    return(
        <div className="SearchResultsPannel">
            <div className={`head${disabled ? ' headDisabled' : ''}`}>
                <SearchBar placeholder={'Busca en toda la app'} value={search} action={setSearch} autoFocus={true}/>
                <span className="escBadge">Esc</span>
            </div>
            <div className="bodyResultsPannel">
                {loading && (
                    <SearchResultsLoadingShader searchValue={search}/>
                )}
                {!loading && !hasSearched && (
                    <div className="emptyState">
                        <i className="fa-solid fa-magnifying-glass"/>
                        <p>Busca terceros, documentos, transacciones y cuentas</p>
                    </div>
                )}
                {!loading && hasSearched && visibleCategories.length == 0 && (
                    <div className="emptyState">
                        <i className="fa-solid fa-ghost"/>
                        <p>Sin resultados para "{search}"</p>
                        <span>Intenta con otro nombre, número o código</span>
                    </div>
                )}
                {!loading && hasSearched && visibleCategories.map((element,index)=>(
                    <div
                        className="searchCategory"
                        key={element.title ?? index}
                        style={{'--section-title-color':sectionTitleColors[element.title] ?? 'var(--descriptionText)'}}
                    >
                        <div
                            className="categoryHead"
                        >
                            {iconsDictionary[element.title]}
                            <h6>
                                {sectionTitles[element.title] ?? element.title}
                            </h6>
                        </div>
                        <ul className="bodyResults">
                            {element.results.map((result,resultIndex)=>{
                                const fields = resultFields(element.title,result).filter(field=>field.text != undefined && field.text != null && field.text != "");
                                return(
                                    <li
                                        className="resultRow"
                                        key={result.id ?? result.path ?? resultIndex}
                                        role="button"
                                        tabIndex={0}
                                        onClick={()=>handleNavigate(element.title,result)}
                                        onKeyDown={(event)=>{
                                            if(event.key == 'Enter' || event.key == ' '){
                                                event.preventDefault();
                                                handleNavigate(element.title,result);
                                            }
                                        }}
                                    >
                                        <span className="resultIcon">{result.icon ?? iconsDictionary[element.title]}</span>
                                        <div className="resultText">
                                            {fields.map((field,fieldIndex)=>(
                                                <span className={`resultField${field.strong ? ' strong' : ''}`} key={fieldIndex}>{field.text}</span>
                                            ))}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                        {loadingMore[element.title] && (
                            <SearchResultsLoadingShader searchValue={search} compact={true}/>
                        )}
                        {categoryCanLoadMore(element.title) && (
                            <button
                                type="button"
                                className="loadMoreCategory"
                                disabled={loadingMore[element.title]}
                                onClick={()=>handleLoadMore(element.title)}
                            >
                                <span>{loadingMore[element.title] ? 'Cargando...' : `Cargar más ${sectionTitles[element.title]}`}</span>
                                <i
                                    aria-hidden="true"
                                    className={loadingMore[element.title]
                                        ? 'fa-solid fa-spinner fa-spin'
                                        : 'fa-solid fa-angle-down'
                                    }
                                />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
