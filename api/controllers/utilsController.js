import { useDataBase, withTransaction } from "../app.js";
import processController from "./processController.js";

const utilsController = {};

utilsController.readJsonBody = (req) => new Promise((resolve, reject) => {
    let data = "";

    req.on("data", chunk => {
        data += chunk;
    });

    req.on("end", () => {
        try {
            resolve(data ? JSON.parse(data) : {});
        } catch (err) {
            reject(err);
        }
    });

    req.on("error", reject);
});

utilsController.normalizeOptionalId = (value) => (
    value !== "" && value !== undefined && value !== null ? value : undefined
);

utilsController.withTransaction = withTransaction;

utilsController.normalizeProcessInstances = (info) => {
    const instances = Array.isArray(info.instances) && info.instances.length > 0
        ? info.instances
        : info.instance_id;

    if (!Array.isArray(instances)) {
        const instanceId = utilsController.normalizeOptionalId(instances);

        return instanceId !== undefined
            ? [{ instance_id: instanceId, step_id: info.step_id }]
            : [];
    }

    return instances
        .map(instance => {
            if (typeof instance === "object" && instance !== null) {
                return {
                    ...instance,
                    instance_id: instance.instance_id ?? instance.id
                };
            }

            return {
                instance_id: instance,
                step_id: info.step_id
            };
        })
        .filter(instance => utilsController.normalizeOptionalId(instance.instance_id) !== undefined);
};

utilsController.registerDocument = async (info, options = {}) => {
    const processInstances = utilsController.normalizeProcessInstances(info);
    const primaryProcessInstance = processInstances[0];
    const instanceId = options.includeProcessFields
        ? utilsController.normalizeOptionalId(primaryProcessInstance?.instance_id)
        : undefined;

    const stepId = options.includeProcessFields
        ? utilsController.normalizeOptionalId(primaryProcessInstance?.step_id ?? info.step_id)
        : undefined;

    const docCreation = `
        INSERT INTO "Ecosystem".documents(
            company_id,
            store_id,
            "thirdParty_id",
            document_type,
            status,
            "subTotal",
            total,
            created_by,
            description,
            attached,
            instance_id,
            step_instance)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id, "ownSerial";
    `;

    const values = [
        info.company_id,
        info.store_id,
        info.thirdParty_id,
        info.doc_type ?? info.document_type ?? info.type,
        info.status,
        info.subTotal,
        info.total,
        info.created_by,
        info.description,
        JSON.stringify(info.attached),
        instanceId,
        stepId
    ];

    if (options.client) {
        const result = await options.client.query(docCreation, values);
        return result.rows[0];
    }

    return await useDataBase(docCreation, values, 3);
};

utilsController.linkDocumentInstances = async (docId, infoOrInstances, options = {}) => {
    const instances = Array.isArray(infoOrInstances)
        ? utilsController.normalizeProcessInstances({ instances: infoOrInstances })
        : utilsController.normalizeProcessInstances(infoOrInstances ?? {});

    if (docId === undefined || docId === null || instances.length === 0) {
        return {
            status: "skipped",
            description: "No hay instancias de proceso para relacionar."
        };
    }

    if (options.client) {
        const values = [];
        const placeholders = [];
        let counter = 1;

        instances.forEach(instance => {
            values.push(docId, instance.instance_id, instance.step_id);
            placeholders.push(`($${counter++}, $${counter++}, $${counter++})`);
        });

        const sentence = `
            INSERT INTO "Ecosystem".docs_instances (doc_id, instance_id, step_instance)
            VALUES ${placeholders.join(", ")}
            ON CONFLICT (doc_id, instance_id)
            DO UPDATE SET step_instance = EXCLUDED.step_instance;
        `;
        const result = await options.client.query(sentence, values);

        return {
            status: "OK",
            result: [true, result.rowCount],
            description: "Documento relacionado con proceso correctamente."
        };
    }

    const result = await processController.relatedoc_instances(docId, instances);
    return {
        status: result?.[0] ? "OK" : "Error",
        result,
        description: result?.[0]
            ? "Documento relacionado con proceso correctamente."
            : "No se pudo relacionar el documento con el proceso."
    };
};

utilsController.refreshThirdPartyPortfolio = async () => {
    const result = await useDataBase(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY "Ecosystem".mv_thirdparty_account_balances;',
        [],
        2
    );

    return {
        status: result?.[0] ? "OK" : "Error",
        result
    };
};

utilsController.refreshDocumentViews = async () => {
    const results = {};

    results.thirdPartyPortfolio = await utilsController.refreshThirdPartyPortfolio();
    results.shiftPaymentSummaries = await useDataBase(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY "Facturation".mv_shift_payment_summaries;',
        [],
        2
    );

    return {
        status: results.thirdPartyPortfolio.status === "OK" && results.shiftPaymentSummaries?.[0]
            ? "OK"
            : "Error",
        results
    };
};

utilsController.updateDocumentPaidAmount = async (docId, amount, options = {}) => {
    const sentence = `
        UPDATE "Ecosystem".documents
        SET paid_amount = paid_amount + $1
        WHERE id = $2;
    `;
    const values = [amount, docId];

    if (options.client) {
        const result = await options.client.query(sentence, values);
        return [true, result.rowCount];
    }

    return await useDataBase(sentence, values, 2);
};


// CONTABILITY UTILS --> TRANSACTIONS AND TRANSACTION DETAILS

    utilsController.createAccountTransactionHeader = async (info, options = {}) => {
        const sentence = `
            INSERT INTO "Ecosystem".transactions
                (
                    user_id,
                    "thirdParty_id",
                    company_id,
                    store_id,
                    concept_id,
                    doc_date,
                    doc_type,
                    doc_id,
                    "subTotal",
                    total,
                    "costCenter_id",
                    bussines_id
                )
            VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING id;
        `;
        const values = [
            info.user_id,
            info.thirdParty_id,
            info.company_id,
            info.store_id,
            info.concept_id,
            info.doc_date != undefined ? info.doc_date.replace(/\//g, "-") : undefined,
            info.doc_type,
            info.doc_id,
            info.subTotal,
            info.total,
            info.costCenter_id,
            info.bussines_id
        ];

        if (options.client) {
            const result = await options.client.query(sentence, values);
            return result.rows[0];
        }

        return await useDataBase(sentence, values, 3);
    };

    utilsController.createAccountTransactionDetail = async (info, transactionId, detail, options = {}) => {
        const sentence = `
            INSERT INTO "Ecosystem".transaction_detail(
                company_id,
                transaction_id,
                "thirdParty_id",
                account_id,
                type,
                "subTotal",
                total,
                nature,
                "paymentMethod_id",
                voucher)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id;
        `;
        const values = [
            info.company_id,
            transactionId,
            info.thirdParty_id,
            detail.account_id,
            detail.type,
            detail.subtotal,
            detail.total,
            detail.nature,
            detail.paymentMethod_id != undefined ? detail.paymentMethod_id : undefined,
            detail.voucher
        ];

        if (options.client) {
            const result = await options.client.query(sentence, values);
            return result.rows[0];
        }

        return await useDataBase(sentence, values, 3);
    };

    utilsController.shouldRegisterCashMovement = (info, detail) => {
        const cashBoxTypes = ["Cash Recipt", "Sell Invoice"];
        return cashBoxTypes.includes(info.doc_type) && detail.type === "payment";
    };

    utilsController.registerShiftSettlementDetail = async (info, detail, transactionDetailId, options = {}) => {
        const sentence = `
            INSERT INTO "Facturation".shift_settlement_details(
                company_id,
                user_id,
                "cashBox_id",
                "transactionDetail_id",
                shift_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;
        const values = [
            info.company_id,
            info.user_id,
            detail.cashBox_id,
            transactionDetailId,
            detail.shift_id
        ];

        if (options.client) {
            const result = await options.client.query(sentence, values);
            return result.rows[0];
        }

        return await useDataBase(sentence, values, 3);
    };

    utilsController.createReceivableFromTransactionDetail = async (info, detail, options = {}) => {
        const sentence = `
            INSERT INTO "Treasury".accounts_receivable(
                company_id,
                "thirdParty_id",
                document_id,
                total,
                paid_amount,
                type,
                due_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `;
        const values = [
            info.company_id,
            info.thirdParty_id,
            info.doc_id,
            detail.total,
            0,
            detail.pendingType ?? undefined,
            detail.due_date
        ];

        if (options.client) {
            const result = await options.client.query(sentence, values);
            return result.rows[0];
        }

        return await useDataBase(sentence, values, 3);
    };

    utilsController.createAccountTransactionDetails = async (info, transactionId, options = {}) => {
        const details = info.transactionDetails ?? [];
        const results = [];

        for (const detail of details) {
            const transactionDetail = await utilsController.createAccountTransactionDetail(
                info,
                transactionId,
                detail,
                options
            );

            const result = {
                status: transactionDetail?.id !== undefined ? "OK" : "Error",
                id: transactionDetail?.id,
                type: detail.type
            };

            if (utilsController.shouldRegisterCashMovement(info, detail) && transactionDetail?.id !== undefined) {
                result.cashMovement = await utilsController.registerShiftSettlementDetail(
                    info,
                    detail,
                    transactionDetail.id,
                    options
                );
            }

            if (detail.for_wallet === true && transactionDetail?.id !== undefined) {
                result.receivable = await utilsController.createReceivableFromTransactionDetail(
                    info,
                    detail,
                    options
                );
            }

            results.push(result);
        }

        return results;
    };

    utilsController.accountDocument = async (info, options = {}) => {
        if (!Array.isArray(info.transactionDetails) || info.transactionDetails.length === 0) {
            return {
                status: "skipped",
                description: "El documento no trae detalles contables."
            };
        }

        const execute = async (clientOptions) => {
            const paidAmountResult = await utilsController.updateDocumentPaidAmount(
                info.doc_id,
                info.total,
                clientOptions
            );
            const transaction = await utilsController.createAccountTransactionHeader(info, clientOptions);

            if (transaction?.id === undefined) {
                throw new Error("No se pudo crear el encabezado contable del documento.");
            }

            const details = await utilsController.createAccountTransactionDetails(
                info,
                transaction.id,
                clientOptions
            );

            return {
                status: "OK",
                transaction_id: transaction.id,
                paidAmountResult,
                details
            };
        };

        return options.client
            ? await execute(options)
            : await withTransaction(client => execute({ client }));
    };


// PORTFOLIO PAYMENTS AND CONTROL

utilsController.applyPortfolioPayments = async (info, payedBills, creationDocumentId, options = {}) => {
    if (!Array.isArray(payedBills) || payedBills.length === 0) {
        return {
            status: "skipped",
            payments: [],
            description: "El documento no trae pagos de cartera."
        };
    }

    const registerPayments = async (client) => {
        const results = [];

        for (const bill of payedBills) {
            const paymentValue = Number(bill.paid_value);

            if (!Number.isFinite(paymentValue) || paymentValue <= 0) {
                throw new Error(`Valor de pago inválido para cartera #${bill.id}.`);
            }

            const accountResult = await client.query(`
                SELECT
                    id,
                    total,
                    paid_amount,
                    document_id
                FROM "Treasury".accounts_receivable
                WHERE id = $1
                FOR UPDATE;
            `, [bill.id]);

            const account = accountResult.rows[0];
            if (!account) {
                throw new Error(`No existe la cuenta por cobrar #${bill.id}.`);
            }

            const pendingAmount = Number(account.total) - Number(account.paid_amount);
            if (paymentValue > pendingAmount) {
                throw new Error(`El pago ${paymentValue} supera el saldo pendiente ${pendingAmount} de cartera #${bill.id}.`);
            }

            const insertPayment = await client.query(`
                INSERT INTO "Treasury".portfolio_payments(
                    company_id,
                    store_id,
                    "thirdParty_id",
                    document_id,
                    instance_id,
                    paid_value,
                    "creationDocument_id")
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            `, [
                info.company_id,
                info.store_id,
                info.thirdParty_id,
                bill.document_id ?? account.document_id,
                bill.instance_id,
                paymentValue,
                creationDocumentId
            ]);

            await client.query(`
                UPDATE "Treasury".accounts_receivable
                SET paid_amount = paid_amount + $2
                WHERE id = $1;
            `, [bill.id, paymentValue]);

            results.push({
                status: "OK",
                bill_id: bill.id,
                payment_id: insertPayment.rows[0]?.id,
                paid_value: paymentValue
            });
        }

        return results;
    };

    const payments = options.client
        ? await registerPayments(options.client)
        : await withTransaction(registerPayments);

    return {
        status: "OK",
        payments,
        description: "Pagos de cartera aplicados correctamente."
    };
};

export default utilsController;
