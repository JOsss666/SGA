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
import { printCashRecipt } from "../../../utils/functions";
import { CashReciptDesign } from "./Alerts/CashReciptDesign";
import {FormClicksControl} from '../../../../../../costume-modules/zjSAS.S/src/containers/forms/FormClicksControl'
import { isElectron } from "../../../App";

export function New(){
    const {userConfig,appInfo,userInfo} = useAppInfo();
    const {popInAlert} = useAlert();

    console.log("Acceso a terceros: ",userConfig.access.sections.thirdparties.can_create)

    const options = [
        //{text:'Crear orden de trabajo',children:<SelectTpeNewDoc/>,icon:<i className="fa-solid fa-bell-concierge"/>},
        //{text:'Crear orden de trabajo',children:<ProcessStatusAlert/>,icon:<i className="fa-solid fa-bell-concierge"/>},
        {text:'Crear orden de trabajo',children:<FormSelectNewProcess/>,icon:<i className="fa-solid fa-bell-concierge"/>},
        {text:'Cierre de clicks',children:<FormClicksControl appInfo={appInfo} userConfig={userConfig} userInfo={userInfo}/>,icon:<i className="fa-solid fa-bell-concierge"/>},
        //{text:'Ver recibo',children:<CashReciptDesign/>,icon:<i className="fa-solid fa-bell-concierge"/>},
        ...(userConfig.access != undefined && userConfig.access.sections.cashBoxes.overAll ? [{text:'Crear recibo de caja',children:<FormNewCashRecipt/>,icon:<i className="fa-solid fa-receipt"/>}]:[]),
        //{text:'Crear nuevo documento',children:<SelectTpeNewDoc/>,icon:<i className="fa-regular fa-file"/>},
        {text:'Crear nueva orden de cliente',children:<FormNewClientOrder/>,icon:<i className="fa-regular fa-file"/>},
        ...(userConfig.access != undefined && userConfig.access.sections.users.overAll ? [{text:'Crear usuario',children:<FormNewUser/>,icon:<i className="fa-solid fa-person-circle-plus"/>}]:[]),
        {text:'Crear tercero',children:<FormNewThirdParties quickCreation={!userConfig.access.sections.thirdparties.can_create}/>,icon:<i className="fa-regular fa-user"/>},
        ...(isElectron ? [{
            text: 'Imprimir recibo',
            children: (
                <button onClick={() => printCashRecipt()}>
                    Imprimir recibo
                </button>
            ),
            icon: <i className="fa-regular fa-user"/>
        }] : []),
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
        </div>
    )
}