import { useAppInfo } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { SettingsGroup } from "../../components/SettingsGroup"
import './BillingSettings.css'

export function BillingSettings(){
    const {darkMode} = useAppInfo();
    const sec1 = [
        {text:'Metodos de pago',path:'cloudStorage',value:'',type:'functionality',icon:<i className="fa-regular fa-credit-card"/>},
        {text:'Información de facturación',path:'style',value:'',type:'functionality',icon:<i className="fa-solid fa-file-invoice-dollar"/>},
        {text:'Servicios',path:'style',value:'',type:'device',icon:<img src="https://cdnmain.sga360.co/static/ChatGPT_Image_26_oct_2025_16_24_57_hgpkmn.webp"/>}
    ]

    const sec2 = [
        {text:'Información de cobro',path:'softwareUpdate',value:'',type:'general',icon:<i className="fa-solid fa-chart-simple"/>},
        {text:'Historial de pagos',path:'cloudStorage',value:'',type:'general',icon:<i className="fa-regular fa-file-lines"/>}
    ]

    return(
        <div className="BillingSettings">
            <div className="mainBillingMethod">
                <img src="https://www.mastercard.co.in/content/dam/public/mastercardcom/sg/en/consumers/find-a-card/images/world-debit-card.png" />
                <div className="infoMainBllM">
                    <strong>Metodo de pago principal</strong>
                    <span>****123</span>
                </div>
            </div>
            <div className="CreditBalance">
                <div className="infoC">
                    <BoldTitle text={'Balance de crédito'}/>
                    <DescriptionSpan text={'El balance de credito de los servicios es:'}/>
                </div>
                <h3>$ 0.00</h3>
            </div>
            <SettingsGroup options={sec1}/>
            <SettingsGroup options={sec2}/>
        </div>
    )
}