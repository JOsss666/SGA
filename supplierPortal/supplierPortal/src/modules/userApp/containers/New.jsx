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
import { FormNewEvidence } from "./forms/FormNewEvidence";

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
        
        {text:'Crear nueva evidencia',children:<FormNewEvidence/>,icon:<i className="bi bi-paperclip"/>},
        
        // {text:'Imprimir Ordes de cliente',children:<ClientOrderPreview/>,icon:<i className="fa-solid fa-print"/>},
        
        // {text:'Imprimir Factura de venta',children:<SellInvoiceDesign/>,icon:<i className="fa-solid fa-print"/>},
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
