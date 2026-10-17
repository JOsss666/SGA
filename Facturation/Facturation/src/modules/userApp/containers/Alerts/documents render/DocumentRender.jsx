import { useState } from "react";
import { SelectOptions } from "../../../components/SelectOptions";
import "./SellInvoiceRender.css";
import { SellInvoiceDesign } from "../SellInvoiceDesing";
import { PreviewDocument } from "../../Preview/PreviewDocument";
import { AccountPannel } from "./AccountPannel";
import { InvoiceVisualRepresentation } from "./InvoiceVisualRepresentation";
import { ClientOrderDesign } from "../ClientOrderDesign";
import { CashReceiptDesign } from "../CashReceiptDesign";
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
                    (docType === "Sell Invoice" ? (
                        <InvoiceVisualRepresentation id={id} />
                    ) : (
                        renderDocumentDesign()
                    ))}

                {selectedType === "Contabilización" && <AccountPannel id={id} />}

                {selectedType === "Imprimible" && renderDocumentDesign()}

                {selectedType === "online" && <PreviewDocument doc_id={id} />}
            </div>
        </div>
    );
}