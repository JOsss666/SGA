

import express from 'express';
import controller from '../controllers/index.controller.js';
import processController from '../controllers/processController.js';
import multer from "multer";
import path from "path";
import contabiltyController from '../controllers/contabilityController.js';
import inventoryController from '../controllers/inventoryController.js'
import { uploadMiddleware } from '../uploadMiddleWare.js';
import facturationController from '../controllers/facturationController.js';
// Custom controllers import
    import zjController from '../controllers/custom-controllers/zjController.js';
    import nexo360Controller from '../controllers/custom-controllers/nexo360Controller.js';
    import paramDocInternalController from '../controllers/custom-controllers/paramDocInternalController.js';
import assetsController from '../controllers/assetsController.js';
import AnalyticController from '../controllers/AnalyticsController.js';
import electronicFacturationController from '../controllers/electronicFacturationController.js';
import electronicProviderCredentialsController from '../controllers/electronicProviderCredentialsController.js';
import treasuryController from '../controllers/TreasuryController.js';
import geographyController from '../controllers/geographyController.js';
import companyConfigurationController from '../controllers/companyConfigurationController.js';
import searchController from '../controllers/searchController.js';
import companyTimeZoneController from '../controllers/companyTimeZoneController.js';
import integrationRouter from './integration.routes.js';
import { systemAIRouter } from '../systemAI/index.js';
import sessionRouter from './session.routes.js';
import sessionAuthController from '../controllers/sessionAuthController.js';
import { authenticateSession } from '../middleware/authenticateSession.js';
import { sessionErrorHandler } from '../middleware/sessionErrorHandler.js';
import { requireTrustedOrigin } from '../middleware/requireTrustedOrigin.js';
import { requireCompanyAccess } from '../middleware/requireCompanyAccess.js';
import supplierDelegationController from '../controllers/supplierDelegationController.js';
import externalAccesThirdPartyController from '../controllers/externalThirdPartyAccesController.js';

const router = express.Router();

// temporal folder for chunks
const CHUNKS_DIR = path.join(process.cwd(), "chunks");
const upload = multer({ dest: CHUNKS_DIR });

// API máquina-a-máquina para integraciones empresariales.
router.use('/api/integrations/v1', integrationRouter);
router.use('/api/system-ai/v1', systemAIRouter);
router.use('/api/auth/v1', sessionRouter);


// SGA General

    // Special actions
    router.post("/uploadFiles", uploadMiddleware ,controller.uploadFile);

    router.post("/upload-chunk", upload.single("chunk"), controller.uploadChunk);

    router.post("/merge-chunks", controller.mergeChunks);

    router.post('/processAiRequest',controller.processAiRequest);
    router.post('/processCustomAiRequest', controller.processCustomAiRequest);

    router.post('/getAttachedFiles',controller.getAttachedFiles);

    router.post('/logIn', express.json({ limit: '16kb', strict: true }), sessionAuthController.login, sessionErrorHandler);

    router.post('/logOut', express.json({ limit: '16kb', strict: true }), requireTrustedOrigin, sessionAuthController.logout, sessionErrorHandler);

    router.post('/signUp',controller.signUp);

    router.post('/deleteUser',controller.deleteUser);

    router.post('/getRoles',controller.getRoles);

    router.post('/getDocuments',controller.getDocuments);

router.post('/getCompanyInfo',controller.getCompanyInfo);

router.post('/companies/clone-configuration', express.json(), companyConfigurationController.clone);
router.post('/companies/time-zone', express.json(), companyTimeZoneController.get);
router.post('/companies/time-zone/update', express.json(), companyTimeZoneController.update);

router.post('/search', express.json(), searchController.search);

router.post('/getUserInfo',controller.getUserInfo);

router.post('/getUsers',controller.getUsers);

router.post('/getSuppliers',controller.getThirdParties);

router.post('/getThirdParties',controller.getThirdParties);

router.post('/updateThirdPartyGeneralInfo',controller.updateThirdPartyGeneralInfo);

router.post('/updateThirdPartyComercialInfo',controller.updateThirdPartyComercialInfo);

router.post('/updateThirdPartyTaxInfo',controller.updateThirdPartyTaxInfo);

router.post('/createThirdParty',controller.createThirdParty);

router.post('/blockThirdParty',controller.blockThirdParty);

router.post('/unblockThirdParty',controller.unblockThirdParty);

// Etapa 5: el controller deleteThirdParty existía sin ruta (código muerto); se expone ya con auditoría.
router.post('/deleteThirdParty',controller.deleteThirdParty);

router.post('/getThirdPartyDetails',controller.getThirdPartyDetails);

router.get('/geography/countries', geographyController.getCountries);
router.get('/geography/departments', geographyController.getDepartments);
router.get('/geography/municipalities', geographyController.getMunicipalities);
router.get('/geography/localities', geographyController.getLocalities);

router.post('/getStores',controller.getStores);

router.post('/getCellars',inventoryController.getCellars);

router.post('/createAccountPlan',controller.createAccountsPlan);

router.post('/createCostCenter',controller.createCostCenter);

router.post('/getCostCenters',controller.getCostCenters);

router.post('/createStore',controller.createStore);

router.post('/deleteStore',controller.deleteStore);

router.post('/createBussines',controller.createBussines);

router.post('/getBussines',controller.getBussines);

router.post('/getAccountsPlan',controller.getAccountsPlan);

router.post('/getAccounts',controller.getAccounts);

router.post('/insertNewAccount',controller.insertNewAccount);

router.post('/createTax',controller.createTax);

router.post('/deleteTax',controller.deleteTax);

router.post('/getTaxes',controller.getTaxes);

router.get('/taxes/withholdings',controller.getWithholdings);

router.post('/getConceptTaxes',controller.getConceptTaxes);

router.post('/createTaxCategory',controller.createTaxCategory);

router.post('/getTaxCategories',controller.getTaxCategory);

router.post('/getFiscalTaxTypes',controller.getFiscalTaxTypes);

router.post('/createConcept',controller.createConcept);

router.post('/deleteConcept',controller.deleteConcept);

router.post('/updateConcept/:id',controller.updateConcept);

router.post('/getConcepts',controller.getConcepts);

router.post('/getDocParams',controller.getDocParams);

router.post('/getParamDocsOptions',controller.getParamDocsOptions);

// Registro interno de documentos parametrizados desde la app (Facturation): identidad
// por company_id + user_id; dispara el flujo custom del `destiny` (p. ej. nexo360).
router.post('/registerParamDoc', express.json({ limit: '2mb', strict: true }), paramDocInternalController.registerParamDoc);

router.post('/createPaymentMethod',controller.createPaymentMethod);

router.post('/getPaymentMethods',controller.getPaymentMethods);

router.post('/createTransaction',controller.createTransaction);

router.post('/updateTransactionState',controller.updateTransactionState);

router.post('/getTransactions',controller.getTransactions);

router.post('/getTransactionDetails',controller.getTransactionDetails);

router.post('/getTransactionsData', controller.getTransactionsData);

router.post('/getDocAnalyticDocNumber', controller.getDocAnalyticDocNumber);

router.post('/getDocAnalyticDocNumberTable', controller.getDocAnalyticDocNumberTable);

// SGA - Inventory

router.post('/inventory/getCategories',inventoryController.getCategories);

router.post('/inventory/createCategory',inventoryController.createCatetory);

router.post('/inventory/getSubCategories',inventoryController.getSubCategories);

router.post('/inventory/createSubCategory',inventoryController.createCatetory);

router.post(
    '/inventory/getProducts',
    express.json({ limit: '32kb', strict: true }),
    inventoryController.getProducts
);

router.post(
    '/inventory/getPS',
    express.json({ limit: '32kb', strict: true }),
    inventoryController.getProducts
);

router.post(`/inventory/getComercialProducts`,inventoryController.getComercialProducts);

router.post('/inventory/getPresets',inventoryController.getPresets);

router.post('/inventory/createProduct',inventoryController.createProduct);

router.post('/inventory/updateProduct',inventoryController.updateProduct);

router.post('/inventory/disableProduct',inventoryController.disableProduct);

router.post('/inventory/deleteProduct',inventoryController.deleteProduct);

router.post('/inventory/getProductTaxRelations',inventoryController.getProductTaxRelations);
router.post('/inventory/getPurchaseRelations',inventoryController.getProductPurchaseRelations);

router.post('/inventory/createThirdPartyProductTaxRelation',inventoryController.createThirdPartyProductTaxRelation);

router.post('/inventory/updateThirdPartyProductTaxRelation',inventoryController.updateThirdPartyProductTaxRelation);

router.post('/inventory/disableThirdPartyProductTaxRelation',inventoryController.disableThirdPartyProductTaxRelation);

router.post('/inventory/deleteThirdPartyProductTaxRelation',inventoryController.deleteThirdPartyProductTaxRelation);

router.post('/inventory/getThirdPartyProductTaxRelations',inventoryController.getThirdPartyProductTaxRelations);

router.post('/inventory/getPricesListItems',inventoryController.getPricesListItems);

router.post('/inventory/createCellar',inventoryController.createCellar);

router.post('/inventory/getCellars',inventoryController.getCellars);

router.post('/inventory/createPriceList',inventoryController.createPriceList);

router.post('/getAllPriceLists', inventoryController.getAllLists);

router.post('/inventory/getPricesList',inventoryController.getPricesList);

router.post('/inventory/deletePriceList',inventoryController.deletePriceList);

router.post('/inventory/updateProductList',inventoryController.updateProductList);

router.post('/inventory/getStocks',inventoryController.getStocks);

router.post('/inventory/getPriceStock',inventoryController.getPriceStock);

router.post('/inventory/newEntry',inventoryController.newEntry);

router.post('/inventory/newDeparture',inventoryController.newDeparture);

router.post('/inventory/newMovement',inventoryController.newMovement2);

router.post('/inventory/getMovements',inventoryController.getMovements);

router.post('/inventory/deleteMovement',inventoryController.deleteMovement);

router.post('/inventory/getDepartures',inventoryController.getDepartures);

router.post('/inventory/getRotation',inventoryController.getRotation);

router.post('/inventory/getKardex',inventoryController.getKardex);

router.post('/getServiceMovements',inventoryController.getServicesMovements);

router.post('/inventory/updatePricesList',inventoryController.updatePricesList);

router.post('/inventory/deleteItemPricesList',inventoryController.deleteItemPricesList)


// SGA - PROCESS

router.post('/process/getProcessInstances', processController.getProcessInstances);
router.post('/process/getProcessInstancesWithReferences', processController.getProcessInstancesWithReferences);
router.post('/process/getEvidenceOptions', express.json({ limit: '16kb', strict: true }), processController.getEvidenceOptions);
router.post('/process/registerEvidence', express.json({ limit: '256kb', strict: true }), processController.registerEvidence);

// La compañía y el usuario se identifican por el body (company_id/user_id), igual que el
// resto de la app. No se exige cookie de sesión porque no viaja cross-site en Safari.
router.post('/process/orders-delegation/list', express.json({limit:'256kb'}),
    requireTrustedOrigin, supplierDelegationController.list, sessionErrorHandler);
router.post('/process/orders-delegation/register', express.json({limit:'2mb'}),
    requireTrustedOrigin, supplierDelegationController.register, sessionErrorHandler);
router.post('/process/orders-delegation/update', express.json({limit:'2mb'}),
    requireTrustedOrigin, supplierDelegationController.update, sessionErrorHandler);

router.post('/process/getProcessState', processController.getProcessState);

router.post('/process/getAviableProceses',processController.getAviableProcess);

router.post('/process/createProcessInstace',processController.createProcessInstace);

router.post('/process/updateProcessInstanceStatus',processController.updateProcessInstanceStatus);

router.post('/process/nextProcessStep',processController.nextProcessStep);

router.post('/process/createOP', processController.createOp);

router.post('/process/getOp', processController.getOp);

router.post('/process/getDocuments', processController.getDocuments);

router.post('/process/getAttachedDocuments', processController.getAttachedDocuments);

router.post('/process/getOpAttached',processController.getOpAttached);

router.post('/process/createOC',processController.createOc);

router.post('/process/createDC',processController.createDC);

router.post('/process/createFV',processController.createFV);

router.post('/process/searchDocument',processController.searchDocument);

router.post('/process/getEficincyUsers',processController.getEficincyUsers);

router.post('/process/getInstanceHistorial',processController.getInstanceHistorial);


// SGA contability

router.post('/contability/contabiltyController', contabiltyController.getBalance);

router.post('/contability/updateContableAccount/:id', contabiltyController.updateContableAccount);

router.post('/contability/deleteContableAccount/:id',contabiltyController.deleteContableAccount)


// SGA treasury

router.post('/treasury/getTreasury',controller.getAccounts); //PENDIENTE IMPLEMENTAR 

router.post('/treasury/getThirdPartyPortfolio',treasuryController.getThirdPartyPortfolio); //PENDIENTE IMPLEMENTAR 

// SGA Facturation

router.post('/facturation/newCashRecipt',facturationController.newCashRecipt);

router.post('/facturation/newSellInvoice',facturationController.newSellInvoice);

router.post('/facturation/deleteSellInvoice',facturationController.deleteInvoice);

router.post('/facturation/newPurchase',facturationController.newPurchase);

router.post('/facturation/newNote',facturationController.newNote);

router.post('/facturation/newClientOrder',facturationController.newClientOrder);

router.post('/facturation/getCashBoxes',facturationController.getCashBoxes);

router.post('/facturation/getRegisterShift',facturationController.getRegisterShift);

router.post('/facturation/openCashRegister',facturationController.openCashRegister);

router.post('/facturation/closeCashRegister',facturationController.closeCashRegister);

router.post('/facturation/getCashRegisterReport',facturationController.getCashRegisterReport);

router.post('/facturation/getTransactionsOfCashRecord',facturationController.getTransactionsOfCashRecord);

router.post('/facturation/getSettlementReportByPeriod',facturationController.getSettlementReportByPeriod);

router.post('/facturation/getBriefcaseBills',facturationController.getBriefcaseBills);

router.post('/facturation/updatePaymentDocument',facturationController.updatePaymentDocument);

// Assets Controller

router.post('/assets/getAssets',assetsController.getAssets);

// Analytics Controller

router.post('/analytics/getProcessInstanceUsersAvtivity',AnalyticController.getProcessInstanceUsersAvtivity);

router.post('/analytics/getProcessStepsCycleTime',AnalyticController.getProcessStepsCycleTime);

// CUSTOM MODULES !!!

    // Z&J S.A.S 901167852
    
    router.post('/zj852/getlastClickControl',zjController.getlastClickControl);

    router.post('/zj852/getHistorialClicksControl',zjController.getHistorialClicksControl);

    router.post('/zj852/getAuditClicksReport',zjController.getAuditClicksReport);

    router.post('/zj852/openClickControl',zjController.openClickControl);

    router.post('/zj852/registerServiceMachine',zjController.registerServiceMachine);

    router.post('/zj852/getServiceMovements',zjController.getServiceMovements);

    // NEXO 360: informe restringido a la compañía 7 (identificada por X-SGA-Company-Id/company_id),
    // siguiendo el mismo modelo que el resto de endpoints de la app. Se conserva el filtro por
    // origen confiable; no se exige cookie de sesión porque no viaja cross-site en Safari.
    router.post('/nexo360/getProcessAdministrationReport', express.json({ limit: '16kb' }),
        requireTrustedOrigin,
        nexo360Controller.getProcessAdministrationReport, sessionErrorHandler);



    // EXTERNAL SERVICES

    //

    router.post(
        '/externalAccess/create',
        express.json({ limit: '16kb', strict: true }),
        requireTrustedOrigin,
        authenticateSession,
        requireCompanyAccess,
        externalAccesThirdPartyController.create,
        sessionErrorHandler
    );
    router.post('/externalAccess/logIn', externalAccesThirdPartyController.logIn);
    router.post('/externalAccess/getCompanyInfo', externalAccesThirdPartyController.getCompanyInfo);
    router.post('/externalAccess/getUserInfo', externalAccesThirdPartyController.getUserInfo);
    router.post('/externalAccess/logOut', externalAccesThirdPartyController.logOut);
    // Delegación a proveedores desde el portal externo: autenticada por
    // company_key + access_key (el tercero no tiene cookie de sesión), actuando
    // con la identidad/rol del responsable interno del acceso.
    router.post('/externalAccess/orders-delegation/list', express.json({ limit: '256kb' }), externalAccesThirdPartyController.delegationList);
    router.post('/externalAccess/orders-delegation/register', express.json({ limit: '2mb' }), externalAccesThirdPartyController.delegationRegister);
    router.post('/externalAccess/orders-delegation/update', express.json({ limit: '2mb' }), externalAccesThirdPartyController.delegationUpdate);
    router.post('/externalAccess/getParamDocs',externalAccesThirdPartyController.getParamsDocs);
    router.post('/externalAccess/getParamDocTemplate',externalAccesThirdPartyController.getParamDocTemplate);
    router.post('/externalAccess/registerParamDoc', express.json({ limit: '2mb', strict: true }), externalAccesThirdPartyController.registerParamDoc);

    // ELECTRONIC FACTURATION
    
    router.get('/electronicFacturation/getNumberingRanges', electronicFacturationController.getNumberingRanges);

    router.post('/electronicFacturation/setNumberingRangeCurrent', electronicFacturationController.setNumberingRangeCurrent);

    router.post('/electronicFacturation/deletePendingBill', electronicFacturationController.deletePendingBill);

    router.post(
        '/electronicFacturation/deleteCreditNote',
        express.json({ limit: '16kb', strict: true }),
        requireTrustedOrigin,
        authenticateSession,
        requireCompanyAccess,
        electronicFacturationController.deleteCreditNote,
        sessionErrorHandler
    );

    router.get('/electronicFacturation/showActualToken', electronicFacturationController.showActualToken);

    router.post('/electronicFacturation/providerCredentials', electronicProviderCredentialsController.upsert);

    router.post('/electronicFacturation/getProviderCredentials', electronicProviderCredentialsController.list);

    router.post('/electronicFacturation/providerCredentials/testConnection', electronicProviderCredentialsController.testConnection);

    router.post('/electronicFacturation/providerCredentials/:id/disable', electronicProviderCredentialsController.disable);

    router.post('/electronicFacturation/invoice', electronicFacturationController.newInvoice);

    router.get('/electronicFacturation/taxes', electronicFacturationController.getTaxes);

    router.post('/electronicFacturation/getDocuments',electronicFacturationController.getDocuments);

    router.post('/electronicFacturation/note',electronicFacturationController.newNote);

    router.post('/electronicFacturation/downloadBill',electronicFacturationController.downloadBill);

    router.post('/electronicFacturation/downloadBillXML',electronicFacturationController.downloadBillXML);

    router.get('/electronicFacturation/getMunicipalities',electronicFacturationController.getMunicipalities);

    router.post('/electronicFacturation/getDocumentFullInfo',electronicFacturationController.getDocumentFullInfo);

export default router;
