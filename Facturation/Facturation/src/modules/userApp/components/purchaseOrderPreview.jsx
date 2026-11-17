import { FacturationOrderPreview } from './facturationOrderPreview';

// Representación de una orden de compra (guardada por `documentId` o simulada con `data`).
// Reutiliza el diseño de la orden de facturación con los textos del lado de compras.
export function PurchaseOrderPreview({ data, documentId }) {
    return <FacturationOrderPreview
        data={data}
        documentId={documentId}
        documentType="Purchase Order"
        variant="purchase"
    />;
}
