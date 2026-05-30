import { TagIndicator } from "./TagIndicator";
import './ElectronicDocumentCard.css'
import { BoldTitle } from "./BoldTitle";
import { DescriptionSpan } from "./DescriptionSpan";
import { copyToClipBoard, moneyFormat } from "../../../utils/functions";
import { ButtonMenu } from "./ButtonMenu";
import { useNotifications } from "../../../context/context";

export function ElectronicDocumentCard({info}){

    const {addNotification} = useNotifications(); 
    
    return(
        <div className="ElectronicDocumentCard">
            <div className="headCard">
                <TagIndicator type={'indicator'} title={info.type}/>
                <h4 className="serialDocument">{info.number}</h4>
                <div className="statusDoc">
                    <TagIndicator type={info.doc_status} title={info.doc_status}/>
                </div>
            </div>
            <div className="body">
                <div className="customerInfo">
                    <h5 className="typeClient">
                        {info.thirdParty_type ?? '--'}
                        <i className="fa-solid fa-arrow-right"/>
                    </h5>
                    <BoldTitle text={info.thirdParty_names}/>
                </div>
                <span className="decription">
                    Esta es la descripción del doc
                </span>
            </div>
            <div className="options">
                <div className="totalResume">
                    <span>Valor total</span>
                    <BoldTitle text={`$ ${moneyFormat(info.doc_total?? 0)}`}/>
                </div>
                <div className="quickOptions">
                    <ButtonMenu noRotate={true} title={'Previsualizar'} children={<i className="fa-regular fa-eye"/>}/>
                    <ButtonMenu noRotate={true} title={'Copiar CUFE'} children={<i className="fa-regular fa-copy"/>} onClick={()=>{
                        copyToClipBoard(info.code)
                        addNotification({
                            type:'info',
                            title:'Copiado en el portapapeles',
                            description:`Se copio "${info.code}" en el portapapeles.`
                        })
                    }}/>
                    <ButtonMenu noRotate={true} title={'Descargar PDF'} children={<i className="fa-regular fa-file-pdf"/>}/>
                    <ButtonMenu noRotate={true} title={'Descargar XML'} children={<i className="fa-regular fa-file-code"/>}/>
                </div>
            </div>
        </div>
    )
}