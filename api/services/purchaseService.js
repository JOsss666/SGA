import utilsController from "../controllers/utilsController.js";

const purchaseService = {};

purchaseService.register = async (info) => {
    const steps = [];

    const { document, itemsResult, accountResult, processResult } = await utilsController.withTransaction(async (client) => {
        const document = await utilsController.registerDocument(info, {
            includeProcessFields: false,
            client
        });

        if (document?.id === undefined) {
            throw new Error("No se pudo crear la compra.");
        }

        const documentInfo = {
            ...info,
            doc_id: document.id,
            ownSerial: document.ownSerial
        };

        const itemsResult = await utilsController.registerPurchaseItems(
            documentInfo,
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
            itemsResult,
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
        name: "registerPurchaseItems",
        ...itemsResult
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
        message: `Compra #${document.ownSerial} creada correctamente.`,
        id: document.id,
        ownSerial: document.ownSerial,
        steps
    };
};

purchaseService.delete = async (info) => {};

purchaseService.suspend = async (info) => {};

export default purchaseService;
