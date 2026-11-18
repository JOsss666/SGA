import test from "node:test";
import assert from "node:assert/strict";
import { registerMovementAudit } from "../../services/banksAuditService.js";

const makeAuditInfo = (overrides = {}) => ({
    company_id: "7",
    transaction_id: "700",
    actor_user_id: "87",
    operation: "create",
    created_at: "2026-11-18T10:20:00.000Z",
    details: [
        {
            id: "501",
            client_detail_id: "123e4567-e89b-12d3-a456-426614174000",
            currency: "COP",
            amount: "1000000",
            direction: "in",
            concept: "principal",
            account_id: null,
            reverses_detail_id: null,
            metadata: {},
        },
    ],
    ...overrides,
});

const makeClient = ({ error } = {}) => {
    const calls = [];

    return {
        calls,

        async query(sql, params) {
            calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });

            if (error) {
                throw error;
            }

            return {
                rows: [{ id: String(900 + calls.length) }],
            };
        },
    };
};

test("registra una fila de auditoría por cada detalle de la operación", async () => {
    const client = makeClient();
    const info = makeAuditInfo({
        details: [
            makeAuditInfo().details[0],
            {
                id: "502",
                client_detail_id: "123e4567-e89b-12d3-a456-426614174001",
                currency: "USD",
                amount: "25.5",
                direction: "out",
                concept: "comision",
                account_id: "901",
                reverses_detail_id: null,
                metadata: { source: "test" },
            },
        ],
    });

    const result = await registerMovementAudit(client, info);

    assert.equal(client.calls.length, 2);
    assert.equal(result.length, 2);

    for (const call of client.calls) {
        assert.match(call.sql, /^INSERT INTO "Treasury"\.bank_audit/);
        assert.match(call.sql, /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6::jsonb, \$7\)/);
        assert.equal(call.params[0], "7");
        assert.equal(call.params[1], "700");
        assert.equal(call.params[3], "87");
        assert.equal(call.params[4], "create");
        assert.equal(call.params[6], "2026-11-18T10:20:00.000Z");
    }

    assert.equal(client.calls[0].params[2], "501");
    assert.equal(client.calls[1].params[2], "502");

    const firstPayload = JSON.parse(client.calls[0].params[5]);
    assert.equal(
        firstPayload.client_detail_id,
        "123e4567-e89b-12d3-a456-426614174000"
    );

    const secondPayload = JSON.parse(client.calls[1].params[5]);
    assert.deepEqual(secondPayload.metadata, { source: "test" });
});

test("registra el tipo reverse y enlaza el detalle interno", async () => {
    const client = makeClient();
    const info = makeAuditInfo({
        operation: "reverse",
        details: [
            {
                ...makeAuditInfo().details[0],
                id: "601",
                direction: "out",
                reverses_detail_id: "501",
            },
        ],
    });

    await registerMovementAudit(client, info);

    assert.equal(client.calls.length, 1);
    assert.equal(client.calls[0].params[2], "601");
    assert.equal(client.calls[0].params[4], "reverse");

    const payload = JSON.parse(client.calls[0].params[5]);
    assert.equal(payload.reverses_detail_id, "501");
});

test("rechaza una operación diferente de create o reverse", async () => {
    const client = makeClient();

    await assert.rejects(
        registerMovementAudit(
            client,
            makeAuditInfo({ operation: "update" })
        ),
        /operation debe ser create o reverse/
    );

    assert.equal(client.calls.length, 0);
});

test("traduce una referencia inválida de la base de datos", async () => {
    const databaseError = new Error("foreign key violation");
    databaseError.code = "23503";
    const client = makeClient({ error: databaseError });

    await assert.rejects(
        registerMovementAudit(client, makeAuditInfo()),
        (error) => {
            assert.equal(error.statusCode, 400);
            assert.match(error.message, /no existe o no coincide/);
            return true;
        }
    );
});

test("requiere un cliente válido", async () => {
    await assert.rejects(
        registerMovementAudit(null, makeAuditInfo()),
        /cliente válido de base de datos/
    );
});