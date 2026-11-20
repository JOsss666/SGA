import { registerMovementAudit } from "./banksAuditService.js";

const createServiceError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeId = (value, fieldName) => {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
        throw createServiceError(
            `${fieldName} debe ser un identificador válido.`
        );
    }

    const id = String(value ?? "").trim();

    if (!/^[1-9]\d*$/.test(id)) {
        throw createServiceError(
            `${fieldName} debe ser un identificador válido.`
        );
    }

    return id;
};

const isJsonObject = (value) =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);

const requireText = (value, fieldName) => {
    if (typeof value !== "string" || value.trim() === "") {
        throw createServiceError(`${fieldName} es obligatorio.`);
    }

    return value.trim();
};

const normalizeUtcTimestamp = (value, fieldName) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T.*(?:Z|\+00:00)$/i.test(value) ||
        Number.isNaN(Date.parse(value))
    ) {
        throw createServiceError(
            `${fieldName} debe ser una fecha ISO-8601 en UTC.`
        );
    }

    return new Date(value).toISOString();
};

const normalizeAmount = (value, fieldName) => {
    const amount =
        typeof value === "number" && Number.isFinite(value)
            ? String(value)
            : typeof value === "string"
              ? value.trim()
              : "";

    if (!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,6})?$/.test(amount)) {
        throw createServiceError(
            `${fieldName} debe ser un monto positivo con máximo 6 decimales.`
        );
    }

    const [integerPart, decimalPart = ""] = amount.split(".");
    const amountInMicros = BigInt(
        `${integerPart}${decimalPart.padEnd(6, "0")}`
    );

    if (amountInMicros <= 0n) {
        throw createServiceError(`${fieldName} debe ser mayor que cero.`);
    }

    return amount;
};

const amountToMicros = (value, fieldName) => {
    const amount = normalizeAmount(value, fieldName);
    const [integerPart, decimalPart = ""] = amount.split(".");

    return BigInt(`${integerPart}${decimalPart.padEnd(6, "0")}`);
};

const normalizeClientDetailId = (value, fieldName) => {
    const id = requireText(value, fieldName).toLowerCase();

    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) {
        throw createServiceError(`${fieldName} debe ser un UUID válido.`);
    }

    return id;
};

const parseJsonObject = (value, fieldName) => {
    let parsed = value;

    if (typeof value === "string") {
        try {
            parsed = JSON.parse(value);
        } catch {
            throw createServiceError(
                `${fieldName} no contiene JSON válido.`,
                500
            );
        }
    }

    if (!isJsonObject(parsed)) {
        throw createServiceError(
            `${fieldName} debe ser un objeto válido.`,
            500
        );
    }

    return parsed;
};

const normalizeDbError = (error) => {
    if (error.statusCode) {
        return error;
    }

    if (
        error.code === "23505" &&
        error.constraint === "bank_transaction_details_reverses_idx"
    ) {
        return createServiceError(
            "Uno de los detalles ya fue revertido.",
            409
        );
    }

    if (
        error.code === "23505" &&
        error.constraint === "bank_transaction_details_client_detail_idx"
    ) {
        return createServiceError(
            "El identificador del detalle ya existe para esta empresa.",
            409
        );
    }

    if (error.code === "23505") {
        return createServiceError(
            "La clave de idempotencia ya existe para esta empresa.",
            409
        );
    }

    if (error.code === "23503") {
        return createServiceError(
            "Una referencia del movimiento no existe o no pertenece a la empresa.",
            400
        );
    }

    if (error.code === "23514") {
        return createServiceError(
            "El movimiento o uno de sus detalles no cumple las reglas de la base de datos.",
            400
        );
    }

    if (error.code === "P0001" && typeof error.message === "string") {
        return createServiceError(error.message, 400);
    }

    const translatedError = createServiceError(
        "No fue posible registrar el movimiento bancario.",
        500
    );
    translatedError.cause = error;

    return translatedError;
};

const normalizeMovementHeader = (info, expectedOperation) => {
    if (!isJsonObject(info)) {
        throw createServiceError("El movimiento debe ser un objeto.");
    }

    if (info.schema_version !== "1.0") {
        throw createServiceError("schema_version debe ser 1.0.");
    }

    if (info.operation !== expectedOperation) {
        throw createServiceError(
            `Esta función solo acepta la operación ${expectedOperation}.`
        );
    }

    const companyId = normalizeId(info.company_id, "company_id");
    const bankAccountId = normalizeId(
        info.bank_account_id,
        "bank_account_id"
    );
    const idempotencyKey = requireText(
        info.idempotency_key,
        "idempotency_key"
    );
    const createdAt = normalizeUtcTimestamp(info.created_at, "created_at");

    if (!isJsonObject(info.origin)) {
        throw createServiceError("origin debe ser un objeto.");
    }

    const originModule = requireText(info.origin.module, "origin.module");
    const documentType = requireText(
        info.origin.document_type,
        "origin.document_type"
    ).toLowerCase();
    const documentId = normalizeId(
        info.origin.document_id,
        "origin.document_id"
    );

    const documentNumber =
        info.origin.document_number == null
            ? null
            : requireText(
                  info.origin.document_number,
                  "origin.document_number"
              );

    if (!isJsonObject(info.actor)) {
        throw createServiceError("actor debe ser un objeto.");
    }

    const userId = normalizeId(info.actor.user_id, "actor.user_id");

    if (info.context != null && !isJsonObject(info.context)) {
        throw createServiceError("context debe ser un objeto.");
    }

    let description = null;

    if (info.description != null) {
        if (typeof info.description !== "string") {
            throw createServiceError("description debe ser texto.");
        }

        description = info.description;
    }

    return {
        company_id: companyId,
        bank_account_id: bankAccountId,
        idempotency_key: idempotencyKey,
        operation: expectedOperation,
        document_id: documentId,
        origin: {
            module: originModule,
            document_type: documentType,
            document_id: documentId,
            document_number: documentNumber,
        },
        context: info.context ?? {},
        description,
        created_by: userId,
        created_at: createdAt,
    };
};

const normalizeMovementDetails = (inputDetails, operation) => {
    if (!Array.isArray(inputDetails) || inputDetails.length === 0) {
        throw createServiceError("details debe contener al menos un detalle.");
    }

    const seenClientDetailIds = new Set();
    const seenOriginalDetailIds = new Set();

    return inputDetails.map((detail, index) => {
        const field = `details[${index}]`;

        if (!isJsonObject(detail)) {
            throw createServiceError(`${field} debe ser un objeto.`);
        }

        const clientDetailId = normalizeClientDetailId(
            detail.detail_id,
            `${field}.detail_id`
        );

        if (seenClientDetailIds.has(clientDetailId)) {
            throw createServiceError(`${field}.detail_id está repetido.`);
        }

        seenClientDetailIds.add(clientDetailId);

        const currency = requireText(
            detail.currency,
            `${field}.currency`
        ).toUpperCase();

        if (!/^[A-Z]{3}$/.test(currency)) {
            throw createServiceError(
                `${field}.currency debe ser un código ISO-4217.`
            );
        }

        const amount = normalizeAmount(detail.amount, `${field}.amount`);
        const direction = requireText(
            detail.direction,
            `${field}.direction`
        ).toLowerCase();

        if (direction !== "in" && direction !== "out") {
            throw createServiceError(`${field}.direction debe ser in u out.`);
        }

        const concept = requireText(detail.concept, `${field}.concept`);

        if (detail.metadata != null && !isJsonObject(detail.metadata)) {
            throw createServiceError(`${field}.metadata debe ser un objeto.`);
        }

        const accountId =
            detail.account_id == null
                ? null
                : normalizeId(detail.account_id, `${field}.account_id`);

        if (operation === "create") {
            if (detail.reverses_detail_id != null) {
                throw createServiceError(
                    `${field}.reverses_detail_id debe ser null en una operación create.`
                );
            }

            return {
                client_detail_id: clientDetailId,
                currency,
                amount,
                direction,
                concept,
                account_id: accountId,
                reverses_detail_id: null,
                metadata: detail.metadata ?? {},
            };
        }

        if (operation === "reverse") {
            const reversesClientDetailId = normalizeClientDetailId(
                detail.reverses_detail_id,
                `${field}.reverses_detail_id`
            );

            if (seenOriginalDetailIds.has(reversesClientDetailId)) {
                throw createServiceError(
                    `${field}.reverses_detail_id está repetido.`
                );
            }

            seenOriginalDetailIds.add(reversesClientDetailId);

            return {
                client_detail_id: clientDetailId,
                reverses_client_detail_id: reversesClientDetailId,
                currency,
                amount,
                direction,
                concept,
                account_id: accountId,
                reverses_detail_id: null,
                metadata: detail.metadata ?? {},
            };
        }

        throw createServiceError(`La operación ${operation} no está soportada.`);
    });
};

export function normalizeCreateMovement(info = {}) {
    const transaction = normalizeMovementHeader(info, "create");
    const details = normalizeMovementDetails(info.details, "create");

    return { transaction, details };
}

export function normalizeReverseMovement(info = {}) {
    const transaction = normalizeMovementHeader(info, "reverse");
    const details = normalizeMovementDetails(info.details, "reverse");

    return { transaction, details };
}

const getExistingMovement = async (client, companyId, idempotencyKey) => {
    const transactionResult = await client.query(
        `SELECT id
        FROM "Treasury".bank_transactions
        WHERE company_id = $1
          AND idempotency_key = $2
        LIMIT 1`,
        [companyId, idempotencyKey]
    );

    const transaction = transactionResult.rows[0];

    if (!transaction) {
        return null;
    }

    const detailsResult = await client.query(
        `SELECT id, client_detail_id
        FROM "Treasury".bank_transaction_details
        WHERE company_id = $1
          AND transaction_id = $2
        ORDER BY id ASC`,
        [companyId, transaction.id]
    );

    return {
        transaction_id: String(transaction.id),
        idempotent_replay: true,
        details: detailsResult.rows.map((detail) => ({
            id: String(detail.id),
            client_detail_id: detail.client_detail_id,
        })),
    };
};

const validateDocumentReference = async (client, transaction) => {
    const documentResult = await client.query(
        `SELECT id
        FROM "Ecosystem".documents
        WHERE id = $1
          AND company_id = $2
        LIMIT 1`,
        [transaction.document_id, transaction.company_id]
    );

    if (!documentResult.rows[0]) {
        throw createServiceError(
            "El documento de origen no existe o no pertenece a la empresa."
        );
    }
};

const validateAccountingAccountReferences = async (
    client,
    companyId,
    details
) => {
    const accountingAccountIds = [
        ...new Set(
            details
                .map((detail) => detail.account_id)
                .filter((accountId) => accountId !== null)
        ),
    ];

    if (accountingAccountIds.length === 0) {
        return;
    }

    const result = await client.query(
        `SELECT id
        FROM "Ecosystem".contable_accounts
        WHERE company_id = $1
          AND id = ANY($2::bigint[])`,
        [companyId, accountingAccountIds]
    );

    const foundAccountIds = new Set(
        result.rows.map((row) => String(row.id))
    );

    const invalidAccountId = accountingAccountIds.find(
        (accountId) => !foundAccountIds.has(accountId)
    );

    if (invalidAccountId) {
        throw createServiceError(
            `La cuenta contable ${invalidAccountId} no existe o no pertenece a la empresa.`
        );
    }
};

const validateCreateReferences = async (client, transaction, details) => {
    const bankAccountResult = await client.query(
        `SELECT currency_policy
        FROM "Treasury".bank_accounts
        WHERE company_id = $1
          AND id = $2
          AND is_active = true
        LIMIT 1`,
        [transaction.company_id, transaction.bank_account_id]
    );

    const bankAccount = bankAccountResult.rows[0];

    if (!bankAccount) {
        throw createServiceError(
            "La cuenta bancaria no existe, está inactiva o no pertenece a la empresa.",
            404
        );
    }

    const currencyPolicy = parseJsonObject(
        bankAccount.currency_policy,
        "currency_policy"
    );

    const allowedCurrencies = Array.isArray(
        currencyPolicy.allowed_currencies
    )
        ? currencyPolicy.allowed_currencies.map((currency) =>
              String(currency).toUpperCase()
          )
        : [];

    if (allowedCurrencies.length === 0) {
        throw createServiceError(
            "La cuenta bancaria no tiene monedas permitidas configuradas."
        );
    }

    for (const detail of details) {
        if (!allowedCurrencies.includes(detail.currency)) {
            throw createServiceError(
                `La moneda ${detail.currency} no está permitida para la cuenta bancaria.`
            );
        }
    }

    await validateDocumentReference(client, transaction);
    await validateAccountingAccountReferences(
        client,
        transaction.company_id,
        details
    );
};

const loadOriginalDetailsForReverse = async (
    client,
    companyId,
    bankAccountId,
    reversesClientDetailIds
) => {
    const result = await client.query(
        `SELECT
            original_detail.id,
            original_detail.client_detail_id,
            original_detail.currency,
            original_detail.amount::text AS amount,
            original_detail.direction,
            original_detail.concept,
            original_detail.account_id,
            EXISTS (
                SELECT 1
                FROM "Treasury".bank_transaction_details AS reversal_detail
                WHERE reversal_detail.company_id = original_detail.company_id
                  AND reversal_detail.reverses_detail_id = original_detail.id
            ) AS already_reversed
        FROM "Treasury".bank_transaction_details AS original_detail
        JOIN "Treasury".bank_transactions AS original_transaction
          ON original_transaction.company_id = original_detail.company_id
         AND original_transaction.id = original_detail.transaction_id
        WHERE original_detail.company_id = $1
          AND original_transaction.bank_account_id = $2
          AND original_transaction.operation = 'create'
          AND original_detail.client_detail_id = ANY($3::uuid[])
        FOR UPDATE OF original_detail`,
        [companyId, bankAccountId, reversesClientDetailIds]
    );

    const originals = result.rows;

    if (originals.length !== reversesClientDetailIds.length) {
        throw createServiceError(
            "Uno o más detalles originales no existen para esta empresa y cuenta.",
            404
        );
    }

    const alreadyReversed = originals.find((detail) => detail.already_reversed);

    if (alreadyReversed) {
        throw createServiceError(
            `El detalle ${alreadyReversed.client_detail_id} ya fue revertido.`,
            409
        );
    }

    return originals;
};

const resolveReverseDetails = (requestedDetails, originalDetails) => {
    const originalsByClientId = new Map(
        originalDetails.map((detail) => [
            String(detail.client_detail_id).toLowerCase(),
            detail,
        ])
    );

    return requestedDetails.map((requestedDetail, index) => {
        const original = originalsByClientId.get(
            requestedDetail.reverses_client_detail_id
        );

        if (!original) {
            throw createServiceError(
                `No se encontró el detalle original ${requestedDetail.reverses_client_detail_id}.`,
                404
            );
        }

        const originalCurrency = String(original.currency).toUpperCase();

        if (requestedDetail.currency !== originalCurrency) {
            throw createServiceError(
                `La moneda del reverse no coincide con el detalle original ${original.client_detail_id}.`
            );
        }

        const originalAmount = normalizeAmount(
            String(original.amount),
            `originalDetails[${index}].amount`
        );

        if (
            amountToMicros(requestedDetail.amount, `details[${index}].amount`) !==
            amountToMicros(originalAmount, `originalDetails[${index}].amount`)
        ) {
            throw createServiceError(
                `El monto del reverse no coincide con el detalle original ${original.client_detail_id}.`
            );
        }

        const expectedDirection =
            original.direction === "in" ? "out" : "in";

        if (requestedDetail.direction !== expectedDirection) {
            throw createServiceError(
                `La dirección del reverse debe ser opuesta al detalle original ${original.client_detail_id}.`
            );
        }

        if (
            requestedDetail.account_id !== null &&
            String(requestedDetail.account_id) !== String(original.account_id)
        ) {
            throw createServiceError(
                `La cuenta contable del reverse no coincide con el detalle original ${original.client_detail_id}.`
            );
        }

        if (
            original.concept != null &&
            requestedDetail.concept !== original.concept
        ) {
            throw createServiceError(
                `El concepto del reverse no coincide con el detalle original ${original.client_detail_id}.`
            );
        }

        return {
            client_detail_id: requestedDetail.client_detail_id,
            currency: originalCurrency,
            amount: originalAmount,
            direction: expectedDirection,
            concept: original.concept ?? requestedDetail.concept,
            account_id:
                original.account_id == null
                    ? null
                    : String(original.account_id),
            reverses_detail_id: String(original.id),
            metadata: requestedDetail.metadata,
        };
    });
};

const insertMovement = async (client, transaction, details) => {
    const transactionResult = await client.query(
        `INSERT INTO "Treasury".bank_transactions (
            company_id,
            bank_account_id,
            idempotency_key,
            operation,
            document_id,
            origin,
            context,
            created_by,
            created_at,
            description
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10)
        ON CONFLICT (company_id, idempotency_key) DO NOTHING
        RETURNING id`,
        [
            transaction.company_id,
            transaction.bank_account_id,
            transaction.idempotency_key,
            transaction.operation,
            transaction.document_id,
            JSON.stringify(transaction.origin),
            JSON.stringify(transaction.context),
            transaction.created_by,
            transaction.created_at,
            transaction.description,
        ]
    );

    const insertedTransaction = transactionResult.rows[0];

    if (!insertedTransaction) {
        const racedMovement = await getExistingMovement(
            client,
            transaction.company_id,
            transaction.idempotency_key
        );

        if (racedMovement) {
            return racedMovement;
        }

        throw createServiceError(
            "No fue posible confirmar la transacción creada.",
            500
        );
    }

    const insertedDetails = [];

    for (const detail of details) {
        const detailResult = await client.query(
            `INSERT INTO "Treasury".bank_transaction_details (
                company_id,
                transaction_id,
                client_detail_id,
                currency,
                amount,
                direction,
                concept,
                account_id,
                reverses_detail_id,
                metadata,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
            RETURNING id, client_detail_id`,
            [
                transaction.company_id,
                insertedTransaction.id,
                detail.client_detail_id,
                detail.currency,
                detail.amount,
                detail.direction,
                detail.concept,
                detail.account_id,
                detail.reverses_detail_id,
                JSON.stringify(detail.metadata),
                transaction.created_at,
            ]
        );

        const insertedDetail = detailResult.rows[0];

        insertedDetails.push({
            id: String(insertedDetail.id),
            client_detail_id: insertedDetail.client_detail_id,
        });
    }

    await registerMovementAudit(client, {
        company_id: transaction.company_id,
        transaction_id: insertedTransaction.id,
        actor_user_id: transaction.created_by,
        operation: transaction.operation,
        created_at: transaction.created_at,
        details: details.map((detail, index) => ({
            ...detail,
            id: insertedDetails[index].id,
        })),
    });

    return {
        transaction_id: String(insertedTransaction.id),
        idempotent_replay: false,
        details: insertedDetails,
    };
};

export async function ingestMovement(client, info) {
    if (!client || typeof client.query !== "function") {
        throw createServiceError(
            "Se requiere un cliente válido de base de datos.",
            500
        );
    }

    try {
        let normalized;

        if (info?.operation === "create") {
            normalized = normalizeCreateMovement(info);
        } else if (info?.operation === "reverse") {
            normalized = normalizeReverseMovement(info);
        } else {
            throw createServiceError(
                "operation debe ser create o reverse."
            );
        }

        const { transaction } = normalized;

        const existingMovement = await getExistingMovement(
            client,
            transaction.company_id,
            transaction.idempotency_key
        );

        if (existingMovement) {
            return existingMovement;
        }

        let details;

        if (transaction.operation === "create") {
            await validateCreateReferences(
                client,
                transaction,
                normalized.details
            );
            details = normalized.details;
        } else {
            await validateDocumentReference(client, transaction);

            const reversesClientDetailIds = normalized.details.map(
                (detail) => detail.reverses_client_detail_id
            );

            const originalDetails = await loadOriginalDetailsForReverse(
                client,
                transaction.company_id,
                transaction.bank_account_id,
                reversesClientDetailIds
            );

            details = resolveReverseDetails(
                normalized.details,
                originalDetails
            );

            await validateAccountingAccountReferences(
                client,
                transaction.company_id,
                details
            );
        }

        return await insertMovement(client, transaction, details);
    } catch (error) {
        throw normalizeDbError(error);
    }
}

export async function getAccountBalance(client, info = {}) {
    if (!client || typeof client.query !== "function") {
        throw createServiceError(
            "Se requiere un cliente válido de base de datos.",
            500
        );
    }

    const companyId = normalizeId(info.company_id, "company_id");
    const bankAccountId = normalizeId(
        info.bank_account_id,
        "bank_account_id"
    );

    const result = await client.query(
        `SELECT
            bank_account_id,
            currency,
            total_in,
            total_out,
            balance,
            detail_count,
            last_movement_at
        FROM "Treasury".bank_account_balances
        WHERE company_id = $1
          AND bank_account_id = $2
        ORDER BY currency ASC`,
        [companyId, bankAccountId]
    );

    return result.rows;
}

export async function listMovements(client, info = {}) {
    if (!client || typeof client.query !== "function") {
        throw createServiceError(
            "Se requiere un cliente válido de base de datos.",
            500
        );
    }

    const companyId = normalizeId(info.company_id, "company_id");
    const bankAccountId = normalizeId(
        info.bank_account_id,
        "bank_account_id"
    );

    const filters = [
        "bt.company_id = $1",
        "bt.bank_account_id = $2",
    ];
    const values = [companyId, bankAccountId];

    let startDate;
    let endDate;

    if (info.start_date != null) {
        startDate = normalizeUtcTimestamp(info.start_date, "start_date");
        values.push(startDate);
        filters.push(`bt.created_at >= $${values.length}`);
    }

    if (info.end_date != null) {
        endDate = normalizeUtcTimestamp(info.end_date, "end_date");
        values.push(endDate);
        filters.push(`bt.created_at < $${values.length}`);
    }

    if (
        startDate &&
        endDate &&
        Date.parse(startDate) >= Date.parse(endDate)
    ) {
        throw createServiceError(
            "end_date debe ser posterior a start_date."
        );
    }

    try {
        const result = await client.query(
            `SELECT
                bt.id AS transaction_id,
                bt.company_id,
                bt.bank_account_id,
                bt.idempotency_key,
                bt.operation,
                bt.document_id,
                bt.origin,
                bt.context,
                bt.created_by,
                bt.created_at,
                bt.description,
                COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'id', bd.id,
                            'detail_id', bd.client_detail_id,
                            'currency', bd.currency,
                            'amount', bd.amount,
                            'direction', bd.direction,
                            'concept', bd.concept,
                            'account_id', bd.account_id,
                            'reverses_detail_id', bd.reverses_detail_id,
                            'metadata', bd.metadata,
                            'created_at', bd.created_at
                        )
                        ORDER BY bd.id
                    ) FILTER (WHERE bd.id IS NOT NULL),
                    '[]'::jsonb
                ) AS details
            FROM "Treasury".bank_transactions AS bt
            LEFT JOIN "Treasury".bank_transaction_details AS bd
              ON bd.company_id = bt.company_id
             AND bd.transaction_id = bt.id
            WHERE ${filters.join(" AND ")}
            GROUP BY bt.id
            ORDER BY bt.created_at DESC, bt.id DESC`,
            values
        );

        return result.rows;
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        const serviceError = createServiceError(
            "No fue posible consultar los movimientos bancarios.",
            500
        );
        serviceError.cause = error;
        throw serviceError;
    }
}