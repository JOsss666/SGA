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

    if (error.code === "23505") {
        return createServiceError(
            "La clave de idempotencia o el identificador de detalle ya existe para esta empresa.",
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

export function normalizeCreateMovement(info = {}) {
    if (!isJsonObject(info)) {
        throw createServiceError("El movimiento debe ser un objeto.");
    }

    if (info.schema_version !== "1.0") {
        throw createServiceError("schema_version debe ser 1.0.");
    }

    if (info.operation !== "create") {
        throw createServiceError(
            "Esta función solo acepta la operación create."
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

    if (!Array.isArray(info.details) || info.details.length === 0) {
        throw createServiceError("details debe contener al menos un detalle.");
    }

    const seenDetailIds = new Set();

    const details = info.details.map((detail, index) => {
        const field = `details[${index}]`;

        if (!isJsonObject(detail)) {
            throw createServiceError(`${field} debe ser un objeto.`);
        }

        const clientDetailId = normalizeClientDetailId(
            detail.detail_id,
            `${field}.detail_id`
        );

        if (seenDetailIds.has(clientDetailId)) {
            throw createServiceError(`${field}.detail_id está repetido.`);
        }

        seenDetailIds.add(clientDetailId);

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

        if (detail.reverses_detail_id != null) {
            throw createServiceError(
                `${field}.reverses_detail_id debe ser null en una operación create.`
            );
        }

        if (detail.metadata != null && !isJsonObject(detail.metadata)) {
            throw createServiceError(`${field}.metadata debe ser un objeto.`);
        }

        return {
            client_detail_id: clientDetailId,
            currency,
            amount,
            direction,
            concept,
            account_id:
                detail.account_id == null
                    ? null
                    : normalizeId(
                        detail.account_id,
                        `${field}.account_id`
                    ),
            reverses_detail_id: null,
            metadata: detail.metadata ?? {},
        };
    });

    return {
        transaction: {
            company_id: companyId,
            bank_account_id: bankAccountId,
            idempotency_key: idempotencyKey,
            operation: "create",
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
        },
        details,
    };
}

const validateMovementReferences = async (client, transaction, details) => {
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

    const accountingAccountsResult = await client.query(
        `SELECT id
        FROM "Ecosystem".contable_accounts
        WHERE company_id = $1
          AND id = ANY($2::bigint[])`,
        [transaction.company_id, accountingAccountIds]
    );

    const foundAccountIds = new Set(
        accountingAccountsResult.rows.map((row) => String(row.id))
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

export async function ingestMovement(client, info) {
    if (!client || typeof client.query !== "function") {
        throw createServiceError(
            "Se requiere un cliente válido de base de datos.",
            500
        );
    }

    try {
        const normalized = normalizeCreateMovement(info);
        const { transaction, details } = normalized;

        const existingMovement = await getExistingMovement(
            client,
            transaction.company_id,
            transaction.idempotency_key
        );

        if (existingMovement) {
            return existingMovement;
        }

        await validateMovementReferences(client, transaction, details);

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

        return {
            transaction_id: String(insertedTransaction.id),
            idempotent_replay: false,
            details: insertedDetails,
        };
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