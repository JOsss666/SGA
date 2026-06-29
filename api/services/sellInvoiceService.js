import utilsController from "../controllers/utilsController.js";

const sellInvoiceService = {};

sellInvoiceService.register = async (info) => {
    const steps = [];

    const { document, portfolioResult, accountResult, processResult } = await utilsController.withTransaction(async (client) => {
        const document = await utilsController.registerDocument(info, {
            includeProcessFields: false,
            client
        });

        if (document?.id === undefined) {
            throw new Error("No se pudo crear la factura de venta.");
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

    if (document?.id === undefined) {
        return {
            status: "Error",
            message: "No se pudo crear la factura de venta.",
            document,
            steps
        };
    }

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

    const refreshPortfolioResult = await utilsController.refreshDocumentViews();
    steps.push({
        name: "refreshDocumentViews",
        ...refreshPortfolioResult
    });

    return {
        status: "OK",
        message: `Factura de venta #${document.ownSerial} creada correctamente.`,
        id: document.id,
        ownSerial: document.ownSerial,
        steps
    };
};

export default sellInvoiceService;
