import { useDataBase } from "../app.js";

const RESULT_LIMIT = 5;

const normalizeTerm = (searchValue) => (searchValue ?? '').toString().trim();
const normalizePage = (page) => Math.max(1, Number.parseInt(page, 10) || 1);
const pageOffset = (page) => (normalizePage(page) - 1) * RESULT_LIMIT;

// Ejecuta un SELECT y lo normaliza al contrato {title,page,status,results}.
// useDataBase(...,1) devuelve [false, []] tanto en "sin resultados" como
// [false, err] cuando la query falla: solo el segundo caso es un error real.
const runSearch = async (title, sentence, params, page = 1) => {
    const [ok, rows] = await useDataBase(sentence, params, 1);
    if (ok || Array.isArray(rows)) {
        return { title, page: normalizePage(page), status: 'OK', results: rows };
    }
    console.error(`searchService: fallo la búsqueda "${title}":`, rows);
    return { title, page: normalizePage(page), status: 'ERROR', results: [] };
};

// ─────────────────────────────────────────────────────────────────────────────
// Permisos — Etapa "middleware": decide qué bloques de búsqueda corren según
// roles.config (mismo formato que consume el frontend en access.sections.*).
// ─────────────────────────────────────────────────────────────────────────────
const getSearchPermissions = async (userId) => {
    const [ok, rows] = await useDataBase(`
        SELECT r.config
        FROM "Ecosystem".users_config uc
        JOIN "Ecosystem".roles r ON r.id = uc.role
        WHERE uc.user_id = $1
        LIMIT 1;
    `, [userId], 1);

    const access = ok ? rows[0]?.config?.access : undefined;
    const sections = access?.sections;
    const modules = access?.modules;
    const sectionEnabled = (key) => sections?.[key]?.overAll === true;
    const moduleEnabled = (key) => modules?.[key]?.use === true;
    const masterEnabled = sectionEnabled('search');

    return {
        thirdParties: masterEnabled && sectionEnabled('thirdparties'),
        accounts: masterEnabled && sectionEnabled('accounts'),
        transactions: masterEnabled && sectionEnabled('movements'),
        documents: masterEnabled && sectionEnabled('newDocument'),
        electronicDocuments: masterEnabled && sectionEnabled('newDocument'),
        // "procesos" no tiene sección propia en roles.config.access.sections;
        // se gatea por el módulo (mismo criterio que ServicesGrid.jsx).
        processes: masterEnabled && moduleEnabled('process'),
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// Búsquedas — cada una acotada a la compañía, indexada y limitada a 8 filas.
// ─────────────────────────────────────────────────────────────────────────────

// Terceros: nombre completo, identificación o correo.
// Usa idx_thirdparties_search_trgm (GIN trigram sobre nombres+identificación+mail).
const searchThirdParties = (term, companyId, page = 1) => runSearch('thirdParties', `
    SELECT id, names, "lastNames", indentification_type, indentification_number,
           mail, phone, type, img
    FROM "Ecosystem".thirdparties
    WHERE company_id = $1
      AND (
          lower(names || ' ' || "lastNames" || ' ' || indentification_number || ' ' || coalesce(mail, ''))
              LIKE '%' || lower($2) || '%'
          OR indentification_number LIKE $2 || '%'
      )
    ORDER BY names
    LIMIT ${RESULT_LIMIT} OFFSET ${pageOffset(page)};
`, [companyId, term], page);

// Documentos: número propio (ownSerial), descripción o tercero relacionado.
// Usa idx_documents_company_created, idx_documents_description_trgm e
// idx_documents_company_ownserial_text. El LEFT JOIN LATERAL trae, solo a
// modo informativo, el número del documento electrónico más reciente
// asociado (un documento puede tener varios registros electrónicos, p.ej.
// reintentos) — nunca se filtra por él, solo se muestra tras el tercero.
// Usa idx_efacturation_documents_docid_created.
const searchDocuments = (term, companyId, page = 1) => runSearch('documents', `
    SELECT d.id, d."ownSerial", d.document_type, d.status, d.total, d.created_at,
           d.description, t.names AS "thirdPartyNames", t."lastNames" AS "thirdPartyLastNames",
           e.number AS "electronicNumber"
    FROM "Ecosystem".documents d
    LEFT JOIN "Ecosystem".thirdparties t ON t.id = d."thirdParty_id"
    LEFT JOIN LATERAL (
        SELECT number
        FROM "ElectronicFacturation".documents ed
        WHERE ed.doc_id = d.id
        ORDER BY ed.created_at DESC
        LIMIT 1
    ) e ON true
    WHERE d.company_id = $1
      AND (
          d."ownSerial"::text LIKE $2 || '%'
          OR lower(coalesce(d.description, '')) LIKE '%' || lower($2) || '%'
          OR lower(coalesce(t.names, '') || ' ' || coalesce(t."lastNames", '')) LIKE '%' || lower($2) || '%'
      )
    ORDER BY d.created_at DESC
    LIMIT ${RESULT_LIMIT} OFFSET ${pageOffset(page)};
`, [companyId, term], page);

// Documentos electrónicos: tipo, número/referencia propios, el documento
// (tipo + ownSerial) y el tercero del "Ecosystem".documents relacionado. La
// FK doc_id tiene ON DELETE CASCADE, así que el documento relacionado
// siempre existe (el tercero es opcional, de ahí el LEFT JOIN). Usa
// idx_efacturation_documents_company_created e
// idx_efacturation_documents_company_number_text.
const searchElectronicDocuments = (term, companyId, page = 1) => runSearch('electronicDocuments', `
    SELECT e.id, e.doc_id, e.type, e.number, e.reference, e.created_at,
           d.document_type, d."ownSerial",
           t.names AS "thirdPartyNames", t."lastNames" AS "thirdPartyLastNames"
    FROM "ElectronicFacturation".documents e
    JOIN "Ecosystem".documents d ON d.id = e.doc_id
    LEFT JOIN "Ecosystem".thirdparties t ON t.id = d."thirdParty_id"
    WHERE e.company_id = $1
      AND (
          e.number LIKE $2 || '%'
          OR lower(coalesce(e.reference, '')) LIKE '%' || lower($2) || '%'
          OR d."ownSerial"::text LIKE $2 || '%'
          OR lower(coalesce(t.names, '') || ' ' || coalesce(t."lastNames", '')) LIKE '%' || lower($2) || '%'
      )
    ORDER BY e.created_at DESC
    LIMIT ${RESULT_LIMIT} OFFSET ${pageOffset(page)};
`, [companyId, term], page);

// Transacciones: número propio (ownSerial), concepto o tercero relacionado.
// Usa idx_transactions_company_created e idx_transactions_company_ownserial_text.
const searchTransactions = (term, companyId, page = 1) => runSearch('transactions', `
    SELECT tr.id, tr."ownSerial", tr.doc_type, tr.status, tr.total, tr.doc_date, tr.created_at,
           c.name AS "conceptName", t.names AS "thirdPartyNames", t."lastNames" AS "thirdPartyLastNames"
    FROM "Ecosystem".transactions tr
    JOIN "Ecosystem".concepts c ON c.id = tr.concept_id
    LEFT JOIN "Ecosystem".thirdparties t ON t.id = tr."thirdParty_id"
    WHERE tr.company_id = $1
      AND (
          tr."ownSerial"::text LIKE $2 || '%'
          OR lower(c.name) LIKE '%' || lower($2) || '%'
          OR lower(coalesce(t.names, '') || ' ' || coalesce(t."lastNames", '')) LIKE '%' || lower($2) || '%'
      )
    ORDER BY tr.created_at DESC
    LIMIT ${RESULT_LIMIT} OFFSET ${pageOffset(page)};
`, [companyId, term], page);

// Cuentas del plan contable: código (prefijo, idx_accounts_code) o nombre
// (idx_contable_accounts_name_trgm). company_id = 0 es el PUC compartido:
// las compañías que no clonan su propio plan postean directamente contra
// esas cuentas globales (mismo criterio que contabilityController.getBalance).
// Como esto mezcla el plan propio con ~2900 cuentas plantilla genéricas,
// las que la compañía ya usa (tienen movimientos en transaction_detail) se
// ordenan primero — si no, el ruido del PUC compartido tapa la cuenta real
// dentro del límite de resultados. Usa idx_td_account_company.
const searchAccounts = (term, companyId, page = 1) => runSearch('accounts', `
    SELECT a.id, a.code, a.name, a.level, a.type, a.state, a.type_account
    FROM "Ecosystem".contable_accounts a
    WHERE a.company_id IN ($1, 0)
      AND (
          a.code LIKE $2 || '%'
          OR lower(a.name) LIKE '%' || lower($2) || '%'
      )
    ORDER BY
        EXISTS (
            SELECT 1 FROM "Ecosystem".transaction_detail td
            WHERE td.account_id = a.id AND td.company_id = $1
        ) DESC,
        a.code
    LIMIT ${RESULT_LIMIT} OFFSET ${pageOffset(page)};
`, [companyId, term], page);

// Procesos: código del proceso, ownSerial, código+ownSerial concatenado
// (p.ej. "OT240" para el proceso OT #240), descripción (del proceso, la
// instancia no tiene una propia), tercero relacionado y el valor total del
// proceso (suma de los documentos adjuntos vía "Ecosystem".docs_instances,
// la misma tabla que usa processController.getAttachedDocuments — más
// completa que documents.instance_id, que puede quedar corto). Usa
// idx_process_instance_company_created,
// idx_process_instance_company_ownserial_text e idx_docs_instances_instance_id.
const searchProcesses = (term, companyId, page = 1) => runSearch('processes', `
    SELECT pi.id, pi."ownSerial", pi.created_at, pi.status,
           p.code AS "processCode", p.name AS "processName", p.description AS "processDescription",
           t.names AS "thirdPartyNames", t."lastNames" AS "thirdPartyLastNames",
           (
               SELECT coalesce(sum(d.total), 0)
               FROM "Ecosystem".docs_instances di
               JOIN "Ecosystem".documents d ON d.id = di.doc_id
               WHERE di.instance_id = pi.id AND pi.status = 'active'
           ) AS "totalValue"
    FROM "Process".process_instance pi
    JOIN "Process".processes p ON p.id = pi.process_id
    LEFT JOIN "Ecosystem".thirdparties t ON t.id = pi."thirdParty_id"
    WHERE pi.company_id = $1
      AND (
          pi."ownSerial"::text LIKE $2 || '%'
          OR lower(p.code) LIKE '%' || lower($2) || '%'
          OR lower(p.code || pi."ownSerial"::text) LIKE lower($2) || '%'
          OR lower(coalesce(p.description, '')) LIKE '%' || lower($2) || '%'
          OR lower(coalesce(t.names, '') || ' ' || coalesce(t."lastNames", '')) LIKE '%' || lower($2) || '%'
      )
    ORDER BY pi.created_at DESC
    LIMIT ${RESULT_LIMIT} OFFSET ${pageOffset(page)};
`, [companyId, term], page);

// ─────────────────────────────────────────────────────────────────────────────
// Entrada pública — recibe el texto del input de búsqueda y el contexto de
// sesión (company_id, user_id). Corre en paralelo solo los bloques que el rol
// del usuario tiene habilitados.
// ─────────────────────────────────────────────────────────────────────────────
const searchInApp = async (searchValue, { company_id, user_id, category, page = 1 } = {}) => {
    const term = normalizeTerm(searchValue);
    if (!term || !company_id) return [];

    const permissions = await getSearchPermissions(user_id);

    const searchers = {
        thirdParties: searchThirdParties,
        accounts: searchAccounts,
        transactions: searchTransactions,
        documents: searchDocuments,
        electronicDocuments: searchElectronicDocuments,
        processes: searchProcesses,
    };

    const requestedCategories = category ? [category] : Object.keys(searchers);
    const tasks = requestedCategories
        .filter(title => permissions[title] && searchers[title])
        .map(title => searchers[title](term, company_id, page));

    return Promise.all(tasks);
};

export default searchInApp;
