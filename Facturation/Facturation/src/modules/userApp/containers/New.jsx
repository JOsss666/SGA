import { useAlert, useAppInfo } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormNewThirdParties } from "./forms/FormNewThirdParties";
import { FormNewUser } from "./forms/FormNewUser";
import { FormNewCashRecipt } from "./forms/FormNewCashRecipt";
import { FormSelectNewProcess } from "./forms/FormSelectNewProcess";
import { FormNewClientOrder } from "./forms/FormNewClientOrder";
import { CashReciptDesign } from "./Alerts/CashReciptDesign";
import {FormClicksControl} from '../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormClicksControl'
import {FormSelectMachine} from '../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormSelectMachine'
import { useEffect, useState } from "react";
import { verifiClicksControl } from "../../../../../../costume-modules/zjSAS.S/utils/functions";
import { NoResults } from "./NoResults";
import { ClientOrderPreview } from "./Alerts/ClientOrderPreview";
import { FormNewInvoice } from "./forms/FormNewInvoice";
import { FormNewPurchase } from "./forms/FormNewPurchase";
import { FormNewENote } from "./forms/FormNewENote";
import { SellInvoiceDesign } from "./Alerts/SellInvoiceDesing";
import { FormNewThirdPartyDelegation } from "./forms/FormNewThirdPartyDelegation";
import { postInfo } from "../../../utils/functions";
import './New.css'
import { FormNewParameterDocument } from "./forms/FormNewParameterDocument";
import { FormAccountingAdjustment } from "./forms/formAccountingAdjustment";
import { FormNewFacturationOrder } from "../components/FormNewFacturationOrder";
import { NewOptions } from "../components/newOptions";

export function New(){
    const {userConfig,appInfo,userInfo, appConfig} = useAppInfo();
    const [paramDocs,setParamDocs] = useState([]);
    const {popInAlert,popOutAlert} = useAlert();
    const [disabled,setDisabled] = useState(false);
    const [messgeDisabled,setMessageDisabled] = useState('')
    const [numberingRangesStatus, setNumberingRangesStatus] = useState('idle');

    // PramDocs options

    const getParamDoc = async()=>{
        let res = await postInfo('/getParamDocsOptions',{
            company_id:appInfo.company_id,
            user_id:userInfo.user_id
        });
        console.log('Hola ',res)
        if(res[0] === false) return [];
        setParamDocs(res[1])
    }
    
    useEffect(()=>{
        console.log('Param Docus', paramDocs);
    },[paramDocs])

    useEffect(() => {
        if (!appConfig?.access) return;
        const hasAccess = appConfig.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access;

        if (hasAccess) {
            setMessageDisabled('Cargando Reporte de clicks...');
            setDisabled(true);
            verifyClicksControlZ();
        }
    }, [appConfig]);

    useEffect(()=>{
        getParamDoc();     
    },[]) 


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

    const processOptions = [
        {
            id:'new-process',
            text:'Nuevo proceso',
            icon:<i className="fa-solid fa-code-merge" />,
            action:() => popInAlert(<FormSelectNewProcess />)
        }
    ];

    const documentOptions = [
        {
            id:'new-client-order',
            text:'Nueva orden de cliente',
            icon:<i className="fa-regular fa-file" />,
            action:() => popInAlert(<FormNewClientOrder canRepeatServices={true} />)
        },
        {
            id:'new-sell-invoice',
            text:'Factura de venta POS',
            icon:<i className="fa-solid fa-file-invoice" />,
            action:() => popInAlert(<FormNewInvoice />)
        },
        ...(userConfig?.access?.sections?.cashBoxes?.overAll ||
            userConfig?.access?.sections?.cashBoxes?.enabled?.length > 0 ? [{
                id:'new-cash-receipt',
                text:'Recibo de caja',
                icon:<i className="fa-solid fa-receipt" />,
                action:() => popInAlert(<FormNewCashRecipt />)
            }] : []),
        {
            id:'new-purchase',
            text:'Factura de Compra',
            icon:<i className="fa-solid fa-cart-shopping" />,
            action:() => popInAlert(<FormNewPurchase />)
        },
        {
            id:'new-debit-credit-note',
            text:'Nota débito o crédito',
            icon:<i className="fa-solid fa-note-sticky" />,
            action:() => popInAlert(<FormNewENote />)
        },
        {
            id:'new-facturation-order',
            text:'Orden de facturación',
            icon:<i className="bi bi-receipt-cutoff" />,
            action:() => popInAlert(<FormNewFacturationOrder />)
        },
        {
            id:'new-purchase-order',
            text:'Orden de compra',
            icon:<i className="bi bi-receipt-cutoff" />,
            action:() => popInAlert(<FormNewFacturationOrder />)
        },
        {
            id:'new-accounting-adjustment',
            text:'Ajuste contable',
            icon:<i className="fa-solid fa-scale-balanced" />,
            action:() => popInAlert(<FormAccountingAdjustment />)
        },
        ...(userConfig?.access?.sections?.reports?.documents?.ThirdPartyDelegation === true ? [{
            id:'new-third-party-delegation',
            text:'Asignación a proveedor',
            icon:<i className="bi bi-person-bounding-box" />,
            action:() => popInAlert(<FormNewThirdPartyDelegation instnacePreInfo={{}} />)
        }] : [])
    ];

    const systemOptions = [
        ...(userConfig?.access?.sections?.users?.overAll ? [{
            id:'new-user',
            text:'Usuario',
            icon:<i className="fa-solid fa-person-circle-plus" />,
            action:() => popInAlert(<FormNewUser />)
        }] : []),
        {
            id:'new-third-party',
            text:'Tercero',
            icon:<i className="fa-regular fa-user" />,
            action:() => popInAlert(<FormNewThirdParties quickCreation={!userConfig?.access?.sections?.thirdparties?.can_create} />)
        },
        {
            id:'print-cash-receipt',
            text:'Imprimir recibos',
            icon:<i className="fa-solid fa-print" />,
            action:() => popInAlert(<CashReciptDesign />)
        },
        {
            id:'print-client-order',
            text:'Imprimir órdenes de cliente',
            icon:<i className="fa-solid fa-print" />,
            action:() => popInAlert(<ClientOrderPreview />)
        },
        {
            id:'print-sell-invoice',
            text:'Imprimir factura de venta',
            icon:<i className="fa-solid fa-print" />,
            action:() => popInAlert(<SellInvoiceDesign />)
        }
    ];

    const companyOptions = [
        ...paramDocs.map(element => ({
            id:`parameter-document-${element.id}`,
            text:element.name,
            icon:<i className="bi bi-file-earmark-code-fill" />,
            action:() => popInAlert(<FormNewParameterDocument params={element} />)
        })),
        ...(appConfig?.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access ? [
            {
                id:'machine-use-report',
                text:'Reporte uso maquinaria',
                icon:<i className="fa-solid fa-tractor" />,
                action:() => popInAlert(<FormSelectMachine appInfo={appInfo} userConfig={userConfig} popOutAlert={popOutAlert} userInfo={userInfo} />)
            },
            {
                id:'click-registration',
                text:'Registro de clicks',
                icon:<i className="fa-solid fa-arrow-pointer" />,
                action:() => popInAlert(<FormClicksControl appInfo={appInfo} userConfig={userConfig} userInfo={userInfo} popOutAlert={popOutAlert} />)
            }
        ] : [])
    ];

    return(
        <div className="New">
            <BoldTitle text={'Crear nuevo'}/>
            <DescriptionSpan text={'Crea todo lo que necesites en un solo click'}/>
            {!disabled && (
                <div className="newOptionsCategories">
                    <section className="newOptionsCategory" aria-labelledby="newOptionsProcessesTitle">
                        <NewOptions options={processOptions} title={'Procesos'}/>
                    </section>
                    <section className="newOptionsCategory" aria-labelledby="newOptionsDocumentsTitle">
                        <NewOptions options={documentOptions} title={'Documentos'} />
                    </section>
                    <section className="newOptionsCategory" aria-labelledby="newOptionsSystemTitle">
                        <NewOptions options={systemOptions} title={'Sistema'}/>
                    </section>
                    <section className="newOptionsCategory" aria-label={appInfo?.legal_name || 'Personalizado'}>
                        <NewOptions options={companyOptions} title={appInfo?.legal_name || 'Personalizado'}/>
                    </section>
                </div>
            )}
            {disabled && (
                <>
                    <NoResults title={messgeDisabled} img={'https://uxwing.com/wp-content/themes/uxwing/download/signs-and-symbols/stop-blocked-icon.png'}/>
                    {userConfig?.access?.services?.personalized?.['custom-modules']?.['z&j_clicksControl']?.access && (
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
