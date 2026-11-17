import test from "node:test";
import assert from "node:assert/strict";
import {
    listInstitutions,
    createInstitution,
    listBanks,
    createBank,
    listAccounts,
    createAccount,
    resolveAccountParametrization,
} from "../../services/banksService.js";

const institutionRow = (id, scope, companyId, overrides = {}) => ({
    id,
    scope,
    company_id: companyId,
    code: `BANK-${id}`,
    name: `Bank ${id}`,
    country_code: "CO",
    parametrization: {},
    is_active: true,
    ...overrides,
});

const bankRow = (id, companyId, institutionId, overrides = {}) => ({
    id,
    company_id: companyId,
    institution_id: institutionId,
    name: `Bank alias ${id}`,
    defaults: {},
    is_active: true,
    created_at: "2026-10-27T12:00:00.000Z",
    updated_at: "2026-10-27T12:00:00.000Z",
    ...overrides,
});

test("lista instituciones globales y privadas de la empresa solicitada", async () => {
    const calls = [];

    const client = {
        async query(sql, values) {
            calls.push({ sql, values });

            const companyId = String(values[0]);

            return {
                rows: [
                    institutionRow(1, "erp_global", null),
                    institutionRow(2, "company_private", companyId),
                ],
            };
        },
    };

    const result = await listInstitutions(client, { company_id: 7 });

    assert.deepEqual(calls[0].values, [7]);
    assert.match(calls[0].sql, /scope = 'erp_global'/);
    assert.match(
        calls[0].sql,
        /scope = 'company_private'\s+AND company_id = \$1/
    );
    assert.deepEqual(
        result.map(({ institution_id }) => institution_id),
        ["1", "2"]
    );
});

test("la consulta de instituciones usa el company_id recibido", async () => {
    const requestedCompanyIds = [];

    const client = {
        async query(_sql, values) {
            requestedCompanyIds.push(values[0]);

            return {
                rows: [
                    institutionRow(1, "erp_global", null),
                    institutionRow(
                        Number(values[0]) + 1,
                        "company_private",
                        String(values[0])
                    ),
                ],
            };
        },
    };

    const companyA = await listInstitutions(client, { company_id: 7 });
    const companyB = await listInstitutions(client, { company_id: 8 });

    assert.deepEqual(requestedCompanyIds, [7, 8]);
    assert.equal(companyA[1].institution_id, "8");
    assert.equal(companyB[1].institution_id, "9");
});

test("crea una institución privada y guarda los datos del contrato en parametrization", async () => {
    let captured;

    const client = {
        async query(sql, values) {
            captured = { sql, values };

            return {
                rows: [
                    institutionRow(10, "company_private", "7", {
                        code: "BANK-10",
                        name: "Banco de prueba",
                        parametrization: JSON.parse(values[4]),
                    }),
                ],
            };
        },
    };

    const result = await createInstitution(client, {
        company_id: 7,
        code: "BANK-10",
        name: "Banco de prueba",
        countries: ["CO"],
        logo_url: "https://example.com/logo.png",
        available_franchises: ["VISA"],
        operating_currencies: ["COP"],
    });

    assert.match(captured.sql, /'company_private'/);
    assert.deepEqual(captured.values.slice(0, 4), [
        7,
        "BANK-10",
        "Banco de prueba",
        "CO",
    ]);
    assert.deepEqual(JSON.parse(captured.values[4]), {
        countries: ["CO"],
        logo_url: "https://example.com/logo.png",
        available_franchises: ["VISA"],
        operating_currencies: ["COP"],
    });
    assert.equal(result.scope, "company_private");
    assert.equal(result.status, "active");
});

test("traduce el error de código duplicado de una institución", async () => {
    const client = {
        async query() {
            throw { code: "23505" };
        },
    };

    await assert.rejects(
        createInstitution(client, {
            company_id: 7,
            code: "BANK-10",
            name: "Banco de prueba",
            countries: ["CO"],
            operating_currencies: ["COP"],
        }),
        /Ya existe una institución/
    );
});

test("lista bancos filtrando por empresa y devuelve su estado", async () => {
    let captured;

    const client = {
        async query(sql, values) {
            captured = { sql, values };

            return {
                rows: [
                    bankRow(20, "7", 3, { name: "Operativo" }),
                    bankRow(21, "7", 4, {
                        name: "Antiguo",
                        is_active: false,
                    }),
                ],
            };
        },
    };

    const result = await listBanks(client, { company_id: 7 });

    assert.deepEqual(captured.values, [7]);
    assert.match(captured.sql, /WHERE company_id = \$1/);
    assert.deepEqual(
        result.map(({ bank_id, alias, status }) => ({
            bank_id,
            alias,
            status,
        })),
        [
            { bank_id: "20", alias: "Operativo", status: "active" },
            { bank_id: "21", alias: "Antiguo", status: "inactive" },
        ]
    );
});

test("crea un banco de la empresa sin guardar account_id", async () => {
    const calls = [];
    const defaults = {
        allowed_currencies: ["COP", "USD"],
        primary_currency: "COP",
    };

    const client = {
        async query(sql, values) {
            calls.push({ sql, values });

            if (sql.includes("SELECT id")) {
                return { rows: [{ id: 3 }] };
            }

            return {
                rows: [
                    bankRow(20, "7", "3", {
                        name: "Bancolombia operativo",
                        defaults: JSON.parse(values[3]),
                    }),
                ],
            };
        },
    };

    const result = await createBank(client, {
        company_id: 7,
        institution_id: 3,
        alias: "Bancolombia operativo",
        defaults,
    });

    assert.deepEqual(calls[0].values, [3, 7]);
    assert.match(calls[0].sql, /scope = 'erp_global'/);
    assert.match(calls[0].sql, /company_id = \$2/);
    assert.match(calls[1].sql, /INSERT INTO "Treasury"\.banks/);
    assert.doesNotMatch(calls[1].sql, /account_id/);
    assert.deepEqual(calls[1].values, [
        7,
        3,
        "Bancolombia operativo",
        JSON.stringify(defaults),
    ]);
    assert.equal(result.bank_id, "20");
    assert.equal(result.company_id, "7");
    assert.equal(result.institution_id, "3");
    assert.equal(result.alias, "Bancolombia operativo");
    assert.equal(result.account_id, null);
    assert.deepEqual(result.defaults, defaults);
});

test("rechaza una institución privada que pertenece a otra empresa", async () => {
    let queryCount = 0;

    const client = {
        async query() {
            queryCount += 1;
            return { rows: [] };
        },
    };

    await assert.rejects(
        createBank(client, {
            company_id: 7,
            institution_id: 3,
            alias: "Banco no autorizado",
            defaults: {},
        }),
        /no está activa o no está disponible para esta empresa/
    );

    assert.equal(queryCount, 1);
});

test("traduce el error de banco duplicado a un mensaje legible", async () => {
    const client = {
        async query(sql) {
            if (sql.includes("SELECT id")) {
                return { rows: [{ id: 3 }] };
            }

            throw { code: "23505" };
        },
    };

    await assert.rejects(
        createBank(client, {
            company_id: 7,
            institution_id: 3,
            alias: "Bancolombia operativo",
            defaults: {},
        }),
        /Ya existe un banco con ese alias/
    );
});

test("resuelve la herencia cuando la cuenta no tiene overrides", () => {
    const result = resolveAccountParametrization({
        universal: {
            currency: "COP",
            rules: { audit: true, limit: 100 },
        },
        institutionParametrization: {
            rules: { limit: 200 },
        },
        bankDefaults: {
            enabled_documents: ["venta", "compra"],
            rules: { limit: 300 },
        },
        accountOverrides: {
            inherits_from_bank: true,
        },
    });

    assert.deepEqual(result.effective_parametrization, {
        currency: "COP",
        rules: { audit: true, limit: 300 },
        enabled_documents: ["venta", "compra"],
    });
    assert.deepEqual(result.inheritance, {
        inherits_from_bank: true,
        overrides: {},
    });
});

test("los overrides de cuenta prevalecen y combinan claves anidadas", () => {
    const result = resolveAccountParametrization({
        universal: {
            rules: { audit: true, limit: 100 },
        },
        institutionParametrization: {
            rules: { limit: 200, notifications: true },
        },
        bankDefaults: {
            enabled_documents: ["venta", "compra"],
            rules: { limit: 300 },
        },
        accountOverrides: {
            inherits_from_bank: true,
            overrides: {
                enabled_documents: ["venta"],
                rules: { limit: 50 },
            },
        },
    });

    assert.deepEqual(result.effective_parametrization, {
        rules: { audit: true, limit: 50, notifications: true },
        enabled_documents: ["venta"],
    });
    assert.deepEqual(result.inheritance, {
        inherits_from_bank: true,
        overrides: {
            enabled_documents: ["venta"],
            rules: { limit: 50 },
        },
    });
});

test("no aplica los defaults del banco si inherits_from_bank es false", () => {
    const result = resolveAccountParametrization({
        universal: { currency: "COP" },
        institutionParametrization: { logo: "bank.png" },
        bankDefaults: { enabled_documents: ["venta"] },
        accountOverrides: {
            inherits_from_bank: false,
            enabled_documents: ["compra"],
        },
    });

    assert.deepEqual(result.effective_parametrization, {
        currency: "COP",
        logo: "bank.png",
        enabled_documents: ["compra"],
    });
    assert.deepEqual(result.inheritance, {
        inherits_from_bank: false,
        overrides: {
            enabled_documents: ["compra"],
        },
    });
});

test("lista cuentas filtrando por empresa y banco", async () => {
    let captured;

    const client = {
        async query(sql, values) {
            captured = { sql, values };

            return {
                rows: [
                    {
                        id: 12,
                        company_id: "7",
                        bank_id: "4",
                        account_number: "123-456",
                        account_id: "55",
                        currency_policy: {
                            allowed_currencies: ["COP"],
                            primary_currency: "COP",
                        },
                        overrides: {
                            inherits_from_bank: true,
                            overrides: {
                                enabled_documents: ["venta"],
                            },
                        },
                        is_active: true,
                        created_at: "2026-10-27T12:00:00.000Z",
                        updated_at: "2026-10-27T12:00:00.000Z",
                    },
                ],
            };
        },
    };

    const result = await listAccounts(client, {
        company_id: 7,
        bank_id: 4,
    });

    assert.deepEqual(captured.values, [7, 4]);
    assert.match(
        captured.sql,
        /WHERE company_id = \$1\s+AND bank_id = \$2/
    );
    assert.equal(result[0].bank_account_id, "12");
    assert.equal(result[0].account_id, "55");
    assert.deepEqual(result[0].inheritance, {
        inherits_from_bank: true,
        overrides: { enabled_documents: ["venta"] },
    });
});

test("crea una cuenta con su puente contable, moneda y herencia", async () => {
    const calls = [];
    const defaults = { allowed_currencies: ["COP", "USD"] };
    const currencyPolicy = {
        allowed_currencies: ["COP"],
        primary_currency: "COP",
    };
    const inheritance = {
        inherits_from_bank: true,
        overrides: { enabled_documents: ["venta"] },
    };

    const client = {
        async query(sql, values) {
            calls.push({ sql, values });

            if (sql.includes('FROM "Treasury".banks AS b')) {
                return {
                    rows: [
                        {
                            id: 4,
                            defaults,
                            institution_parametrization: {
                                operating_currencies: ["COP", "USD"],
                            },
                        },
                    ],
                };
            }

            if (sql.includes('"Ecosystem".contable_accounts')) {
                return { rows: [{ id: 55 }] };
            }

            return {
                rows: [
                    {
                        id: 12,
                        company_id: "7",
                        bank_id: "4",
                        account_number: "123-456",
                        account_id: "55",
                        currency_policy: JSON.parse(values[4]),
                        overrides: JSON.parse(values[5]),
                        is_active: true,
                        created_at: "2026-10-27T12:00:00.000Z",
                        updated_at: "2026-10-27T12:00:00.000Z",
                    },
                ],
            };
        },
    };

    const result = await createAccount(client, {
        company_id: 7,
        bank_id: 4,
        account_number: "123-456",
        account_id: 55,
        currency_policy: currencyPolicy,
        inheritance,
    });

    const insertCall = calls.at(-1);

    assert.match(
        insertCall.sql,
        /INSERT INTO "Treasury"\.bank_accounts/
    );
    assert.deepEqual(insertCall.values.slice(0, 4), [
        7,
        4,
        "123-456",
        55,
    ]);
    assert.deepEqual(JSON.parse(insertCall.values[4]), currencyPolicy);
    assert.deepEqual(JSON.parse(insertCall.values[5]), inheritance);
    assert.equal(result.bank_account_id, "12");
    assert.equal(result.account_id, "55");
    assert.deepEqual(result.inheritance, inheritance);
});

test("rechaza una cuenta contable que no pertenece a la empresa", async () => {
    let insertAttempted = false;

    const client = {
        async query(sql) {
            if (sql.includes('FROM "Treasury".banks AS b')) {
                return {
                    rows: [
                        {
                            id: 4,
                            defaults: { allowed_currencies: ["COP"] },
                            institution_parametrization: {
                                operating_currencies: ["COP"],
                            },
                        },
                    ],
                };
            }

            if (sql.includes('"Ecosystem".contable_accounts')) {
                return { rows: [] };
            }

            insertAttempted = true;
            return { rows: [] };
        },
    };

    await assert.rejects(
        createAccount(client, {
            company_id: 7,
            bank_id: 4,
            account_number: "123-456",
            account_id: 55,
            currency_policy: {
                allowed_currencies: ["COP"],
                primary_currency: "COP",
            },
        }),
        /no existe o no pertenece a esta empresa/
    );

    assert.equal(insertAttempted, false);
});

test("rechaza monedas no permitidas por la institución o el banco", async () => {
    const client = {
        async query() {
            return {
                rows: [
                    {
                        id: 4,
                        defaults: { allowed_currencies: ["COP"] },
                        institution_parametrization: {
                            operating_currencies: ["COP"],
                        },
                    },
                ],
            };
        },
    };

    await assert.rejects(
        createAccount(client, {
            company_id: 7,
            bank_id: 4,
            account_number: "123-456",
            account_id: 55,
            currency_policy: {
                allowed_currencies: ["USD"],
                primary_currency: "USD",
            },
        }),
        /monedas no permitidas/
    );
});