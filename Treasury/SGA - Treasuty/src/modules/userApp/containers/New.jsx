import { useAlert } from "../../../context/context"
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
import { FormNewCashRecipt } from "./forms/FormNewCashRecipt";


export function New(){

    const {popInAlert} = useAlert();

    const options = [
        //{text:'Crear nuevo documento',children:<SelectTpeNewDoc/>,icon:<i className="fa-regular fa-file"/>},
        {text:'Nueva Compra',children:<>Pendiente de formulario</>,icon:<i className="fa-solid fa-basket-shopping"/>},
        {text:'Nuevo Recibo de caja',children:<FormNewCashRecipt/>,icon:<i className="fa-solid fa-cash-register"/>},
        {text:'Registrar Pago',children:<>Pendiente de formulario</>,icon:<i className="fa-solid fa-wallet"/>},
        {text:'Registrar Cobro',children:<>Pendiente de formulario</>,icon:<i className="fa-solid fa-wallet"/>},
        {text:'Crear tercero',children:<FormNewThirdParties/>,icon:<i className="fa-regular fa-user"/>},
        {text:'Crear metodo de pago',children:<FormNewPaymentMethod/>,icon:<i className="fa-regular fa-credit-card"/>},
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