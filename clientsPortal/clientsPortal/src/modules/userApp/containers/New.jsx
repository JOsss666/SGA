import { useAlert, useAppInfo } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormSelectNewProcess } from "./forms/FormSelectNewProcess";
import {FormClicksControl} from '../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormClicksControl'
import { useEffect, useState } from "react";
import { verifiClicksControl } from "../../../../../../costume-modules/zjSAS.S/utils/functions";
import { NoResults } from "./NoResults";
// import { ClientOrderPreview } from "./Alerts/ClientOrderPreview";
// import { SellInvoiceDesign } from "./Alerts/SellInvoiceDesing";
import './New.css'
import { FormNewParameterDocument } from "./forms/FormNewParameterDocument";

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
        { text: 'Crear nuevo proceso', children: <FormSelectNewProcess />, icon: <i className="fa-solid fa-diagram-project"/> },
        //{ text: 'Crear nueva orden de cliente', children: <FormNewClientOrder canRepeatServices={true} />, icon: <i className="fa-regular fa-file" /> }, 
        // Simplificado con optional chaining

        { text: 'Crear nueva orden', children:  <FormNewParameterDocument/>, icon: <i className="fa-solid fa-bell-concierge" /> },
        
        // {text:'Imprimir Ordes de cliente',children:<ClientOrderPreview/>,icon:<i className="fa-solid fa-print"/>},
        //{text:'Factura de prueba',children:<FormInvoice/>,icon:<i className="fa-solid fa-print"/>},
        
        // {text:'Imprimir Factura de venta',children:<SellInvoiceDesign/>,icon:<i className="fa-solid fa-print"/>},
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
