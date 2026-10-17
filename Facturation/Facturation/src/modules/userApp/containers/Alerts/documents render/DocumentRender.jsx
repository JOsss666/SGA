import { useState } from "react";
import { SelectOptions } from "../../../components/SelectOptions";
import "./SellInvoiceRender.css";
import { SellInvoiceDesign } from "../SellInvoiceDesing";
import { PreviewDocument } from "../../Preview/PreviewDocument";
import { AccountPannel } from "./AccountPannel";
import { InvoiceVisualRepresentation } from "./InvoiceVisualRepresentation";
import { ClientOrderDesign } from "../ClientOrderDesign";
import { CashReceiptDesign } from "../CashReceiptDesign";
import { ClientOrderRepresentation } from "./ClientOrderRepresentation";
import { CashReceiptRepresentation } from "./CashReceiptRepresentation";
import { AccountingAdjustmentDesign } from "../AccountingAdjustmentDesign";
import { PurchaseInvoiceDesign } from "../PurchaseInvoiceDesign";

export function DocumentRender({ id, docType }) {
    const [disabled] = useState(false);
    const [selectedType, setSelectedType] = useState("Representación");

    const renderDocumentDesign = () => {
        switch (docType) {
            case "Client Order":
                return <ClientOrderDesign id={id} />;
            case "Cash Recipt":
                return <CashReceiptDesign id={id} />;
            case "Accounting Adjustment":
                return <AccountingAdjustmentDesign id={id} />;
            case "Purchase Invoice":
                return <PurchaseInvoiceDesign id={id} noShare={true} />;
            default:
                return <SellInvoiceDesign id={id} noShare={true} />;
        }
    };

    const renderDocumentRepresentation = () => {
        switch (docType) {
            case "Sell Invoice":
                return <InvoiceVisualRepresentation id={id} />;
            case "Client Order":
                return <ClientOrderRepresentation id={id} />;
            case "Cash Recipt":
                return <CashReceiptRepresentation id={id} />;
            default:
                return renderDocumentDesign();
        }
    };

    const allowedTypes = [
        { text: "Representación", value: "Representación" },
        { text: "Contabilización", value: "Contabilización" },
        { text: "Imprimible", value: "Imprimible" },
        { text: "Doc en linea", value: "online" },
    ];

    return (
        <div className="SellInvoiceRender">
            <div className="headerSelector">
                <h6>
                    <i className="fa-regular fa-file" />
                    Previsualización documento
                </h6>

                <SelectOptions
                    action={setSelectedType}
                    title={"Vista"}
                    defaultValue={allowedTypes[0]}
                    options={allowedTypes}
                    objectC={true}
                    disabled={disabled}
                />
            </div>

            <div className="spaceRender">
                {selectedType === "Representación" &&
                    renderDocumentRepresentation()}

                {selectedType === "Contabilización" && (
                    <AccountPannel id={id} />
                )}

                {selectedType === "Imprimible" && renderDocumentDesign()}

                {selectedType === "online" && (
                    <PreviewDocument doc_id={id} />
                )}
            </div>
        </div>
    );
}