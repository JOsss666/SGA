import test from "node:test";
import assert from "node:assert/strict";
import {
    getAccountBalance,
    ingestMovement,
    normalizeCreateMovement,
} from "../../services/banksMovementsService.js";

const makeDetail = (overrides = {}) => ({
    detail_id: "123e4567-e89b-12d3-a456-426614174000",
    currency: "COP",
    amount: 1000000,
    direction: "in",
    concept: "principal",
    account_id: null,
    reverses_detail_id: null,
    metadata: {},
    ...overrides,
});

const makePayload = (overrides = {}) => ({
    schema_version: "1.0",
    idempotency_key: "doc:venta:FV-00912:v1",
    operation: "create",
    bank_account_id: "12",
    company_id: "7",
    origin: {
        module: "ventas",
        document_type: "factura_venta",
        document_id: "200",
        document_number: "FV-00912",
    },
    description: "Pago factura FV-00912",
    created_at: "2026-11-18T10:20:00Z",
    actor: { user_id: "87" },
    context: { country: "CO" },
    details: [makeDetail()],
    ...overrides,
});

const createMockClient = (options = {}) => {
    const calls = [];
    let nextDetailId = 300;

    const bankAccount =
        options.bankAccount === undefined
            ? {
                currency_policy: {
                    allowed_currencies: ["COP", "USD"],
                },
            }
            : options.bankAccount;

    return {
        calls,

        async query(sql, params = []) {
            const normalizedSql = sql.replace(/\s+/g, " ").trim();
            calls.push({ sql: normalizedSql, params });

            if (
                normalizedSql.startsWith(
                    'SELECT id FROM "Treasury".bank_transactions'
                )
            ) {
                return {
                    rows: options.existingTransaction
                        ? [options.existingTransaction]
                        : [],
                };
            }

            if (
                normalizedSql.startsWith(
                    'SELECT id, client_detail_id FROM "Treasury".bank_transaction_details'
                )
            ) {
                return {
                    rows: options.existingDetails ?? [],
                };
            }

            if (
                normalizedSql.startsWith(
                    'SELECT currency_policy FROM "Treasury".bank_accounts'
                )
            ) {
                return {
                    rows: bankAccount ? [bankAccount] : [],
                };
            }

            if (
                normalizedSql.startsWith(
                    'SELECT id FROM "Ecosystem".documents'
                )
            ) {
                return {
                    rows: options.documentExists === false
                        ? []
                        : [{ id: params[0] }],
                };
            }

            if (
                normalizedSql.startsWith(
                    'SELECT id FROM "Ecosystem".contable_accounts'
                )
            ) {
                const requestedIds = params[1].map(String);
                const accountIds = options.accountIds ?? requestedIds;

                return {
                    rows: accountIds.map((id) => ({ id })),
                };
            }

            if (
                normalizedSql.startsWith(
                    'INSERT INTO "Treasury".bank_transactions'
                )
            ) {
                if (options.conflictOnTransactionInsert) {
                    return { rows: [] };
                }

                return {
                    rows: [
                        {
                            id: options.insertedTransactionId ?? "500",
                        },
                    ],
                };
            }

            if (
                normalizedSql.startsWith(
                    'INSERT INTO "Treasury".bank_transaction_details'
                )
            ) {
                if (options.failOnDetailInsert) {
                    const error = new Error("duplicate detail");
                    error.code = "23505";
                    throw error;
                }

                return {
                    rows: [
                        {
                            id: String(nextDetailId++),
                            client_detail_id: params[2],
                        },
                    ],
                };
            }

            if (
                normalizedSql.includes(
                    'FROM "Treasury".bank_account_balances'
                )
            ) {
                return {
                    rows: options.balanceRows ?? [],
                };
            }

            throw new Error(`Consulta no simulada en el test: ${normalizedSql}`);
        },
    };
};

test("normaliza el UMJP create y mapea detail_id a client_detail_id", () => {
    const result = normalizeCreateMovement(makePayload());

    assert.deepEqual(result.transaction, {
        company_id: "7",
        bank_account_id: "12",
        idempotency_key: "doc:venta:FV-00912:v1",
        operation: "create",
        document_id: "200",
        origin: {
            module: "ventas",
            document_type: "factura_venta",
            document_id: "200",
            document_number: "FV-00912",
        },
        context: { country: "CO" },
        description: "Pago factura FV-00912",
        created_by: "87",
        created_at: "2026-11-18T10:20:00.000Z",
    });

    assert.deepEqual(result.details, [
        {
            client_detail_id: "123e4567-e89b-12d3-a456-426614174000",
            currency: "COP",
            amount: "1000000",
            direction: "in",
            concept: "principal",
            account_id: null,
            reverses_detail_id: null,
            metadata: {},
        },
    ]);
});

test("rechaza un create sin detalles", () => {
    assert.throws(
        () => normalizeCreateMovement(makePayload({ details: [] })),
        /details debe contener al menos un detalle/
    );
});

test("rechaza un monto igual a cero", () => {
    assert.throws(
        () =>
            normalizeCreateMovement(
                makePayload({
                    details: [makeDetail({ amount: 0 })],
                })
            ),
        /amount debe ser mayor que cero/
    );
});

test("rechaza UUID de detalle repetidos en el mismo movimiento", () => {
    const detail = makeDetail();

    assert.throws(
        () =>
            normalizeCreateMovement(
                makePayload({
                    details: [detail, { ...detail }],
                })
            ),
        /detail_id está repetido/
    );
});

test("rechaza reverse en la normalización de create", () => {
    assert.throws(
        () => normalizeCreateMovement(makePayload({ operation: "reverse" })),
        /solo acepta la operación create/
    );
});

test("crea una transacción y todos sus detalles", async () => {
    const client = createMockClient();
    const payload = makePayload({
        details: [
            makeDetail(),
            makeDetail({
                detail_id: "123e4567-e89b-12d3-a456-426614174001",
                currency: "USD",
                amount: 25.5,
                direction: "out",
                concept: "comision",
                metadata: { channel: "web" },
            }),
        ],
    });

    const result = await ingestMovement(client, payload);

    assert.equal(result.transaction_id, "500");
    assert.equal(result.idempotent_replay, false);
    assert.equal(result.details.length, 2);

    const transactionInserts = client.calls.filter(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_transactions')
    );
    const detailInserts = client.calls.filter(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_transaction_details')
    );

    assert.equal(transactionInserts.length, 1);
    assert.equal(detailInserts.length, 2);
    assert.equal(transactionInserts[0].params[0], "7");
    assert.equal(transactionInserts[0].params[1], "12");
    assert.equal(transactionInserts[0].params[2], payload.idempotency_key);
    assert.equal(transactionInserts[0].params[9], payload.description);
    assert.equal(detailInserts[0].params[1], "500");
    assert.equal(detailInserts[0].params[2], payload.details[0].detail_id);
    assert.deepEqual(JSON.parse(detailInserts[1].params[9]), {
        channel: "web",
    });
});

test("una idempotency_key existente devuelve el movimiento sin insertar", async () => {
    const client = createMockClient({
        existingTransaction: { id: "88" },
        existingDetails: [
            {
                id: "90",
                client_detail_id: "123e4567-e89b-12d3-a456-426614174000",
            },
        ],
    });

    const result = await ingestMovement(client, makePayload());

    assert.deepEqual(result, {
        transaction_id: "88",
        idempotent_replay: true,
        details: [
            {
                id: "90",
                client_detail_id: "123e4567-e89b-12d3-a456-426614174000",
            },
        ],
    });

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
    );
    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transaction_details')
        ),
        false
    );
});

test("rechaza una cuenta bancaria que no pertenece a la empresa", async () => {
    const client = createMockClient({ bankAccount: null });

    await assert.rejects(
        ingestMovement(client, makePayload()),
        /no existe, está inactiva o no pertenece a la empresa/
    );

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
    );
});

test("rechaza una moneda no permitida por la cuenta bancaria", async () => {
    const client = createMockClient({
        bankAccount: {
            currency_policy: {
                allowed_currencies: ["COP"],
            },
        },
    });

    await assert.rejects(
        ingestMovement(
            client,
            makePayload({
                details: [makeDetail({ currency: "USD" })],
            })
        ),
        /no está permitida/
    );

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
    );
});

test("rechaza un documento que no pertenece a la empresa", async () => {
    const client = createMockClient({ documentExists: false });

    await assert.rejects(
        ingestMovement(client, makePayload()),
        /documento de origen no existe o no pertenece/
    );

    const documentQuery = client.calls.find(({ sql }) =>
        sql.startsWith('SELECT id FROM "Ecosystem".documents')
    );

    assert.deepEqual(documentQuery.params, ["200", "7"]);
});

test("rechaza una cuenta contable que no pertenece a la empresa", async () => {
    const client = createMockClient({ accountIds: [] });

    await assert.rejects(
        ingestMovement(
            client,
            makePayload({
                details: [makeDetail({ account_id: "901" })],
            })
        ),
        /cuenta contable 901 no existe o no pertenece a la empresa/
    );

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
    );
});

test("traduce un error de unicidad del detalle a un mensaje legible", async () => {
    const client = createMockClient({ failOnDetailInsert: true });

    await assert.rejects(
        ingestMovement(client, makePayload()),
        (error) => {
            assert.equal(error.statusCode, 409);
            assert.match(error.message, /ya existe para esta empresa/);
            return true;
        }
    );
});

test("devuelve los saldos de cada moneda por separado", async () => {
    const rows = [
        {
            bank_account_id: "12",
            currency: "COP",
            total_in: "100000",
            total_out: "25000",
            balance: "75000",
            detail_count: "2",
            last_movement_at: "2026-11-17T12:00:00.000Z",
        },
        {
            bank_account_id: "12",
            currency: "USD",
            total_in: "50",
            total_out: "10",
            balance: "40",
            detail_count: "2",
            last_movement_at: "2026-11-17T12:00:00.000Z",
        },
    ];
    const client = createMockClient({ balanceRows: rows });

    const result = await getAccountBalance(client, {
        company_id: "7",
        bank_account_id: "12",
    });

    assert.deepEqual(result, rows);
    assert.deepEqual(result.map((balance) => balance.currency), ["COP", "USD"]);

    const balanceQuery = client.calls.find(({ sql }) =>
        sql.includes('FROM "Treasury".bank_account_balances')
    );

    assert.deepEqual(balanceQuery.params, ["7", "12"]);
    assert.match(balanceQuery.sql, /company_id = \$1/);
    assert.match(balanceQuery.sql, /bank_account_id = \$2/);
});

test("devuelve lista vacía si la cuenta no tiene movimientos", async () => {
    const client = createMockClient();

    const result = await getAccountBalance(client, {
        company_id: "7",
        bank_account_id: "12",
    });

    assert.deepEqual(result, []);
});

test("rechaza identificadores inválidos antes de consultar el saldo", async () => {
    const client = createMockClient();

    await assert.rejects(
        getAccountBalance(client, {
            company_id: "7",
            bank_account_id: "abc",
        }),
        /bank_account_id debe ser un identificador válido/
    );

    assert.equal(client.calls.length, 0);
});

test("requiere un cliente válido para consultar el saldo", async () => {
    await assert.rejects(
        getAccountBalance(null, {
            company_id: "7",
            bank_account_id: "12",
        }),
        /cliente válido de base de datos/
    );
});