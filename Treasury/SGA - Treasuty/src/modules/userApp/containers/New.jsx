import { useAlert, useAppInfo } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormNewBussines } from "./forms/FormNewBussines";
import { FormNewCellar } from "./forms/FormNewCellar";
import { FormNewConcept } from "./forms/FormNewConcept";
import { FormNewCostCenter } from "./forms/FormNewCostCenter";
import { FormNewStore } from "./forms/FormNewStore";
import { FormNewTax } from "./forms/FormNewTax";
import { FormNewThirdParties } from "./forms/FormNewThirdParties";
import { FormNewUser } from "./forms/FormNewUser";
import { SelectTpeNewDoc } from "./forms/SelectTypeNewDoc";
import { CreatePricesList } from "./forms/CreatePricesList";
import { FormNewProduct } from "./forms/FormNewProduct";
import { FormNewPaymentMethod } from "./forms/FormNewPaymentMethod";
import './New.css'
import { FormNewDC } from "./forms/FormNewDC";
import { FormNewCashRecipt } from "./forms/FormNewCashRecipt";
import { ProcessStatusAlert } from "./Alerts/ProcessStatusAlert";
import { FormSelectNewProcess } from "./forms/FormSelectNewProcess";
import { FormNewClientOrder } from "./forms/FormNewClientOrder";
import { getNumberingRangesElectronicInvoices, newElectronicInvoide, printCashRecipt, scanDevices, showActualToken, showAPITaxes } from "../../../utils/functions";
import { CashReciptDesign } from "./Alerts/CashReciptDesign";
import {FormClicksControl} from '../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormClicksControl'
import {FormSelectMachine} from '../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormSelectMachine'
import { isElectron } from "../../../App";
import { useEffect, useState } from "react";
import { verifiClicksControl } from "../../../../../../costume-modules/zjSAS.S/utils/functions";
import { NoResults } from "./NoResults";
import { ClientOrderPreview } from "./Alerts/ClientOrderPreview";
import { FormButton } from "../components/FormButton";
import { FormNewInvoice } from "./forms/FormNewInvoice";
import { FormNewPurchase } from "./forms/FormNewPurchase";
import { FormNewENote } from "./forms/FormNewENote";
import { NoAccess } from "./NoAccess";
import { SellInvoiceDesign } from "./Alerts/SellInvoiceDesing";
import { FormInvoice } from "./forms/FormInvoce";
import { postInfo } from "../../../utils/functions";

export function New(){
    const {userConfig,appInfo,userInfo, appConfig} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();
    const [disabled,setDisabled] = useState(false);
    const [messgeDisabled,setMessageDisabled] = useState('')
    const [numberingRangesStatus, setNumberingRangesStatus] = useState('idle');

    useEffect(() => {
        if (!appConfig?.access) return;
        const hasAccess = appConfig.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access;

        if (hasAccess) {
            setMessageDisabled('Cargando Reporte de clicks...');
            setDisabled(true);
            verifyClicksControlZ();
        }
    }, [appConfig]);


    let verifyClicksControlZ = async () => {
        const hasCompletedClicks = await verifiClicksControl();
        console.log(hasCompletedClicks)
        if (!hasCompletedClicks[0]) {
            let m = hasCompletedClicks[1].join(', ');
            m += '.'
            setMessageDisabled(`Completar cliks diarios para ${hasCompletedClicks[1].length >= 1 ?  m:"continuar"}`);
            
        }
        setDisabled(!hasCompletedClicks[0]);
    }

    const options = [
        { text: 'Crear orden de trabajo', children: <FormSelectNewProcess />, icon: <i className="fa-solid fa-bell-concierge" /> },
        { text: 'Crear nueva orden de cliente', children: <FormNewClientOrder canRepeatServices={true} />, icon: <i className="fa-regular fa-file" /> },
        
        // Simplificado con optional chaining
        ...(userConfig?.access?.sections?.cashBoxes?.overAll ||
            userConfig?.access?.sections?.cashBoxes?.enabled?.length > 0 ?
            [{ text: 'Crear recibo de caja', children: <FormNewCashRecipt />, icon: <i className="fa-solid fa-receipt" /> }] : []),
        
        {text:'Factura de venta',children:<FormNewInvoice/>,icon:<i className="fa-solid fa-file-invoice"/>},

        {text:'Compra',children:<FormNewPurchase/>,icon:<i className="fa-solid fa-cart-shopping"/>},

        {text:'Nota débito o crédito',children:<FormNewENote/>,icon:<i className="fa-solid fa-note-sticky"/>},

        ...(userConfig?.access?.sections?.users?.overAll ?
            [{ text: 'Crear usuario', children: <FormNewUser />, icon: <i className="fa-solid fa-person-circle-plus" /> }] : []),
        
        { text: 'Crear tercero', children: <FormNewThirdParties quickCreation={!userConfig?.access?.sections?.thirdparties?.can_create} />, icon: <i className="fa-regular fa-user" /> },

        // CORRECCIÓN: Acceso seguro a módulos personalizados
        ...(appConfig?.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access ? [
            { 
                text: 'Crear reporte uso maquinaria', 
                children: <FormSelectMachine appInfo={appInfo} userConfig={userConfig} popOutAlert={popOutAlert} userInfo={userInfo} />, 
                icon: <i className="fa-solid fa-tractor" /> 
            },
            { 
                text: 'Registro de clicks', 
                children: <FormClicksControl appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} popOutAlert={popOutAlert} />, 
                icon: <i className="fa-solid fa-arrow-pointer" /> 
            }
        ] : []),
        //{text:'Crear orden de trabajo',children:<SelectTpeNewDoc/>,icon:<i className="fa-solid fa-bell-concierge"/>},
        //{text:'Crear orden de trabajo',children:<ProcessStatusAlert/>,icon:<i className="fa-solid fa-bell-concierge"/>},
        //{text:'Crear nuevo documento',children:<SelectTpeNewDoc/>,icon:<i className="fa-regular fa-file"/>},

        {text:'Imprimir recibos',children:<CashReciptDesign/>,icon:<i className="fa-solid fa-print"/>},
        /*
        {text:'Imprimir Facturas',children:
            <NoAccess 
                noRedirect={true} 
                title={'Formulario no disponible'} 
                description={'Formulario en mantenimiento, pronto estara disponible.'}
            />,
            icon:<i className="fa-solid fa-print"/>},
        */
        {text:'Imprimir Ordes de cliente',children:<ClientOrderPreview/>,icon:<i className="fa-solid fa-print"/>},
        //{text:'Factura de prueba',children:<FormInvoice/>,icon:<i className="fa-solid fa-print"/>},
        
        {text:'Imprimir Factura de venta',children:<SellInvoiceDesign/>,icon:<i className="fa-solid fa-print"/>},
        /*
        {text:'Opciones de factura electronica',children:<div style={{
            paddingTop:'8vh',
            display:'flex',
            gap:'1vh',
            flexDirection:'column'
        }}>
            <FormButton text={'Obtener rangos Númericos'} onClick={()=>{
                getNumberingRangesElectronicInvoices({})
            }}></FormButton>
            <FormButton text={'Mostrar token actual'} onClick={()=>{
                showActualToken({})
            }}></FormButton>
            <FormButton text={'Obtener Impuestos'} onClick={()=>{
                showAPITaxes({})
            }}></FormButton>
            <FormButton text={'Generar factura de prueba'} onClick={()=>{
                newElectronicInvoide({
                    type:'invoice'
                })
            }}></FormButton>
        </div>},
        /**/
        //{text:'Crear metodo de pago',children:<FormNewPaymentMethod/>,icon:<i className="fa-regular fa-credit-card"/>},
        //{text:'Crear Concepto',children:<FormNewConcept/>,icon:<i className="fa-solid fa-scale-balanced"/>},
        //{text:'Crear Producto',children:<FormNewProduct/>,icon:<i className="fa-solid fa-shirt"/>},
        //{text:'Crear Impuesto',children:<FormNewTax/>,icon:<i className="fa-solid fa-coins"/>},
        //{text:'Crear Tienda',children:<FormNewStore/>,icon:<i className="fa-solid fa-store"/>},
        //{text:'Crear Centro de costo',children:<FormNewCostCenter/>,icon:<i className="fa-solid fa-folder-tree"/>},
        //{text:'Crear Bodega',children:<FormNewCellar/>,icon:<i className="fa-solid fa-dolly"/>},
        //{text:'Crear línea de negocio',children:<FormNewBussines/>,icon:<i className="fa-solid fa-briefcase"/>},
        //{text:'Crear lista de precios',children:<CreatePricesList/>,icon:<i className="fa-regular fa-file-excel"/>},   
    ]

    return(
        <div className="New">
            <BoldTitle text={'Crear nuevo'}/>
            <DescriptionSpan text={'Crea todo lo que necesites en un solo click'}/>
            {!disabled && (
                <div className="gridOptions">
                    {options.map((element,index)=>(
                        <span key={index} onClick={()=>{
                            popInAlert(element.children)
                        }}>
                            {element.icon}
                            {element.text}
                        </span>
                    ))}
                </div>
            )}
            {disabled && (
                <>
                    <NoResults title={messgeDisabled} img={'https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/stop-blocked-icon.png'}/>
                    {userConfig.access != undefined && (userConfig.access.services.personalized['custom-modules'])["z&j_clicksControl"].access && (
                        <span className="createOption" onClick={()=>{
                            popInAlert(<FormClicksControl appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} popOutAlert={popOutAlert} reloadFun={verifyClicksControlZ} />)
                        }}>
                            <i className="fa-solid fa-arrow-pointer" />
                            Registrar clicks
                        </span>
                    )}
                </>
            )}
        </div>
    )
}
