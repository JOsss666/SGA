import utilsController from '../utilsController.js';
import processController from '../processController.js';
import { createNexo360Service } from '../../services/costumeServices/nexo360service.js';
import { createProcessInstance } from '../../services/processInstanceService.js';

const nexo360Controller = createNexo360Service({
    withTransaction: utilsController.withTransaction,
    advanceProcessInstance: processController.advanceProcessInstance,
    createProcessInstance,
    registerDocument: utilsController.registerDocument,
    registerPurchaseItems: utilsController.registerPurchaseItems,
    linkDocumentInstances: utilsController.linkDocumentInstances
});

// API interna: generateClientOrder(paramDoc) y transformPresets(presets, options).
export default nexo360Controller;
