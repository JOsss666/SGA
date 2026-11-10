import test from "node:test";
import assert from "node:assert/strict";
import {
    listInstitutions,
    createInstitution,
} from "../../services/banksService.js";

const row = (id, scope, companyId, overrides = {}) => ({
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

test("lista instituciones globales y privadas de la empresa solicitada", async () => {
    const calls = [];

    const client = {
        async query(sql, values) {
            calls.push({ sql, values });

            const companyId = String(values[0]);

            return {
                rows: [
                    row(1, "erp_global", null),
                    row(2, "company_private", companyId),
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

test("la consulta de cada empresa usa su propio company_id", async () => {
    const requestedCompanyIds = [];

    const client = {
        async query(_sql, values) {
            requestedCompanyIds.push(values[0]);

            return {
                rows: [
                    row(1, "erp_global", null),
                    row(
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
                    row(10, "company_private", "7", {
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

test("traduce el error de código duplicado a un mensaje legible", async () => {
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