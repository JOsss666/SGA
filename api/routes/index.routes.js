

import express from 'express';
import controller from '../controllers/index.controller.js';
import processController from '../controllers/processController.js';
import multer from "multer";
import path from "path";
import contabiltyController from '../controllers/contabilityController.js';
import inventoryController from '../controllers/inventoryController.js'
const router = express.Router();

// temporal folder for chunks
const CHUNKS_DIR = path.join(process.cwd(), "chunks");
const upload = multer({ dest: CHUNKS_DIR });


// SGA General

    // Special actions
    
    router.post("/upload-chunk", upload.single("chunk"), controller.uploadChunk);

    router.post("/merge-chunks", controller.mergeChunks);

    router.post('/processAiRequest',controller.processAiRequest);

    router.post('/logIn',controller.logIn);

    router.post('/logOut',controller.logOut);

    router.post('/signUp',controller.signUp);

    router.post('/deleteUser',controller.deleteUser);

router.post('/getCompanyInfo',controller.getCompanyInfo);

router.post('/getUserInfo',controller.getUserInfo);

router.post('/getUsers',controller.getUsers);

router.post('/getCategories',controller.getCategories);

router.post('/getSuppliers',controller.getThirdParties);

router.post('/getThirdParties',controller.getThirdParties);

router.post('/createThirdParty',controller.createThirdParty);

router.post('/getThirdPartyDetails',controller.getThirdPartyDetails);

router.post('/getStores',inventoryController.getStores);

router.post('/getCellars',inventoryController.getCellars);

router.post('/createAccountPlan',controller.createAccountsPlan);

router.post('/getAccountsPlan',controller.getAccountsPlan);

router.post('/insertNewAccount',controller.insertNewAccount);

router.post('/createTax',controller.createTax);

router.post('/deleteTax',controller.deleteTax);

router.post('/getTaxes',controller.getTaxes);

router.post('/createConcept',controller.createConcept);

router.post('/deleteConcept',controller.deleteConcept);

router.post('/getConcepts',controller.getConcepts);

router.post('/getPaymentMethods',controller.getPaymentMethods);

router.post('/createTransaction',controller.createTransaction);

router.post('/updateTransactionState',controller.updateTransactionState);

router.post('/getTransactions',controller.getTransactions);

router.post('/getTransactionDetails',controller.getTransactionDetails);

router.post('/getTransactionsData', controller.getTransactionsData);

router.post('/getDocAnalyticDocNumber', controller.getDocAnalyticDocNumber);

router.post('/getDocAnalyticDocNumberTable', controller.getDocAnalyticDocNumberTable);

// SGA - Inventory

router.post('/inventory/getSubCategories',inventoryController.getSubCategories);

router.post('/inventory/createSubCategory',inventoryController.createSubCategory);

router.post('/inventory/getProducts',inventoryController.getProducts);

router.post('/inventory/createProduct',inventoryController.createProduct);

router.post('/inventory/getPricesNameList',inventoryController.getPricesNameList);

router.post('/inventory/createStore',inventoryController.createStore);

router.post('/inventory/getStores',inventoryController.getStores);

router.post('/inventory/createCellar',inventoryController.createCellar);

router.post('/inventory/getCellars',inventoryController.getCellars);

router.post('/inventory/createPriceList',inventoryController.createPriceList);

router.post('/inventory/getPricesList',inventoryController.getPricesList);

router.post('/inventory/deletePriceList',inventoryController.deletePriceList);

router.post('/inventory/updateProductList',inventoryController.updateProductList);

router.post('/inventory/getPriceStock',inventoryController.getPriceStock);

router.post('/inventory/newEntry',inventoryController.newEntry);

router.post('/inventory/newDeparture',inventoryController.newDeparture);

router.post('/inventory/newMovement',inventoryController.newMovement);

router.post('/inventory/getMovements',inventoryController.getMovements);

router.post('/inventory/deleteMovement',inventoryController.deleteMovement);

router.post('/inventory/getDepartures',inventoryController.getDepartures);

router.post('/inventory/getRotation',inventoryController.getRotation);


// SGA - PROCESS

router.post('/process/createOP', processController.createOp);

router.post('/process/getOp', processController.getOp);

router.post('/process/getDocuments', processController.getDocuments);


router.post('/process/getOpAttached',processController.getOpAttached);

router.post('/process/createOC',processController.createOc);

router.post('/process/createDC',processController.createDC);

router.post('/process/createFV',processController.createFV);

router.post('/process/searchDocument',processController.searchDocument);


// SGA contability

router.post('/contability/contabiltyController', contabiltyController.getBalance);

export default router;

