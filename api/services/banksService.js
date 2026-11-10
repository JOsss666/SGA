const PARAMETRIZATION_FIELDS = [
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

function validateCompanyId(companyId) {
    if (companyId === undefined || companyId === null || companyId === "") {
        throw new Error("Se requiere el identificador de la empresa.");
    }
}

function getParametrization(value) {
    if (value === undefined || value === null || value === "") {
        return {};
    }

    let parsed = value;

    if (typeof value === "string") {
        try {
            parsed = JSON.parse(value);
        } catch {
            throw new Error("La parametrización debe contener un JSON válido.");
        }
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        throw new Error("La parametrización debe ser un objeto JSON.");
    }

    return { ...parsed };
}

function mapInstitution(row) {
    const parametrization = getParametrization(row.parametrization);

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
        available_franchises: Array.isArray(parametrization.available_franchises)
            ? parametrization.available_franchises
            : [],
        operating_currencies: Array.isArray(parametrization.operating_currencies)
            ? parametrization.operating_currencies
            : [],
        scope: row.scope,
        status: row.is_active ? "active" : "inactive",
        parametrization,
    };
}

export async function listInstitutions(client, info) {
    validateClient(client);
    validateCompanyId(info?.company_id);

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
    validateCompanyId(info?.company_id);

    const code = String(info.code ?? "").trim();
    const name = String(info.name ?? "").trim();

    if (!code || !name) {
        throw new Error("El código y el nombre de la institución son obligatorios.");
    }

    const parametrization = getParametrization(info.parametrization);

    for (const field of PARAMETRIZATION_FIELDS) {
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

    const countries = parametrization.countries;
    const countryCode = info.country_code
        ? String(info.country_code).trim().toUpperCase()
        : String(countries[0]).trim().toUpperCase();

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