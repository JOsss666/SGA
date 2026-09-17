import { encrypt, useDataBase } from '../app.js';
import utilsController from '../controllers/utilsController.js';
import nexo360Controller from '../controllers/custom-controllers/nexo360Controller.js';
import { createParameterDocumentService } from './parameterDocumentService.js';

const externalThirdPartyAccesService = {};

externalThirdPartyAccesService.registerParamDoc = async info => {
    const service = createParameterDocumentService({
        withTransaction: utilsController.withTransaction,
        registerDocument: utilsController.registerDocument,
        linkDocumentInstances: utilsController.linkDocumentInstances,
        actions: { createCaralNexo360Order: nexo360Controller.createCaralNexo360Order }
    });
    return service.register(info);
};

const asTrimmedString = (value) => typeof value === 'string' ? value.trim() : '';

const normalizeCredentials = (info = {}) => {
    const mail = asTrimmedString(info.mail).toLowerCase();
    const pass = typeof info.pass === 'string' ? info.pass : '';

    if (!mail || !pass.trim()) {
        const error = new Error('Correo y contraseña son obligatorios.');
        error.statusCode = 400;
        throw error;
    }

    return { mail, pass };
};

const normalizeAccessKey = (info = {}) => {
    const companyKey = asTrimmedString(info.company_key);
    const accessKey = asTrimmedString(info.access_key || info.user_key);

    if (!companyKey || !accessKey) {
        const error = new Error('La compañía y la clave de acceso son obligatorias.');
        error.statusCode = 400;
        throw error;
    }

    return { companyKey, accessKey };
};

externalThirdPartyAccesService.create = async (info = {}) => {
    const { mail, pass } = normalizeCredentials(info);
    const companyId = Number(info.company_id);
    const thirdPartyId = Number(info.thirdParty_id);

    if (!Number.isInteger(companyId) || companyId <= 0 || !Number.isInteger(thirdPartyId) || thirdPartyId <= 0) {
        const error = new Error('company_id y thirdParty_id deben ser válidos.');
        error.statusCode = 400;
        throw error;
    }

    const [thirdPartyExists, thirdPartyRows] = await useDataBase(`
        SELECT id
        FROM "Ecosystem".thirdparties
        WHERE id = $1 AND company_id = $2
        LIMIT 1;
    `, [thirdPartyId, companyId], 1);

    if (!thirdPartyExists || thirdPartyRows.length === 0) {
        const error = new Error('El tercero no pertenece a la compañía indicada.');
        error.statusCode = 404;
        throw error;
    }

    const row = await useDataBase(`
        INSERT INTO "Ecosystem"."externalThirdPatiesAccess"
            (company_id, "thirdParty_id", access_mail, access_password, enabled, config)
        VALUES ($1, $2, $3, $4, COALESCE($5::boolean, true), COALESCE($6::jsonb, '{}'::jsonb))
        ON CONFLICT (company_id, "thirdParty_id")
        DO UPDATE SET
            access_mail = EXCLUDED.access_mail,
            access_password = EXCLUDED.access_password,
            enabled = EXCLUDED.enabled,
            config = EXCLUDED.config
        RETURNING id, company_id, "thirdParty_id", "accesKey"::text AS "accesKey", access_mail, enabled, config;
    `, [
        companyId,
        thirdPartyId,
        mail,
        encrypt(pass),
        typeof info.enabled === 'boolean' ? info.enabled : true,
        JSON.stringify(info.config || {})
    ], 3);

    if (!row || row[0] === false) {
        throw new Error('No fue posible crear el acceso externo.');
    }

    return row;
};

externalThirdPartyAccesService.logIn = async (info = {}) => {
    const { mail, pass } = normalizeCredentials(info);
    const [ok, rows] = await useDataBase(`
        SELECT
            c.company_key,
            a."accesKey"::text AS user_key
        FROM "Ecosystem"."externalThirdPatiesAccess" a
        INNER JOIN "Ecosystem".companies c ON c.company_id = a.company_id
        WHERE LOWER(a.access_mail) = $1
          AND a.access_password = $2
          AND a.enabled = true
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
        LIMIT 1;
    `, [mail, encrypt(pass)], 1);

    return ok && rows.length > 0 ? rows[0] : null;
};

externalThirdPartyAccesService.getCompanyInfo = async (info = {}) => {
    const { companyKey, accessKey } = normalizeAccessKey(info);
    const [ok, rows] = await useDataBase(`
        SELECT
            c.*,
            ap.id AS "accountPlanId",
            ap.type AS "accountPlanType",
            cs.config,
            cs.time_zone,
            COALESCE(cs."taxConfig", '{}'::jsonb) AS "taxConfig"
        FROM "Ecosystem"."externalThirdPatiesAccess" a
        INNER JOIN "Ecosystem".companies c ON c.company_id = a.company_id
        LEFT JOIN "Ecosystem".account_plans ap ON c.company_id = ap.company_id
        LEFT JOIN "Ecosystem".company_settings cs ON c.company_id = cs.company_id
        WHERE c.company_key = $1
          AND a."accesKey"::text = $2
          AND a.enabled = true
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
        LIMIT 1;
    `, [companyKey, accessKey], 1);

    return ok && rows.length > 0 ? rows[0] : null;
};

externalThirdPartyAccesService.getUserInfo = async (info = {}) => {
    const { companyKey, accessKey } = normalizeAccessKey(info);
    const [ok, rows] = await useDataBase(`
        SELECT
            a."thirdParty_id" AS user_id,
            a.responsable,
            -- Rol del responsable interno: lo usan las funciones de proceso
            -- (nextProcessStep compara user_roll vs required_roll) y la delegación
            -- (auth.roleId). El tercero no tiene rol propio.
            uc.role AS role,
            rl.name AS responsable_roll,
            COALESCE(rl.config, '{}'::jsonb) AS responsable_config,
            a.company_id,
            a."accesKey"::text AS user_key,
            a.access_mail AS user_mail,
            t.names AS user_name,
            t.img AS user_img,
            'thirdParty' AS user_roll,
            1 AS user_session,
            COALESCE(a.config, '{}'::jsonb) AS config
        FROM "Ecosystem"."externalThirdPatiesAccess" a
        INNER JOIN "Ecosystem".companies c ON c.company_id = a.company_id
        INNER JOIN "Ecosystem".thirdparties t
            ON t.id = a."thirdParty_id" AND t.company_id = a.company_id
        LEFT JOIN "Ecosystem".users_config uc
            ON uc.user_id = a.responsable AND uc.company_id = a.company_id
        LEFT JOIN "Ecosystem".roles rl
            ON rl.id = uc.role AND rl.company_id = a.company_id
        WHERE c.company_key = $1
          AND a."accesKey"::text = $2
          AND a.enabled = true
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
        LIMIT 1;
    `, [companyKey, accessKey], 1);

    return ok && rows.length > 0 ? rows[0] : null;
};

externalThirdPartyAccesService.getParamsDocs = async (info = {}) => {
    // La compañía y el tercero proceden del acceso validado, no de IDs del cliente.
    const access = await externalThirdPartyAccesService.getUserInfo(info);
    if (!access) return null;

    const [ok, rows] = await useDataBase(`
        SELECT d.id, d.name, d.description, d.config
        FROM "Custom"."externalDocParameters" d
        WHERE (d.company_id = $1 OR d.company_id = 0)
          AND (d."thirdParty_id" = $2 OR d."thirdParty_id" IS NULL OR d."thirdParty_id" = 0)
        ORDER BY d.id;
    `, [access.company_id, access.user_id], 1);

    if (!ok) throw new Error('No fue posible consultar los documentos parametrizados.');
    return rows;
};

export default externalThirdPartyAccesService;
