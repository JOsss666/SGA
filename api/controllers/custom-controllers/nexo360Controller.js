import { useDataBase } from '../../app.js';
import { createNexoOtpReportHandler } from './nexoOtpReportController.js';
import { createNexoProcessReportHandler } from './nexoProcessReportController.js';
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

nexo360Controller.getOtpProductionReport = createNexoOtpReportHandler({ useDataBase });

nexo360Controller.getProcessAdministrationReport = createNexoProcessReportHandler({ useDataBase });

// API interna: generateClientOrder(paramDoc) y transformPresets(presets, options).
export default nexo360Controller;
