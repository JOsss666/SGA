import utilsController from "../controllers/utilsController.js";

const cashReceiptService = {};

cashReceiptService.register = async (info) => {
    const steps = [];

    const { document, portfolioResult, accountResult, processResult } = await utilsController.withTransaction(async (client) => {
        const document = await utilsController.registerDocument(info, {
            includeProcessFields: false,
            client
        });

        if (document?.id === undefined) {
            throw new Error("No se pudo crear el recibo de caja.");
        }

        const documentInfo = {
            ...info,
            doc_id: document.id,
            ownSerial: document.ownSerial
        };

        const portfolioResult = await utilsController.applyPortfolioPayments(
            documentInfo,
            documentInfo.payedBills,
            document.id,
            { client }
        );

        const accountResult = await utilsController.accountDocument(
            documentInfo,
            { client }
        );

        const processResult = await utilsController.linkDocumentInstances(
            document.id,
            documentInfo,
            { client }
        );

        return {
            document,
            portfolioResult,
            accountResult,
            processResult
        };
    });

    steps.push({
        name: "registerDocument",
        status: "OK",
        id: document.id,
        ownSerial: document.ownSerial
    });

    steps.push({
        name: "applyPortfolioPayments",
        ...portfolioResult
    });

    steps.push({
        name: "accountDocument",
        ...accountResult
    });

    steps.push({
        name: "linkDocumentInstances",
        ...processResult
    });

    const refreshViewsResult = await utilsController.refreshDocumentViews();
    steps.push({
        name: "refreshDocumentViews",
        ...refreshViewsResult
    });

    return {
        status: "OK",
        message: `Recibo de caja #${document.ownSerial} creado correctamente.`,
        id: document.id,
        ownSerial: document.ownSerial,
        steps
    };
};

cashReceiptService.delete = async(info)=>{};

cashReceiptService.suspend = async(info)=>{};

export default cashReceiptService;
