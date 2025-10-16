

import express from 'express';
import controller from '../controllers/index.controller.js';
import processController from '../controllers/processController.js';
import multer from "multer";
import path from "path";
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

router.post('/getCompanyInfo',controller.getCompanyInfo);

router.post('/getUserInfo',controller.getUserInfo);

router.post('/getCategories',controller.getCategories);

router.post('/getSuppliers',controller.getSuppliers);

router.post('/getThirdParties',controller.getSuppliers);

router.post('/getStores',controller.getStores);

router.post('/getCellars',controller.getCellars);

router.post('/createAccountPlan',controller.createAccountsPlan);

router.post('/getAccountsPlan',controller.getAccountsPlan);

router.post('/insertNewAccount',controller.insertNewAccount);

router.post('/createTax',controller.createTax);

router.post('/getTaxes',controller.getTaxes);

router.post('/createConcept',controller.createConcept);

router.post('/getConcepts',controller.getConcepts);

router.post('/getPaymentMethods',controller.getPaymentMethods);

router.post('/createTransaction',controller.createTransaction);

router.post('/updateTransactionState',controller.updateTransactionState);

router.post('/getTransactions',controller.getTransactions);

router.post('/getTransactionDetails',controller.getTransactionDetails);

// SGA - Inventory

router.post('/getSubCategories',controller.getSubCategories);

router.post('/createSubCategory',controller.createSubCategory);

router.post('/getProducts',controller.getProducts);

router.post('/createProduct',controller.createProduct);

router.post('/getPricesNameList',controller.getPricesNameList);

router.post('/createStore',controller.createStore);

router.post('/createCellar',controller.createCellar);

router.post('/createPriceList',controller.createPriceList);

router.post('/getPricesList',controller.getPricesList);

router.post('/updateProductList',controller.updateProductList);

router.post('/getPriceStock',controller.getPriceStock);

router.post('/newEntry',controller.newEntry);

router.post('/newDeparture',controller.newDeparture);

router.post('/newMovement',controller.newMovement);

router.post('/getMovements',controller.getMovements);

router.post('/getDepartures',controller.getDepartures);

router.post('/getRotation',controller.getRotation);


// SGA - PROCESS

router.post('/process/createOP', processController.createOp);

router.post('/process/getOp', processController.getOp);

router.post('/process/getDocuments', processController.getDocuments);


router.post('/process/getOpAttached',processController.getOpAttached);

router.post('/process/createOC',processController.createOc);

router.post('/process/createDC',processController.createDC);

router.post('/process/createFV',processController.createFV);

router.post('/process/searchDocument',processController.searchDocument);

router.post('/getTransactionsData', controller.getTransactionsData);

router.post('/getDocumentData', controller.getDocumentData);


export default router;

