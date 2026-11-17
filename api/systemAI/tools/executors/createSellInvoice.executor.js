import { buildSellInvoiceInfo } from './documentBuilders.js';
import { documentResult, runDocumentService } from './documentWrite.js';

const executeCreateSellInvoice = ({ arguments: args, context }) => runDocumentService(async () => {
    const { default: sellInvoiceService } = await import('../../../services/sellInvoiceService.js');
    const { info, summary } = await buildSellInvoiceInfo({ args, context });
    const result = await sellInvoiceService.register(info);
    return documentResult(result, 'sell_invoice_created', summary);
});

export default executeCreateSellInvoice;
