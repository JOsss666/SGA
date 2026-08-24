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

        
        // Temportal accounting disabled
        const accountResult = {
            status: "skipped",
            description: "El documento no trae detalles contables."
        }
        

        /*
        const accountResult = await utilsController.accountDocument(
            documentInfo,
            { client }
        );
        */

        

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


const deleteSellInvoiceWithClient = async (client, documentId, companyId) => {
        const documentResult = await client.query(`
            SELECT id, company_id, document_type, status, "ownSerial"
            FROM "Ecosystem".documents
            WHERE id = $1 AND company_id = $2
            FOR UPDATE;
        `, [documentId, companyId]);

        if (documentResult.rowCount === 0) {
            const error = new Error("La factura de venta no existe o no pertenece a la compañía.");
            error.statusCode = 404;
            error.code = "SELL_INVOICE_NOT_FOUND";
            throw error;
        }

        const document = documentResult.rows[0];

        if (document.document_type !== "Sell Invoice") {
            const error = new Error("El documento indicado no es una factura de venta.");
            error.statusCode = 409;
            error.code = "DOCUMENT_IS_NOT_SELL_INVOICE";
            throw error;
        }

        const electronicDocumentResult = await client.query(`
            SELECT id, invoice_id, reference, number, code
            FROM "ElectronicFacturation".documents
            WHERE doc_id = $1 AND company_id = $2
            LIMIT 1
            FOR UPDATE;
        `, [documentId, companyId]);

        if (electronicDocumentResult.rowCount > 0) {
            const error = new Error(
                "No se puede eliminar una factura de venta que ya tiene una factura electrónica registrada. Debe anularse mediante el procedimiento fiscal correspondiente."
            );
            error.statusCode = 409;
            error.code = "SELL_INVOICE_ALREADY_ELECTRONIC";
            error.electronicDocument = electronicDocumentResult.rows[0];
            throw error;
        }

        // Una factura que ya recibió pagos posteriores no se puede eliminar: hacerlo
        // dejaría pagos y saldos de cartera sin su documento de origen.
        const receivedPaymentsResult = await client.query(`
            SELECT COUNT(*)::integer AS total
            FROM "Treasury".portfolio_payments
            WHERE company_id = $1
              AND document_id = $2
              AND "creationDocument_id" <> $2;
        `, [companyId, documentId]);

        if (receivedPaymentsResult.rows[0].total > 0) {
            const error = new Error(
                "No se puede eliminar la factura porque tiene pagos de cartera registrados por documentos posteriores."
            );
            error.statusCode = 409;
            error.code = "SELL_INVOICE_HAS_LATER_PAYMENTS";
            error.paymentCount = receivedPaymentsResult.rows[0].total;
            throw error;
        }

        // Bloquea las cuentas afectadas por pagos realizados desde esta factura antes
        // de calcular la reversión, evitando que otro pago cambie el saldo en paralelo.
        await client.query(`
            SELECT ar.id
            FROM "Treasury".accounts_receivable ar
            JOIN "Treasury".portfolio_payments pp
              ON pp.company_id = ar.company_id
             AND pp.document_id = ar.document_id
            WHERE pp.company_id = $1
              AND pp."creationDocument_id" = $2
            FOR UPDATE OF ar;
        `, [companyId, documentId]);

        const receivablesToReverseResult = await client.query(`
            SELECT ar.id, ar.paid_amount, SUM(pp.paid_value) AS paid_value_to_reverse
            FROM "Treasury".accounts_receivable ar
            JOIN "Treasury".portfolio_payments pp
              ON pp.company_id = ar.company_id
             AND pp.document_id = ar.document_id
            WHERE pp.company_id = $1
              AND pp."creationDocument_id" = $2
            GROUP BY ar.id, ar.paid_amount;
        `, [companyId, documentId]);

        const inconsistentReceivable = receivablesToReverseResult.rows.find(row => (
            Number(row.paid_amount) < Number(row.paid_value_to_reverse)
        ));

        if (inconsistentReceivable) {
            const error = new Error(
                "No se puede eliminar la factura porque la reversión produciría un saldo de cartera inconsistente."
            );
            error.statusCode = 409;
            error.code = "INCONSISTENT_RECEIVABLE_BALANCE";
            error.receivableId = inconsistentReceivable.id;
            throw error;
        }

        const reversedReceivablesResult = await client.query(`
            WITH payments_to_reverse AS (
                SELECT document_id, SUM(paid_value) AS paid_value
                FROM "Treasury".portfolio_payments
                WHERE company_id = $1
                  AND "creationDocument_id" = $2
                GROUP BY document_id
            )
            UPDATE "Treasury".accounts_receivable ar
            SET paid_amount = ar.paid_amount - p.paid_value
            FROM payments_to_reverse p
            WHERE ar.company_id = $1
              AND ar.document_id = p.document_id
            RETURNING ar.id;
        `, [companyId, documentId]);

        const portfolioPaymentsResult = await client.query(`
            DELETE FROM "Treasury".portfolio_payments
            WHERE company_id = $1
              AND "creationDocument_id" = $2;
        `, [companyId, documentId]);

        const transactionIdsResult = await client.query(`
            SELECT id
            FROM "Ecosystem".transactions
            WHERE company_id = $1 AND doc_id = $2
            FOR UPDATE;
        `, [companyId, documentId]);
        const transactionIds = transactionIdsResult.rows.map(row => row.id);

        let shiftSettlementsDeleted = 0;
        let transactionDetailsDeleted = 0;

        if (transactionIds.length > 0) {
            const shiftSettlementsResult = await client.query(`
                DELETE FROM "Facturation".shift_settlement_details ssd
                USING "Ecosystem".transaction_detail td
                WHERE ssd."transactionDetail_id" = td.id
                  AND td.transaction_id = ANY($1::bigint[]);
            `, [transactionIds]);
            shiftSettlementsDeleted = shiftSettlementsResult.rowCount;

            const transactionDetailsResult = await client.query(`
                DELETE FROM "Ecosystem".transaction_detail
                WHERE transaction_id = ANY($1::bigint[]);
            `, [transactionIds]);
            transactionDetailsDeleted = transactionDetailsResult.rowCount;
        }

        const transactionsResult = await client.query(`
            DELETE FROM "Ecosystem".transactions
            WHERE company_id = $1 AND doc_id = $2;
        `, [companyId, documentId]);

        const servicesResult = await client.query(`
            DELETE FROM "Inventory".services_movement
            WHERE company_id = $1 AND doc_id = $2;
        `, [companyId, documentId]);

        const documentInstancesResult = await client.query(`
            DELETE FROM "Ecosystem".docs_instances
            WHERE doc_id = $1;
        `, [documentId]);

        const receivablesResult = await client.query(`
            DELETE FROM "Treasury".accounts_receivable
            WHERE company_id = $1 AND document_id = $2;
        `, [companyId, documentId]);

        const payablesResult = await client.query(`
            DELETE FROM "Treasury".accounts_payable
            WHERE company_id = $1 AND document_id = $2;
        `, [companyId, documentId]);

        const documentGroupsResult = await client.query(`
            DELETE FROM "Ecosystem".documents_group
            WHERE doc_id = $1 OR main_doc_id = $1;
        `, [documentId]);

        const processDetailsResult = await client.query(`
            DELETE FROM "Ecosystem".process_details
            WHERE document_id = $1;
        `, [documentId]);

        const integrationRequestsResult = await client.query(`
            DELETE FROM "Integration".client_order_requests
            WHERE company_id = $1 AND document_id = $2;
        `, [companyId, documentId]);

        const deletedDocumentResult = await client.query(`
            DELETE FROM "Ecosystem".documents
            WHERE id = $1 AND company_id = $2
            RETURNING id, "ownSerial";
        `, [documentId, companyId]);

        if (deletedDocumentResult.rowCount !== 1) {
            throw new Error("No se pudo eliminar la factura de venta.");
        }

        return {
            document: deletedDocumentResult.rows[0],
            status:'OK',
            deleted: {
                portfolioPayments: portfolioPaymentsResult.rowCount,
                reversedReceivables: reversedReceivablesResult.rowCount,
                shiftSettlementDetails: shiftSettlementsDeleted,
                transactionDetails: transactionDetailsDeleted,
                transactions: transactionsResult.rowCount,
                serviceMovements: servicesResult.rowCount,
                documentInstances: documentInstancesResult.rowCount,
                accountsReceivable: receivablesResult.rowCount,
                accountsPayable: payablesResult.rowCount,
                documentGroups: documentGroupsResult.rowCount,
                processDetails: processDetailsResult.rowCount,
                integrationRequests: integrationRequestsResult.rowCount
            }
        };
};

sellInvoiceService.delete = async (info = {}) => {
    const receivedIds = info.document_ids
        ?? info.doc_ids
        ?? info.ids
        ?? info.document_id
        ?? info.doc_id
        ?? info.id;
    const companyId = Number(info.company_id);
    const rawDocumentIds = Array.isArray(receivedIds) ? receivedIds : [receivedIds];
    const documentIds = [...new Set(rawDocumentIds.map(id => Number(id)))];

    if (
        documentIds.length === 0
        || documentIds.some(id => !Number.isInteger(id) || id <= 0)
    ) {
        const error = new Error("Debe enviar un ID de documento válido o un arreglo de IDs válidos.");
        error.statusCode = 400;
        error.code = "INVALID_DOCUMENT_ID";
        throw error;
    }

    if (!Number.isInteger(companyId) || companyId <= 0) {
        const error = new Error("El ID de la compañía es obligatorio y debe ser válido.");
        error.statusCode = 400;
        error.code = "INVALID_COMPANY_ID";
        throw error;
    }

    const results = await utilsController.withTransaction(async (client) => {
        const deletedDocuments = [];

        // Se eliminan en orden estable para reducir el riesgo de deadlocks cuando dos
        // solicitudes intentan borrar lotes que comparten documentos relacionados.
        for (const documentId of [...documentIds].sort((a, b) => a - b)) {
            deletedDocuments.push(
                await deleteSellInvoiceWithClient(client, documentId, companyId)
            );
        }

        return deletedDocuments;
    });

    const refreshPortfolioResult = await utilsController.refreshDocumentViews();

    if (!Array.isArray(receivedIds)) {
        const [result] = results;

        return {
            status: "OK",
            message: `Factura de venta #${result.document.ownSerial} eliminada correctamente.`,
            id: result.document.id,
            ownSerial: result.document.ownSerial,
            deleted: result.deleted,
            refreshPortfolio: refreshPortfolioResult
        };
    }

    return {
        status: "OK",
        message: `${results.length} facturas de venta eliminadas correctamente.`,
        ids: results.map(result => result.document.id),
        documents: results.map(result => ({
            id: result.document.id,
            ownSerial: result.document.ownSerial,
            deleted: result.deleted
        })),
        refreshPortfolio: refreshPortfolioResult
    };
};

sellInvoiceService.suspend = async(info)=>{};

export default sellInvoiceService;
