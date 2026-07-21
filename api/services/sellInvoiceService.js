import utilsController from "../controllers/utilsController.js";

const sellInvoiceService = {};

sellInvoiceService.register = async (info) => {
    const steps = [];
    console.log('Información recibida para la factura de venta: ',info)
    const { document, portfolioResult, accountResult, processResult } = await utilsController.withTransaction(async (client) => {
        const document = await utilsController.registerDocument(info, {
            includeProcessFields: false,
            client
        });

        console.log('Fase 1 Documento creado', document)

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

        console.log('Fase 2 Control Cartera: ', portfolioResult)
        
        const accountResult = await utilsController.accountDocument(
            documentInfo,
            { client }
        );

        console.log('Fase 3 Contabilidad: ', portfolioResult)

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


sellInvoiceService.delete = async(info)=>{};

sellInvoiceService.suspend = async(info)=>{};

export default sellInvoiceService;
