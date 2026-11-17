const INSTITUTION_PARAMETRIZATION_FIELDS = [
    "countries",
    "logo_url",
    "available_franchises",
    "operating_currencies",
];

function validateClient(client) {
    if (!client || typeof client.query !== "function") {
        throw new Error("Se requiere un cliente de base de datos válido.");
    }
}

function validateDatabaseId(value, label) {
    if (
        value === undefined ||
        value === null ||
        !/^[1-9]\d*$/.test(String(value))
    ) {
        throw new Error(`El identificador de ${label} no es válido.`);
    }
}

function getJsonObject(value, label) {
    if (value === undefined || value === null || value === "") {
        return {};
    }

    let parsed = value;

    if (typeof value === "string") {
        try {
            parsed = JSON.parse(value);
        } catch {
            throw new Error(`${label} debe contener un JSON válido.`);
        }
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        throw new Error(`${label} debe ser un objeto JSON.`);
    }

    return { ...parsed };
}

function mapInstitution(row) {
    const parametrization = getJsonObject(
        row.parametrization,
        "La parametrización de la institución"
    );

    return {
        institution_id: String(row.id),
        code: row.code,
        name: row.name,
        countries: Array.isArray(parametrization.countries)
            ? parametrization.countries
            : row.country_code
                ? [row.country_code]
                : [],
        logo_url: parametrization.logo_url ?? null,
        available_franchises: Array.isArray(
            parametrization.available_franchises
        )
            ? parametrization.available_franchises
            : [],
        operating_currencies: Array.isArray(
            parametrization.operating_currencies
        )
            ? parametrization.operating_currencies
            : [],
        scope: row.scope,
        status: row.is_active ? "active" : "inactive",
        parametrization,
    };
}

function mapBank(row) {
    return {
        bank_id: String(row.id),
        company_id: String(row.company_id),
        institution_id: String(row.institution_id),
        alias: row.name,
        account_id: null,
        defaults: getJsonObject(
            row.defaults,
            "La parametrización predeterminada del banco"
        ),
        status: row.is_active ? "active" : "inactive",
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function mapBankAccount(row) {
    const storedOverrides = getJsonObject(
        row.overrides,
        "Los overrides de la cuenta"
    );

    const { inheritance } = resolveAccountParametrization({
        accountOverrides: storedOverrides,
    });

    return {
        bank_account_id: String(row.id),
        bank_id: String(row.bank_id),
        account_number: row.account_number,
        account_id: String(row.account_id),
        currency_policy: getJsonObject(
            row.currency_policy,
            "La política de moneda de la cuenta"
        ),
        inheritance,
        status: row.is_active ? "active" : "inactive",
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function isPlainObject(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function mergeParametrizations(...layers) {
    const result = {};

    for (const layer of layers) {
        if (!isPlainObject(layer)) {
            throw new Error(
                "Cada nivel de parametrización debe ser un objeto."
            );
        }

        for (const [key, value] of Object.entries(layer)) {
            if (isPlainObject(value) && isPlainObject(result[key])) {
                result[key] = mergeParametrizations(result[key], value);
            } else if (isPlainObject(value)) {
                result[key] = mergeParametrizations(value);
            } else if (Array.isArray(value)) {
                result[key] = [...value];
            } else {
                result[key] = value;
            }
        }
    }

    return result;
}

function normalizeCurrencyList(value, label) {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error(`${label} debe contener al menos una moneda.`);
    }

    const currencies = value.map(currency => {
        if (typeof currency !== "string" || !currency.trim()) {
            throw new Error(`${label} contiene una moneda no válida.`);
        }

        return currency.trim().toUpperCase();
    });

    return [...new Set(currencies)];
}

function normalizeAccountInheritance(info) {
    const source = getJsonObject(
        info.inheritance ?? info.overrides,
        "La herencia de la cuenta"
    );

    const inheritanceFlag = source.inherits_from_bank;

    if (
        inheritanceFlag !== undefined &&
        typeof inheritanceFlag !== "boolean"
    ) {
        throw new Error("inherits_from_bank debe ser verdadero o falso.");
    }

    const inheritsFromBank = inheritanceFlag ?? true;
    const overrides = source.overrides !== undefined
        ? getJsonObject(source.overrides, "Los overrides de la cuenta")
        : { ...source };

    delete overrides.inherits_from_bank;
    delete overrides.overrides;

    return {
        inherits_from_bank: inheritsFromBank,
        overrides,
    };
}

export async function listInstitutions(client, info) {
    validateClient(client);
    validateDatabaseId(info?.company_id, "la empresa");

    const result = await client.query(
        `
            SELECT
                id,
                scope,
                company_id,
                code,
                name,
                country_code,
                parametrization,
                is_active
            FROM "Treasury".bank_institutions
            WHERE is_active = TRUE
              AND (
                    scope = 'erp_global'
                    OR (
                        scope = 'company_private'
                        AND company_id = $1
                    )
              )
            ORDER BY name ASC;
        `,
        [info.company_id]
    );

    return result.rows.map(mapInstitution);
}

export async function createInstitution(client, info) {
    validateClient(client);
    validateDatabaseId(info?.company_id, "la empresa");

    const code = String(info.code ?? "").trim();
    const name = String(info.name ?? "").trim();

    if (!code || !name) {
        throw new Error(
            "El código y el nombre de la institución son obligatorios."
        );
    }

    const parametrization = getJsonObject(
        info.parametrization,
        "La parametrización de la institución"
    );

    for (const field of INSTITUTION_PARAMETRIZATION_FIELDS) {
        if (info[field] !== undefined) {
            parametrization[field] = info[field];
        }
    }

    for (const field of [
        "countries",
        "available_franchises",
        "operating_currencies",
    ]) {
        if (
            parametrization[field] !== undefined &&
            !Array.isArray(parametrization[field])
        ) {
            throw new Error(`El campo "${field}" debe ser una lista.`);
        }
    }

    if (
        !Array.isArray(parametrization.countries) ||
        parametrization.countries.length === 0
    ) {
        throw new Error("La institución debe tener al menos un país.");
    }

    if (
        !Array.isArray(parametrization.operating_currencies) ||
        parametrization.operating_currencies.length === 0
    ) {
        throw new Error(
            "La institución debe tener al menos una moneda de operación."
        );
    }

    const countryCode = info.country_code
        ? String(info.country_code).trim().toUpperCase()
        : String(parametrization.countries[0]).trim().toUpperCase();

    try {
        const result = await client.query(
            `
                INSERT INTO "Treasury".bank_institutions (
                    scope,
                    company_id,
                    code,
                    name,
                    country_code,
                    parametrization
                )
                VALUES (
                    'company_private',
                    $1,
                    $2,
                    $3,
                    $4,
                    $5::jsonb
                )
                RETURNING
                    id,
                    scope,
                    company_id,
                    code,
                    name,
                    country_code,
                    parametrization,
                    is_active;
            `,
            [
                info.company_id,
                code,
                name,
                countryCode,
                JSON.stringify(parametrization),
            ]
        );

        return mapInstitution(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            throw new Error(
                "Ya existe una institución con ese código para esta empresa."
            );
        }

        if (error.code === "23503") {
            throw new Error("La empresa indicada no existe o no es válida.");
        }

        if (error.code === "23514") {
            throw new Error(
                "Los datos de la institución no cumplen las reglas requeridas."
            );
        }

        throw error;
    }
}

export async function listBanks(client, info) {
    validateClient(client);
    validateDatabaseId(info?.company_id, "la empresa");

    const result = await client.query(
        `
            SELECT
                id,
                company_id,
                institution_id,
                name,
                defaults,
                is_active,
                created_at,
                updated_at
            FROM "Treasury".banks
            WHERE company_id = $1
            ORDER BY name ASC;
        `,
        [info.company_id]
    );

    return result.rows.map(mapBank);
}

export async function createBank(client, info) {
    validateClient(client);
    validateDatabaseId(info?.company_id, "la empresa");
    validateDatabaseId(info?.institution_id, "la institución");

    const alias = String(info.alias ?? info.name ?? "").trim();

    if (!alias) {
        throw new Error("El alias del banco es obligatorio.");
    }

    if (info.account_id !== undefined && info.account_id !== null) {
        throw new Error(
            "El banco no puede tener una cuenta contable asociada."
        );
    }

    const defaults = getJsonObject(
        info.defaults,
        "La parametrización predeterminada del banco"
    );

    const institutionResult = await client.query(
        `
            SELECT id
            FROM "Treasury".bank_institutions
            WHERE id = $1
              AND is_active = TRUE
              AND (
                    scope = 'erp_global'
                    OR (
                        scope = 'company_private'
                        AND company_id = $2
                    )
              );
        `,
        [info.institution_id, info.company_id]
    );

    if (institutionResult.rows.length === 0) {
        throw new Error(
            "La institución no está activa o no está disponible para esta empresa."
        );
    }

    try {
        const result = await client.query(
            `
                INSERT INTO "Treasury".banks (
                    company_id,
                    institution_id,
                    name,
                    defaults
                )
                VALUES ($1, $2, $3, $4::jsonb)
                RETURNING
                    id,
                    company_id,
                    institution_id,
                    name,
                    defaults,
                    is_active,
                    created_at,
                    updated_at;
            `,
            [
                info.company_id,
                info.institution_id,
                alias,
                JSON.stringify(defaults),
            ]
        );

        return mapBank(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            throw new Error(
                "Ya existe un banco con ese alias para esta institución y empresa."
            );
        }

        if (error.code === "23503") {
            throw new Error(
                "La empresa o institución indicada no existe o no es válida."
            );
        }

        if (
            error.code === "P0001" &&
            error.message?.includes("pertenece a otra empresa")
        ) {
            throw new Error(
                "La institución seleccionada pertenece a otra empresa."
            );
        }

        if (error.code === "23514") {
            throw new Error(
                "Los datos del banco no cumplen las reglas requeridas."
            );
        }

        throw error;
    }
}

export async function listAccounts(client, info) {
    validateClient(client);
    validateDatabaseId(info?.company_id, "la empresa");
    validateDatabaseId(info?.bank_id, "el banco");

    const result = await client.query(
        `
            SELECT
                id,
                company_id,
                bank_id,
                account_number,
                account_id,
                currency_policy,
                overrides,
                is_active,
                created_at,
                updated_at
            FROM "Treasury".bank_accounts
            WHERE company_id = $1
              AND bank_id = $2
            ORDER BY account_number ASC;
        `,
        [info.company_id, info.bank_id]
    );

    return result.rows.map(mapBankAccount);
}

export async function createAccount(client, info) {
    validateClient(client);
    validateDatabaseId(info?.company_id, "la empresa");
    validateDatabaseId(info?.bank_id, "el banco");
    validateDatabaseId(info?.account_id, "la cuenta contable");

    const accountNumber = String(info.account_number ?? "").trim();

    if (!accountNumber) {
        throw new Error("El número de cuenta bancaria es obligatorio.");
    }

    const currencyPolicy = getJsonObject(
        info.currency_policy,
        "La política de moneda de la cuenta"
    );

    const allowedCurrencies = normalizeCurrencyList(
        currencyPolicy.allowed_currencies,
        "allowed_currencies"
    );

    if (
        typeof currencyPolicy.primary_currency !== "string" ||
        !currencyPolicy.primary_currency.trim()
    ) {
        throw new Error("La moneda principal de la cuenta es obligatoria.");
    }

    const primaryCurrency = currencyPolicy.primary_currency
        .trim()
        .toUpperCase();

    if (!allowedCurrencies.includes(primaryCurrency)) {
        throw new Error(
            "La moneda principal debe estar incluida en las monedas permitidas."
        );
    }

    const normalizedCurrencyPolicy = {
        ...currencyPolicy,
        allowed_currencies: allowedCurrencies,
        primary_currency: primaryCurrency,
    };

    const bankResult = await client.query(
        `
            SELECT
                b.id,
                b.defaults,
                bi.parametrization AS institution_parametrization
            FROM "Treasury".banks AS b
            INNER JOIN "Treasury".bank_institutions AS bi
                ON bi.id = b.institution_id
            WHERE b.id = $1
              AND b.company_id = $2
              AND b.is_active = TRUE
              AND bi.is_active = TRUE
              AND (
                    bi.scope = 'erp_global'
                    OR (
                        bi.scope = 'company_private'
                        AND bi.company_id = $2
                    )
              );
        `,
        [info.bank_id, info.company_id]
    );

    const bank = bankResult.rows[0];

    if (!bank) {
        throw new Error(
            "El banco no existe, está inactivo o no pertenece a esta empresa."
        );
    }

    const bankDefaults = getJsonObject(
        bank.defaults,
        "La parametrización predeterminada del banco"
    );
    const institutionParametrization = getJsonObject(
        bank.institution_parametrization,
        "La parametrización de la institución"
    );

    const institutionCurrencies =
        institutionParametrization.operating_currencies;

    if (
        !Array.isArray(institutionCurrencies) ||
        institutionCurrencies.length === 0
    ) {
        throw new Error(
            "La institución no tiene monedas de operación configuradas."
        );
    }

    const normalizedInstitutionCurrencies = institutionCurrencies.map(
        currency => String(currency).trim().toUpperCase()
    );

    const bankAllowedCurrencies = bankDefaults.allowed_currencies;

    if (
        bankAllowedCurrencies !== undefined &&
        !Array.isArray(bankAllowedCurrencies)
    ) {
        throw new Error(
            "Las monedas permitidas en los defaults del banco deben ser una lista."
        );
    }

    const normalizedBankCurrencies = Array.isArray(bankAllowedCurrencies)
        ? bankAllowedCurrencies.map(currency =>
            String(currency).trim().toUpperCase()
        )
        : null;

    const unsupportedCurrencies = allowedCurrencies.filter(currency =>
        !normalizedInstitutionCurrencies.includes(currency) ||
        (
            normalizedBankCurrencies !== null &&
            !normalizedBankCurrencies.includes(currency)
        )
    );

    if (unsupportedCurrencies.length > 0) {
        throw new Error(
            `La política incluye monedas no permitidas por la institución o el banco: ${unsupportedCurrencies.join(", ")}.`
        );
    }

    const ledgerAccountResult = await client.query(
        `
            SELECT id
            FROM "Ecosystem".contable_accounts
            WHERE id = $1
              AND company_id = $2
            LIMIT 1;
        `,
        [info.account_id, info.company_id]
    );

    if (ledgerAccountResult.rows.length === 0) {
        throw new Error(
            "La cuenta contable no existe o no pertenece a esta empresa."
        );
    }

    const inheritance = normalizeAccountInheritance(info);
    const storedOverrides = {
        inherits_from_bank: inheritance.inherits_from_bank,
        overrides: inheritance.overrides,
    };

    try {
        const result = await client.query(
            `
                INSERT INTO "Treasury".bank_accounts (
                    company_id,
                    bank_id,
                    account_number,
                    account_id,
                    currency_policy,
                    overrides
                )
                VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
                RETURNING
                    id,
                    company_id,
                    bank_id,
                    account_number,
                    account_id,
                    currency_policy,
                    overrides,
                    is_active,
                    created_at,
                    updated_at;
            `,
            [
                info.company_id,
                info.bank_id,
                accountNumber,
                info.account_id,
                JSON.stringify(normalizedCurrencyPolicy),
                JSON.stringify(storedOverrides),
            ]
        );

        return mapBankAccount(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            throw new Error(
                "Ya existe una cuenta con ese número para este banco."
            );
        }

        if (error.code === "23503") {
            throw new Error(
                "El banco, la empresa o la cuenta contable indicada no existe o no es válida."
            );
        }

        if (
            error.code === "P0001" &&
            error.message?.includes("no pertenece a la empresa")
        ) {
            throw new Error(
                "La cuenta contable seleccionada pertenece a otra empresa."
            );
        }

        if (error.code === "23514") {
            throw new Error(
                "Los datos de la cuenta bancaria no cumplen las reglas requeridas."
            );
        }

        throw error;
    }
}

export function resolveAccountParametrization({
    universal = {},
    institutionParametrization = {},
    bankDefaults = {},
    accountOverrides = {},
} = {}) {
    const storedOverrides = getJsonObject(
        accountOverrides,
        "Los overrides de la cuenta"
    );

    const inheritanceFlag = storedOverrides.inherits_from_bank;

    if (
        inheritanceFlag !== undefined &&
        typeof inheritanceFlag !== "boolean"
    ) {
        throw new Error("inherits_from_bank debe ser verdadero o falso.");
    }

    const inheritsFromBank = inheritanceFlag ?? true;
    const flatOverrides = { ...storedOverrides };

    delete flatOverrides.inherits_from_bank;

    const nestedOverrides = flatOverrides.overrides;

    delete flatOverrides.overrides;

    const overrides = nestedOverrides === undefined
        ? flatOverrides
        : getJsonObject(nestedOverrides, "Los overrides de la cuenta");

    const effectiveParametrization = mergeParametrizations(
        getJsonObject(universal, "La parametrización universal"),
        getJsonObject(
            institutionParametrization,
            "La parametrización de la institución"
        ),
        ...(inheritsFromBank
            ? [getJsonObject(bankDefaults, "Los defaults del banco")]
            : []),
        overrides
    );

    return {
        effective_parametrization: effectiveParametrization,
        inheritance: {
            inherits_from_bank: inheritsFromBank,
            overrides,
        },
    };
}