import utilsController from "../controllers/utilsController.js";
import factusService from "./factusService.js";
import electronicProviderCredentialsService from "./electronicProviderCredentialsService.js";
import sessionRepository from "../repositories/sessionRepository.js";
import { companyTimeZoneSql } from "./businessTimeZoneService.js";

const sellInvoiceService = {};
const DEFAULT_FACTUS_ENVIRONMENT = 'sandbox';

const parseRoleConfig = (roleConfig) => {
    if (!roleConfig) return null;
    try {
        return typeof roleConfig === 'string' ? JSON.parse(roleConfig) : roleConfig;
    } catch {
        return null;
    }
};

const findNumberingPolicy = (obj) => {
    if (!obj || typeof obj !== 'object') return undefined;
    if (obj.electronicFacturation?.numberingRanges) return obj.electronicFacturation.numberingRanges;
    for (const key of Object.keys(obj)) {
        const found = findNumberingPolicy(obj[key]);
        if (found) return found;
    }
    return undefined;
};

sellInvoiceService.resolveElectronicEnvironment = async ({ company_id, environment } = {}) => (
    environment
    ?? await electronicProviderCredentialsService.getPreferredEnvironment({
        company_id,
        provider: 'factus'
    })
    ?? DEFAULT_FACTUS_ENVIRONMENT
);

sellInvoiceService.resolveInvoiceNumberingPolicy = async ({ company_id, user_id } = {}) => {
    const userId = parseInt(user_id);
    const companyId = parseInt(company_id);
    if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(companyId) || companyId <= 0) {
        return { allowedRangeIds: null };
    }

    const membership = await sessionRepository.findMembership(userId, companyId);
    const config = parseRoleConfig(membership?.role_config);
    const numberingRanges = config?.services?.sga?.electronicFacturation?.numberingRanges
        ?? findNumberingPolicy(config);
    const enabled = Array.isArray(numberingRanges?.enabled) ? numberingRanges.enabled : [];

    if (enabled.length > 0) return { allowedRangeIds: enabled };
    if (!numberingRanges || numberingRanges.overAll === true) return { allowedRangeIds: null };
    return { allowedRangeIds: [] };
};

const loadInvoiceForElectronicEmission = async (client, docId, companyId) => {
    const result = await client.query(`
        SELECT
            d.id, d.company_id, d.store_id, d."thirdParty_id", d.document_type,
            d.status, d."ownSerial", d.description, d.total,
            COALESCE(d.instance_id, linked_process.instance_id) AS instance_id,
            tp.indentification_number, tp.names, tp."lastNames", tp.corporative_name,
            tp.address, tp.mail, tp.phone,
            tax_info.dv, tax_info.nature AS third_party_nature,
            tax_info."identidicationType_id", tax_info."IVA_responsability",
            tax_info.municipality_id,
            COALESCE(
                ar.due_date,
                (d.created_at AT TIME ZONE (${companyTimeZoneSql('$2')}))::date
            )::date AS payment_due_date,
            COALESCE(ar.balance, 0) AS outstanding_balance,
            payment.payment_method_code
        FROM "Ecosystem".documents d
        JOIN "Ecosystem".thirdparties tp
          ON tp.id = d."thirdParty_id" AND tp.company_id = d.company_id
        LEFT JOIN "Fiscal".v_third_party_current_tax_info tax_info
          ON tax_info."thirdParty_id" = tp.id AND tax_info.company_id = tp.company_id
        LEFT JOIN LATERAL (
            SELECT di.instance_id
            FROM "Ecosystem".docs_instances di
            WHERE di.doc_id = d.id
            ORDER BY di.id DESC
            LIMIT 1
        ) linked_process ON TRUE
        LEFT JOIN LATERAL (
            SELECT MAX(receivable.due_date) AS due_date,
                   SUM(GREATEST(receivable.total - receivable.paid_amount, 0)) AS balance
            FROM "Treasury".accounts_receivable receivable
            WHERE receivable.company_id = d.company_id
              AND receivable.document_id = d.id
        ) ar ON TRUE
        LEFT JOIN LATERAL (
            SELECT pm.facturation_code AS payment_method_code
            FROM "Ecosystem".transactions tx
            JOIN "Ecosystem".transaction_detail detail
              ON detail.transaction_id = tx.id
            JOIN "Ecosystem".payment_methods pm
              ON pm.id = detail."paymentMethod_id"
            WHERE tx.company_id = d.company_id
              AND tx.doc_id = d.id
              AND detail.type = 'payment'
            ORDER BY detail.id ASC
            LIMIT 1
        ) payment ON TRUE
        WHERE d.id = $1 AND d.company_id = $2
        FOR UPDATE OF d;
    `, [docId, companyId]);

    const invoice = result.rows[0];
    if (!invoice) {
        const error = new Error('No se encontró la factura de venta en la compañía activa.');
        error.statusCode = 404;
        throw error;
    }
    if (invoice.document_type !== 'Sell Invoice') {
        const error = new Error('El documento indicado no es una factura de venta.');
        error.statusCode = 409;
        throw error;
    }
    if (!['active', 'posted'].includes(`${invoice.status}`.toLowerCase())) {
        const error = new Error('Solo se puede emitir electrónicamente una factura activa o contabilizada.');
        error.statusCode = 409;
        throw error;
    }

    return invoice;
};

const findLinkedElectronicInvoice = async (client, companyId, docId) => {
    const result = await client.query(`
        SELECT id, invoice_id, reference, "number", code, url, qr, qr_image
        FROM "ElectronicFacturation".documents
        WHERE company_id = $1 AND doc_id = $2 AND type = 'electronic invoice'
        ORDER BY id DESC
        LIMIT 1;
    `, [companyId, docId]);
    return result.rows[0] ?? null;
};

const loadAndValidateInvoiceItems = async (client, companyId, invoice, docId) => {
    let result = await client.query(`
        SELECT sm.id, sm.service_id, sm.units, sm.unit_value, sm.total, sm.description,
               ps.name AS service_name, ps.code AS service_code,
               tax.rate AS tax_rate
        FROM "Inventory".services_movement sm
        LEFT JOIN "Inventory"."products&services" ps ON ps.id = sm.service_id
        LEFT JOIN "Ecosystem".taxes tax ON tax.id = ps.tax_id
        WHERE sm.company_id = $1 AND sm.doc_id = $2
        ORDER BY sm.id ASC;
    `, [companyId, docId]);

    // Facturas del flujo anterior pueden tener las líneas guardadas en la orden asociada.
    if (result.rows.length === 0) {
        result = await client.query(`
            SELECT sm.id, sm.service_id, sm.units, sm.unit_value, sm.total, sm.description,
                   ps.name AS service_name, ps.code AS service_code,
                   tax.rate AS tax_rate
            FROM "Ecosystem".documents source_document
            JOIN "Inventory".services_movement sm
              ON sm.company_id = source_document.company_id
             AND sm.doc_id = source_document.id
            LEFT JOIN "Inventory"."products&services" ps ON ps.id = sm.service_id
            LEFT JOIN "Ecosystem".taxes tax ON tax.id = ps.tax_id
            WHERE source_document.company_id = $1
              AND source_document."thirdParty_id" = $2
              AND source_document.document_type = 'Client Order'
              AND source_document.status = 'active'
              AND (
                  $3::bigint IS NULL
                  OR EXISTS (
                      SELECT 1
                      FROM "Ecosystem".docs_instances source_instance
                      WHERE source_instance.doc_id = source_document.id
                        AND source_instance.instance_id = $3
                  )
              )
            ORDER BY sm.id ASC;
        `, [companyId, invoice.thirdParty_id, invoice.instance_id ?? null]);
    }

    if (result.rows.length === 0) {
        const error = new Error('No se encontraron líneas guardadas en la factura ni en sus órdenes de servicio asociadas. Las líneas manuales del flujo anterior no se conservaron en la base de datos.');
        error.statusCode = 409;
        throw error;
    }

    const reconstructedTotal = result.rows.reduce((sum, item) => (
        sum + Number(item.total ?? (Number(item.units) * Number(item.unit_value)))
    ), 0);
    if (Math.abs(reconstructedTotal - Number(invoice.total)) > 1) {
        const error = new Error('Las líneas encontradas no coinciden con el total de la factura; se detuvo la emisión para evitar enviar un valor distinto.');
        error.statusCode = 409;
        throw error;
    }

    const invalidItem = result.rows.find(item => (
        !item.service_id || !Number.isFinite(Number(item.units)) || Number(item.units) <= 0
        || !Number.isFinite(Number(item.unit_value)) || !`${item.service_name ?? item.description ?? ''}`.trim()
    ));
    if (invalidItem) {
        const error = new Error(`El ítem ${invalidItem.id} no tiene todos los datos requeridos para facturación electrónica.`);
        error.statusCode = 409;
        throw error;
    }

    return result.rows;
};

const buildFactusItems = (items) => items.map(item => ({
    code_reference: item.service_code ?? `${item.service_id}`,
    name: [item.service_name, item.description]
        .map(value => `${value ?? ''}`.trim())
        .filter(Boolean)
        .join(' + '),
    quantity: Number(item.units),
    discount: 0,
    discount_rate: 0,
    price: Number(item.unit_value),
    tax_rate: Number(item.tax_rate ?? 0).toFixed(2),
    unit_measure_id: 70,
    standard_code_id: 1,
    is_excluded: 0,
    tribute_id: 1,
    withholding_taxes: []
}));

const ensureSuccessfulFactusResponse = (response) => {
    const invoiceResponse = response.data ?? {};
    if (!response.ok || invoiceResponse.status !== 'Created' || !invoiceResponse.data?.bill) {
        const error = new Error(invoiceResponse.message ?? 'Factus no pudo validar la factura electrónica.');
        error.statusCode = response.status >= 400 ? response.status : 502;
        error.details = invoiceResponse.errors;
        throw error;
    }
    return invoiceResponse;
};

const getExistingFactusBill = async ({ companyId, environment, referenceCode }) => {
    const result = await factusService.request({
        company_id: companyId,
        environment,
        path: `/v1/bills?filter[reference_code]=${encodeURIComponent(referenceCode)}`
    });
    if (!result.ok) {
        const error = new Error(result.data?.message ?? 'No se pudo comprobar el estado del documento en Factus.');
        error.statusCode = result.status >= 400 ? result.status : 502;
        throw error;
    }

    const providerBills = result.data?.data?.data ?? result.data?.data ?? [];
    return Array.isArray(providerBills)
        ? providerBills.find(bill => `${bill.reference_code ?? ''}` === referenceCode) ?? null
        : null;
};

const getValidatedExistingBill = async ({ companyId, environment, bill }) => {
    let existingBill = bill;
    if (!existingBill.cufe || !existingBill.public_url) {
        const result = await factusService.request({
            company_id: companyId,
            environment,
            path: `/v1/bills/show/${encodeURIComponent(existingBill.number)}`
        });
        const detailedBill = result.data?.data?.bill
            ?? result.data?.data
            ?? result.data?.bill;
        if (result.ok && detailedBill) existingBill = { ...existingBill, ...detailedBill };
    }
    if (`${existingBill.status}` !== '1') {
        const error = new Error('Factus ya tiene esta factura pendiente de validación. No se creó otra ni se eliminó la pendiente.');
        error.statusCode = 409;
        throw error;
    }
    return existingBill;
};

const validateInvoiceFiscalData = (invoice) => {
    const paymentMethodCode = `${invoice.payment_method_code ?? ''}`.trim();
    if (!paymentMethodCode) {
        const error = new Error('No se encontró un medio de pago guardado en la factura para Factus.');
        error.statusCode = 409;
        throw error;
    }
    if (!invoice.indentification_number || !invoice.identidicationType_id || !invoice.municipality_id) {
        const error = new Error('El tercero no tiene completa su información fiscal para Factus.');
        error.statusCode = 409;
        throw error;
    }
};

const buildFactusInvoicePayload = (invoice, items, referenceCode, numberingRangeId) => {
    const paymentMethodCode = `${invoice.payment_method_code ?? ''}`.trim();

    return {
        document: '01',
        numbering_range_id: numberingRangeId,
        reference_code: referenceCode,
        observation: '',
        payment_method_code: paymentMethodCode,
        payment_form: Number(invoice.outstanding_balance) > 0 ? '2' : '1',
        payment_due_date: `${invoice.payment_due_date ?? ''}`.slice(0, 10),
        customer: {
            identification: invoice.indentification_number,
            dv: `${invoice.dv ?? ''}`,
            company: `${invoice.names} ${invoice.lastNames ?? ''}`.trim(),
            trade_name: invoice.names,
            names: invoice.corporative_name || invoice.names,
            address: invoice.address,
            email: invoice.mail,
            phone: invoice.phone,
            legal_organization_id: invoice.third_party_nature,
            tribute_id: invoice.IVA_responsability ?? '18',
            identification_document_id: invoice.identidicationType_id,
            municipality_id: invoice.municipality_id
        },
        items: buildFactusItems(items)
    };
};

const linkElectronicInvoice = async ({ client, companyId, docId, userId, invoice, bill, referenceCode }) => {
    if (!bill.id || !bill.number || !bill.cufe) {
        const error = new Error('Factus aceptó la factura, pero su respuesta no contiene los identificadores fiscales para asociarla.');
        error.statusCode = 502;
        error.providerAccepted = true;
        throw error;
    }

    const result = await client.query(`
        INSERT INTO "ElectronicFacturation".documents(
            generated_by, company_id, store_id, doc_id, invoice_id, reference,
            "number", code, url, qr, qr_image, type
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'electronic invoice')
        RETURNING id;
    `, [
        userId, companyId, invoice.store_id, docId, bill.id,
        bill.reference_code ?? referenceCode, bill.number, bill.cufe,
        bill.public_url, bill.qr, bill.qr_image
    ]);

    return {
        id: result.rows[0].id,
        invoice_id: bill.id,
        reference: bill.reference_code ?? referenceCode,
        number: bill.number,
        code: bill.cufe,
        url: bill.public_url,
        qr: bill.qr,
        qr_image: bill.qr_image
    };
};

sellInvoiceService.reemitElectronicInvoice = async ({
    doc_id,
    company_id,
    user_id,
    numbering_range_id
}) => {
    const docId = Number(doc_id);
    const companyId = Number(company_id);
    const userId = Number(user_id);
    if (!Number.isSafeInteger(docId) || docId <= 0) {
        const error = new Error('doc_id debe ser un identificador válido.');
        error.statusCode = 400;
        throw error;
    }
    if (!Number.isSafeInteger(companyId) || companyId <= 0 || !Number.isSafeInteger(userId) || userId <= 0) {
        const error = new Error('Se requiere una sesión y compañía activas.');
        error.statusCode = 401;
        throw error;
    }

    let providerEmissionAccepted = false;
    try {
        return await utilsController.withTransaction(async (client) => {
            // Evita que dos solicitudes emitan simultáneamente para la misma factura.
            await client.query(
                'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
                [`electronic-invoice:${companyId}:${docId}`]
            );

            const invoice = await loadInvoiceForElectronicEmission(client, docId, companyId);
            const linked = await findLinkedElectronicInvoice(client, companyId, docId);
            if (linked) return { alreadyLinked: true, linked };

            const items = await loadAndValidateInvoiceItems(client, companyId, invoice, docId);
            validateInvoiceFiscalData(invoice);

            const environment = await sellInvoiceService.resolveElectronicEnvironment({ company_id: companyId });
            const referenceCode = `FVE_${invoice.ownSerial}`;
            let bill = await getExistingFactusBill({ companyId, environment, referenceCode });
            let invoiceResponse;

            if (bill) {
                bill = await getValidatedExistingBill({ companyId, environment, bill });
                invoiceResponse = {
                    status: 'Created',
                    data: { bill }
                };
            } else {
                const numberingPolicy = await sellInvoiceService.resolveInvoiceNumberingPolicy({
                    company_id: companyId,
                    user_id: userId
                });
                const numberingRangeId = await factusService.getNumberingRangeId({
                    company_id: companyId,
                    environment,
                    type: 'invoice',
                    preferredRangeId: numbering_range_id ?? null,
                    allowedRangeIds: numberingPolicy.allowedRangeIds
                });
                const response = await factusService.validateInvoice({
                    company_id: companyId,
                    environment,
                    payload: buildFactusInvoicePayload(invoice, items, referenceCode, numberingRangeId)
                });
                invoiceResponse = ensureSuccessfulFactusResponse(response);
                bill = invoiceResponse.data.bill;
            }

            // Factus ya confirmó la factura; si falla el registro local, se informa
            // para que el cliente consulte el estado antes de intentar emitir de nuevo.
            providerEmissionAccepted = true;
            const electronicDocument = await linkElectronicInvoice({
                client,
                companyId,
                docId,
                userId,
                invoice,
                bill,
                referenceCode
            });

            return {
                alreadyLinked: false,
                linked: electronicDocument,
                providerResponse: invoiceResponse
            };
        });
    } catch (error) {
        if (providerEmissionAccepted) error.providerAccepted = true;
        throw error;
    }
};

sellInvoiceService.register = async (info) => {
    const steps = [];
    console.log('Información recibida para la factura de venta: ',info)
    const { document, portfolioResult, accountResult, processResult } = await utilsController.withTransaction(async (client) => {
        const document = await utilsController.registerDocument(info, {
            includeProcessFields: false,
            client
        });

        console.log('Fase 1 Documento creado', document)

        if (document?.replayed) {
            return { document, portfolioResult: { status: 'replayed' }, accountResult: { status: 'replayed' }, processResult: { status: 'replayed' } };
        }

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

        /*
        // Temportal accounting disabled
        const accountResult = {
            status: "skipped",
            description: "El documento no trae detalles contables."
        }
        */
        
        // Accountability enabled
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
        replayed: document.replayed === true,
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

        const advanceApplications = await client.query(`SELECT id FROM "Treasury".advance_applications
            WHERE company_id = $1 AND document_id = $2 LIMIT 1`, [companyId, documentId]);
        if (advanceApplications.rows.length) {
            const error = new Error('La factura tiene aplicaciones de anticipos. Debe revertirlas mediante un documento compensatorio antes de anularla.');
            error.statusCode = 409;
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
