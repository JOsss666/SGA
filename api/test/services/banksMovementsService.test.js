import test from "node:test";
import assert from "node:assert/strict";
import {
    getAccountBalance,
    getReports,
    ingestMovement,
    listMovements,
    normalizeCreateMovement,
    normalizeReverseMovement,
} from "../../services/banksMovementsService.js";

const ORIGINAL_DETAIL_ID = "123e4567-e89b-12d3-a456-426614174000";
const REVERSE_DETAIL_ID = "123e4567-e89b-12d3-a456-426614174001";

const makeDetail = (overrides = {}) => ({
    detail_id: ORIGINAL_DETAIL_ID,
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

const makeReversePayload = (overrides = {}) =>
    makePayload({
        idempotency_key: "reverse:venta:FV-00912:v1",
        operation: "reverse",
        description: "Reverso de factura FV-00912",
        details: [
            makeDetail({
                detail_id: REVERSE_DETAIL_ID,
                direction: "out",
                reverses_detail_id: ORIGINAL_DETAIL_ID,
            }),
        ],
        ...overrides,
    });

const makeOriginalDetail = (overrides = {}) => ({
    id: "300",
    client_detail_id: ORIGINAL_DETAIL_ID,
    currency: "COP",
    amount: "1000000",
    direction: "in",
    concept: "principal",
    account_id: null,
    already_reversed: false,
    ...overrides,
});

const createMockClient = (options = {}) => {
    const calls = [];
    let nextDetailId = 500;
    let nextAuditId = 900;

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
                normalizedSql.includes(
                    'FROM "Treasury".bank_transactions AS bt'
                ) &&
                normalizedSql.includes("AS business_date")
            ) {
                return {
                    rows: options.reportRows ?? [],
                };
            }

            if (
                normalizedSql.includes(
                    'FROM "Treasury".bank_transactions AS bt'
                )
            ) {
                return {
                    rows: options.movementRows ?? [],
                };
            }

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
                normalizedSql.includes(
                    'FROM "Treasury".bank_transaction_details AS original_detail'
                )
            ) {
                return {
                    rows: options.originalDetails ?? [
                        makeOriginalDetail(),
                    ],
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
                    rows:
                        options.documentExists === false
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
                            id: options.insertedTransactionId ?? "700",
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
                    error.constraint =
                        options.detailConstraint ??
                        "bank_transaction_details_client_detail_idx";
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
                normalizedSql.startsWith(
                    'INSERT INTO "Treasury".bank_audit'
                )
            ) {
                if (options.failOnAuditInsert) {
                    const error = new Error("invalid audit reference");
                    error.code = "23503";
                    throw error;
                }

                return {
                    rows: [{ id: String(nextAuditId++) }],
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

            throw new Error(
                `Consulta no simulada en el test: ${normalizedSql}`
            );
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
            client_detail_id: ORIGINAL_DETAIL_ID,
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

test("normaliza un reverse y conserva el UUID externo que referencia", () => {
    const result = normalizeReverseMovement(makeReversePayload());

    assert.equal(result.transaction.operation, "reverse");
    assert.equal(result.transaction.company_id, "7");
    assert.equal(result.transaction.bank_account_id, "12");
    assert.equal(result.details.length, 1);
    assert.equal(result.details[0].client_detail_id, REVERSE_DETAIL_ID);
    assert.equal(
        result.details[0].reverses_client_detail_id,
        ORIGINAL_DETAIL_ID
    );
    assert.equal(result.details[0].direction, "out");
});

test("rechaza un reverse sin el UUID del detalle original", () => {
    assert.throws(
        () =>
            normalizeReverseMovement(
                makeReversePayload({
                    details: [
                        makeDetail({
                            detail_id: REVERSE_DETAIL_ID,
                            direction: "out",
                            reverses_detail_id: null,
                        }),
                    ],
                })
            ),
        /reverses_detail_id es obligatorio/
    );
});

test("crea una transacción, sus detalles y una auditoría por detalle", async () => {
    const client = createMockClient();
    const payload = makePayload({
        details: [
            makeDetail(),
            makeDetail({
                detail_id: "123e4567-e89b-12d3-a456-426614174002",
                currency: "USD",
                amount: 25.5,
                direction: "out",
                concept: "comision",
                metadata: { channel: "web" },
            }),
        ],
    });

    const result = await ingestMovement(client, payload);

    assert.equal(result.transaction_id, "700");
    assert.equal(result.idempotent_replay, false);
    assert.equal(result.details.length, 2);

    const transactionInserts = client.calls.filter(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_transactions')
    );
    const detailInserts = client.calls.filter(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_transaction_details')
    );
    const auditInserts = client.calls.filter(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_audit')
    );

    assert.equal(transactionInserts.length, 1);
    assert.equal(detailInserts.length, 2);
    assert.equal(auditInserts.length, 2);

    assert.equal(transactionInserts[0].params[0], "7");
    assert.equal(transactionInserts[0].params[1], "12");
    assert.equal(transactionInserts[0].params[2], payload.idempotency_key);
    assert.equal(transactionInserts[0].params[9], payload.description);

    assert.equal(detailInserts[0].params[1], "700");
    assert.equal(detailInserts[0].params[2], payload.details[0].detail_id);
    assert.deepEqual(JSON.parse(detailInserts[1].params[9]), {
        channel: "web",
    });

    for (const audit of auditInserts) {
        assert.equal(audit.params[0], "7");
        assert.equal(audit.params[1], "700");
        assert.equal(audit.params[3], "87");
        assert.equal(audit.params[4], "create");
        assert.equal(audit.params[6], "2026-11-18T10:20:00.000Z");
    }

    assert.deepEqual(
        auditInserts.map(({ params }) => params[2]),
        ["500", "501"]
    );

    assert.equal(
        JSON.parse(auditInserts[0].params[5]).client_detail_id,
        payload.details[0].detail_id
    );
    assert.equal(
        JSON.parse(auditInserts[1].params[5]).client_detail_id,
        payload.details[1].detail_id
    );
});

test("una idempotency_key existente devuelve el movimiento sin insertar ni auditar", async () => {
    const client = createMockClient({
        existingTransaction: { id: "88" },
        existingDetails: [
            {
                id: "90",
                client_detail_id: ORIGINAL_DETAIL_ID,
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
                client_detail_id: ORIGINAL_DETAIL_ID,
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
    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_audit')
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

test("revierte los detalles, enlaza el original y audita la operación reverse", async () => {
    const client = createMockClient({
        originalDetails: [makeOriginalDetail({ id: "300" })],
    });

    const result = await ingestMovement(client, makeReversePayload());

    assert.equal(result.transaction_id, "700");
    assert.equal(result.idempotent_replay, false);
    assert.equal(result.details.length, 1);

    const transactionInsert = client.calls.find(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_transactions')
    );
    const detailInsert = client.calls.find(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_transaction_details')
    );
    const auditInsert = client.calls.find(({ sql }) =>
        sql.startsWith('INSERT INTO "Treasury".bank_audit')
    );

    assert.equal(transactionInsert.params[3], "reverse");
    assert.equal(transactionInsert.params[0], "7");
    assert.equal(transactionInsert.params[1], "12");

    assert.equal(detailInsert.params[1], "700");
    assert.equal(detailInsert.params[2], REVERSE_DETAIL_ID);
    assert.equal(detailInsert.params[3], "COP");
    assert.equal(detailInsert.params[4], "1000000");
    assert.equal(detailInsert.params[5], "out");
    assert.equal(detailInsert.params[8], "300");
    assert.equal(result.details[0].client_detail_id, REVERSE_DETAIL_ID);

    assert.ok(auditInsert);
    assert.equal(auditInsert.params[0], "7");
    assert.equal(auditInsert.params[1], "700");
    assert.equal(auditInsert.params[2], "500");
    assert.equal(auditInsert.params[3], "87");
    assert.equal(auditInsert.params[4], "reverse");
    assert.equal(auditInsert.params[6], "2026-11-18T10:20:00.000Z");

    const auditPayload = JSON.parse(auditInsert.params[5]);
    assert.equal(auditPayload.client_detail_id, REVERSE_DETAIL_ID);
    assert.equal(auditPayload.reverses_detail_id, "300");

    const originalQuery = client.calls.find(({ sql }) =>
        sql.includes(
            'FROM "Treasury".bank_transaction_details AS original_detail'
        )
    );

    assert.deepEqual(originalQuery.params, [
        "7",
        "12",
        [ORIGINAL_DETAIL_ID],
    ]);
});

test("rechaza el reverse si el detalle original no existe para la empresa y cuenta", async () => {
    const client = createMockClient({ originalDetails: [] });

    await assert.rejects(
        ingestMovement(client, makeReversePayload()),
        (error) => {
            assert.equal(error.statusCode, 404);
            assert.match(error.message, /detalles originales no existen/);
            return true;
        }
    );

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
    );
});

test("rechaza el reverse si el detalle original ya fue revertido", async () => {
    const client = createMockClient({
        originalDetails: [
            makeOriginalDetail({ already_reversed: true }),
        ],
    });

    await assert.rejects(
        ingestMovement(client, makeReversePayload()),
        (error) => {
            assert.equal(error.statusCode, 409);
            assert.match(error.message, /ya fue revertido/);
            return true;
        }
    );

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
    );
});

test("rechaza un reverse si la dirección no es opuesta a la original", async () => {
    const client = createMockClient({
        originalDetails: [makeOriginalDetail()],
    });

    await assert.rejects(
        ingestMovement(
            client,
            makeReversePayload({
                details: [
                    makeDetail({
                        detail_id: REVERSE_DETAIL_ID,
                        direction: "in",
                        reverses_detail_id: ORIGINAL_DETAIL_ID,
                    }),
                ],
            })
        ),
        /dirección del reverse debe ser opuesta/
    );

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
    );
});

test("rechaza un reverse si el monto no coincide con el detalle original", async () => {
    const client = createMockClient({
        originalDetails: [makeOriginalDetail()],
    });

    await assert.rejects(
        ingestMovement(
            client,
            makeReversePayload({
                details: [
                    makeDetail({
                        detail_id: REVERSE_DETAIL_ID,
                        direction: "out",
                        amount: 999,
                        reverses_detail_id: ORIGINAL_DETAIL_ID,
                    }),
                ],
            })
        ),
        /monto del reverse no coincide/
    );

    assert.equal(
        client.calls.some(({ sql }) =>
            sql.startsWith('INSERT INTO "Treasury".bank_transactions')
        ),
        false
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

test("lista movimientos de la cuenta filtrando por empresa", async () => {
    const rows = [
        {
            transaction_id: "700",
            company_id: "7",
            bank_account_id: "12",
            operation: "create",
            description: "Pago de factura",
            details: [
                {
                    id: "500",
                    detail_id: ORIGINAL_DETAIL_ID,
                    currency: "COP",
                    amount: "1000000",
                    direction: "in",
                },
            ],
        },
    ];
    const client = createMockClient({ movementRows: rows });

    const result = await listMovements(client, {
        company_id: "7",
        bank_account_id: "12",
    });

    assert.deepEqual(result, rows);

    const movementQuery = client.calls.find(({ sql }) =>
        sql.includes('FROM "Treasury".bank_transactions AS bt')
    );

    assert.ok(movementQuery);
    assert.deepEqual(movementQuery.params, ["7", "12"]);
    assert.match(movementQuery.sql, /bt\.company_id = \$1/);
    assert.match(movementQuery.sql, /bt\.bank_account_id = \$2/);
});

test("filtra movimientos por fechas UTC cuando se reciben", async () => {
    const client = createMockClient();

    await listMovements(client, {
        company_id: "7",
        bank_account_id: "12",
        start_date: "2026-11-01T00:00:00Z",
        end_date: "2026-11-20T00:00:00Z",
    });

    const movementQuery = client.calls.find(({ sql }) =>
        sql.includes('FROM "Treasury".bank_transactions AS bt')
    );

    assert.ok(movementQuery);
    assert.deepEqual(movementQuery.params, [
        "7",
        "12",
        "2026-11-01T00:00:00.000Z",
        "2026-11-20T00:00:00.000Z",
    ]);
    assert.match(movementQuery.sql, /bt\.created_at >= \$3/);
    assert.match(movementQuery.sql, /bt\.created_at < \$4/);
});

test("rechaza un rango de fechas inválido antes de consultar", async () => {
    const client = createMockClient();

    await assert.rejects(
        listMovements(client, {
            company_id: "7",
            bank_account_id: "12",
            start_date: "2026-11-20T00:00:00Z",
            end_date: "2026-11-20T00:00:00Z",
        }),
        /end_date debe ser posterior a start_date/
    );

    assert.equal(client.calls.length, 0);
});

test("rechaza un identificador inválido antes de consultar movimientos", async () => {
    const client = createMockClient();

    await assert.rejects(
        listMovements(client, {
            company_id: "7",
            bank_account_id: "abc",
        }),
        /bank_account_id debe ser un identificador válido/
    );

    assert.equal(client.calls.length, 0);
});

test("agrupa el informe por día comercial y moneda", async () => {
    const rows = [
        {
            bank_account_id: "12",
            business_date: "2026-11-19",
            currency: "COP",
            total_in: "1000000",
            total_out: "250000",
            net_total: "750000",
            transaction_count: 2,
            detail_count: 3,
        },
        {
            bank_account_id: "12",
            business_date: "2026-11-19",
            currency: "USD",
            total_in: "50",
            total_out: "10",
            net_total: "40",
            transaction_count: 1,
            detail_count: 1,
        },
    ];
    const client = createMockClient({ reportRows: rows });

    const result = await getReports(client, {
        company_id: "7",
        bank_account_id: "12",
    });

    assert.deepEqual(result, rows);

    const reportQuery = client.calls.find(({ sql }) =>
        sql.includes('FROM "Treasury".bank_transactions AS bt') &&
        sql.includes("AS business_date")
    );

    assert.ok(reportQuery);
    assert.deepEqual(reportQuery.params, ["7", "12"]);
    assert.match(reportQuery.sql, /bt\.company_id = \$1/);
    assert.match(reportQuery.sql, /business_date/);
    assert.match(reportQuery.sql, /currency/);
    assert.match(reportQuery.sql, /context->>'business_date'/);
    assert.match(reportQuery.sql, /context->>'time_zone'/);
    assert.doesNotMatch(reportQuery.sql, /created_at\s*::\s*date/i);
});

test("filtra el informe por rango de días comerciales", async () => {
    const client = createMockClient();

    await getReports(client, {
        company_id: "7",
        bank_account_id: "12",
        start_date: "2026-11-01",
        end_date: "2026-11-19",
    });

    const reportQuery = client.calls.find(({ sql }) =>
        sql.includes('FROM "Treasury".bank_transactions AS bt') &&
        sql.includes("AS business_date")
    );

    assert.ok(reportQuery);
    assert.deepEqual(reportQuery.params, [
        "7",
        "12",
        "2026-11-01",
        "2026-11-19",
    ]);
});

test("rechaza fechas inválidas del informe antes de consultar", async () => {
    const client = createMockClient();

    await assert.rejects(
        getReports(client, {
            company_id: "7",
            start_date: "2026-02-30",
        }),
        /start_date debe ser una fecha válida/
    );

    assert.equal(client.calls.length, 0);
});

test("requiere un cliente válido para consultar informes", async () => {
    await assert.rejects(
        getReports(null, {
            company_id: "7",
        }),
        /cliente válido de base de datos/
    );
});
test("acepta cuentas contables de la empresa o del plan compartido (company_id 0)", async () => {
    const client = createMockClient();

    await ingestMovement(
        client,
        makePayload({
            details: [makeDetail({ account_id: "901" })],
        })
    );

    const accountQuery = client.calls.find(({ sql }) =>
        sql.startsWith('SELECT id FROM "Ecosystem".contable_accounts')
    );

    assert.ok(accountQuery);
    assert.match(accountQuery.sql, /company_id IN \(0, \$1\)/);
});
