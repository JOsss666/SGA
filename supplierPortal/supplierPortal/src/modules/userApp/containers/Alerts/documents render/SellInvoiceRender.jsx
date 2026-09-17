import { useEffect, useState } from "react";
import { useAlert, useAppInfo } from "../../../../../context/context"
import { SelectOptions } from "../../../components/SelectOptions";
import './SellInvoiceRender.css'
import { SellInvoiceDesign } from "../SellInvoiceDesing";
import { PreviewDocument } from "../../Preview/PreviewDocument";
import { AccountPannel } from "./AccountPannel";
import { InvoiceVisualRepresentation } from "./InvoiceVisualRepresentation";

export function SellInvoiceRender({id,data}){

    // Requierements
    const {appInfo} = useAppInfo();
    const {popInAlert,popOutAlert} = useAlert();

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const allowedTypes = [
        {text:'Representación',value:'Representación'},
        {text:'Contabilización',value:'Contabilización'},
        {text:'Imprimible', value:'Imprimible'},
        {text:'Doc en linea', value:'online'}
    ];
    const [selectedType,setSelectedType] = useState('Representación');

    // FomrInfo
    const [info,setInfo] = useState({});
    const [transactionDetails,setTransactionDetails] = useState([]);

    return(
        <div className="SellInvoiceRender">
            <div className="headerSelector">
                <h6>
                    <i className="fa-regular fa-file"/>
                    Previsualización documento
                </h6>
                <SelectOptions action={setSelectedType} title={'Vista'} defaultValue={allowedTypes[0]} options={allowedTypes} objectC={true} disabled={disabled}/>
            </div>
            <div className="spaceRender">
                {selectedType == 'Representación' && (
                    <InvoiceVisualRepresentation id={id}/>
                )}
                {selectedType == 'Contabilización' && (
                    <AccountPannel id={id} />
                )}
                {selectedType == 'Imprimible' && (
                    <SellInvoiceDesign id={id} noShare={true}/>
                )}
                {selectedType == 'online' && (
                    <PreviewDocument doc_id={id}/>
                )}
            </div>
        </div>
    )
}
