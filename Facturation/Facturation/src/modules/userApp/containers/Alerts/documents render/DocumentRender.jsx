import { useEffect, useState } from "react";
import { useAlert, useAppInfo } from "../../../../../context/context"
import { SelectOptions } from "../../../components/SelectOptions";
import './SellInvoiceRender.css'
import { SellInvoiceDesign } from "../SellInvoiceDesing";
import { PreviewDocument } from "../../Preview/PreviewDocument";
import { AccountPannel } from "./AccountPannel";
import { InvoiceVisualRepresentation } from "./InvoiceVisualRepresentation";
import { ClientOrderDesign } from "../ClientOrderDesign";
import { CashReceiptDesign } from "../CashReceiptDesign";
import { AccountingAdjustmentDesign } from "../AccountingAdjustmentDesign";
import { PurchaseInvoiceDesign } from "../PurchaseInvoiceDesign";

export function DocumentRender({ id, docType }) {

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
                    docType === 'Client Order'
                        ? <ClientOrderDesign id={id} />
                        : docType === 'Cash Recipt'
                        ? <CashReceiptDesign id={id} />
                        : docType === 'Accounting Adjustment'
                        ? <AccountingAdjustmentDesign id={id} />
                        : docType === 'Purchase Invoice'
                        ? <PurchaseInvoiceDesign id={id} noShare={true} />
                        : <SellInvoiceDesign id={id} noShare={true} />

                )}
                {selectedType == 'online' && (
                    <PreviewDocument doc_id={id}/>
                )}
            </div>
        </div>
    )
}
