const createServiceError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeId = (value, fieldName) => {
    const id = String(value ?? "").trim();

    if (!/^[1-9]\d*$/.test(id)) {
        throw createServiceError(`${fieldName} debe ser un identificador válido.`);
    }

    return id;
};

const normalizeDbError = (error) => {
    if (error.statusCode) {
        return error;
    }

    if (error.code === "23503") {
        return createServiceError(
            "La empresa, transacción, detalle o usuario no existe o no coincide con la empresa indicada."
        );
    }

    if (error.code === "23514" || error.code === "23502") {
        return createServiceError(
            "El registro de auditoría no cumple las reglas de la base de datos."
        );
    }

    const serviceError = createServiceError(
        "No fue posible registrar la auditoría del movimiento.",
        500
    );
    serviceError.cause = error;

    return serviceError;
};

export async function registerMovementAudit(client, info = {}) {
    if (!client || typeof client.query !== "function") {
        throw createServiceError(
            "Se requiere un cliente válido de base de datos.",
            500
        );
    }

    const companyId = normalizeId(info.company_id, "company_id");
    const transactionId = normalizeId(info.transaction_id, "transaction_id");
    const actorUserId = normalizeId(info.actor_user_id, "actor.user_id");
    const operation = String(info.operation ?? "").trim().toLowerCase();

    if (operation !== "create" && operation !== "reverse") {
        throw createServiceError("operation debe ser create o reverse.");
    }

    const createdAt = new Date(info.created_at);

    if (
        info.created_at == null ||
        Number.isNaN(createdAt.getTime()) ||
        !/(?:Z|\+00:00)$/i.test(String(info.created_at))
    ) {
        throw createServiceError(
            "created_at debe ser una fecha ISO-8601 en UTC."
        );
    }

    if (!Array.isArray(info.details) || info.details.length === 0) {
        throw createServiceError(
            "details debe contener al menos un detalle para auditar."
        );
    }

    try {
        const auditRows = [];

        for (const detail of info.details) {
            const detailId = normalizeId(detail.id, "detail_id");
            const payload = {
                client_detail_id: detail.client_detail_id,
                currency: detail.currency,
                amount: detail.amount,
                direction: detail.direction,
                concept: detail.concept,
                account_id: detail.account_id,
                reverses_detail_id: detail.reverses_detail_id,
                metadata: detail.metadata ?? {},
            };

            const result = await client.query(
                `INSERT INTO "Treasury".bank_audit (
                    company_id,
                    transaction_id,
                    detail_id,
                    actor_user_id,
                    operation,
                    payload,
                    created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
                RETURNING id`,
                [
                    companyId,
                    transactionId,
                    detailId,
                    actorUserId,
                    operation,
                    JSON.stringify(payload),
                    createdAt.toISOString(),
                ]
            );

            auditRows.push({
                id: String(result.rows[0].id),
                transaction_id: transactionId,
                detail_id: detailId,
            });
        }

        return auditRows;
    } catch (error) {
        throw normalizeDbError(error);
    }
}