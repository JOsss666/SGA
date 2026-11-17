import { buildCashReceiptInfo } from './documentBuilders.js';
import { documentResult, runDocumentService } from './documentWrite.js';

const executeCreateCashReceipt = ({ arguments: args, context }) => runDocumentService(async () => {
    const { default: cashReceiptService } = await import('../../../services/cashReceiptService.js');
    const { info, summary } = await buildCashReceiptInfo({ args, context });
    const result = await cashReceiptService.register(info);
    return documentResult(result, 'cash_receipt_created', summary);
});

export default executeCreateCashReceipt;
