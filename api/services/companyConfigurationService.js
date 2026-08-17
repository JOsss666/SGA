import { withTransaction } from '../app.js';

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const rowKey = (value) => String(value);

const CONFIGURATION_TABLES = [
    ['Ecosystem', 'roles'],
    ['Ecosystem', 'company_settings'],
    ['Ecosystem', 'stores'],
    ['Ecosystem', 'costCenters'],
    ['Ecosystem', 'bussines'],
    ['Ecosystem', 'account_plans'],
    ['Ecosystem', 'contable_accounts'],
    ['Ecosystem', 'teaxesCategories'],
    ['Ecosystem', 'taxes'],
    ['Ecosystem', 'payment_methods'],
    ['Ecosystem', 'concepts'],
    ['Ecosystem', 'documents_rules'],
    ['Inventory', 'categories'],
    ['Inventory', 'products&services'],
    ['Inventory', 'product_categories'],
    ['Inventory', 'cellars'],
    ['Inventory', 'cellarSections'],
    ['Inventory', 'prices_lists'],
    ['Inventory', 'store_pricesLists'],
    ['Inventory', 'priceList_items'],
    ['Treasury', 'cash_boxes'],
    ['Fiscal', 'product_tax_relations'],
    ['Fiscal', 'company_tax_classifications'],
    ['Fiscal', 'company_jurisdiction_tax_profiles'],
    ['Fiscal', 'tax_retention_overrides'],
    ['Process', 'processes'],
    ['Process', 'process_steps'],
    ['Process', 'step_doc_realtion']
];

const EXCLUDED_DATA = [
    'usuarios y configuraciones de usuario',
    'terceros y sus relaciones particulares',
    'documentos, adjuntos y reglas ejecutadas',
    'transacciones y detalles contables',
    'stocks, movimientos y movimientos de servicios',
    'cuentas por cobrar, cuentas por pagar y pagos de cartera',
    'turnos y liquidaciones de caja',
    'instancias e historial de procesos',
    'activos',
    'integraciones, credenciales, tokens y rangos electrónicos',
    'módulos personalizados o servicios habilitados de la compañía'
];

class ConfigurationPreviewRollback extends Error {
    constructor(summary) {
        super('Vista previa finalizada.');
        this.summary = summary;
    }
}

const parseCompanyId = (value, field) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${field} debe ser un entero positivo.`);
    }
    return parsed;
};

const remapId = (map, value, { nullable = false, preserveZero = true } = {}) => {
    if (value === null || value === undefined) return nullable ? null : value;
    if (preserveZero && Number(value) === 0) return value;
    if (!map) {
        if (nullable) return null;
        throw new Error(`No existe el mapa requerido para remapear la referencia ${value}.`);
    }
    const mapped = map.get(rowKey(value));
    if (mapped === undefined) {
        if (nullable) return null;
        throw new Error(`No fue posible remapear la referencia ${value}.`);
    }
    return mapped;
};

const remapIdArray = (map, values, options = {}) => (
    Array.isArray(values)
        ? values.map((value) => remapId(map, value, options)).filter((value) => value !== null)
        : []
);

const remapOwnedOrPreserve = (map, value) => {
    if (value === null || value === undefined) return value;
    return map?.get(rowKey(value)) ?? value;
};

const remapPath = (path, map) => {
    if (typeof path !== 'string' || !path) return path;
    return path.replace(/\d+/g, (value) => String(map.get(value) ?? value));
};

const cloneJson = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

const removeExcludedModules = (config) => {
    const sanitized = cloneJson(config) ?? {};
    const services = sanitized?.access?.services;
    if (services?.personalized) delete services.personalized;
    if (services?.e_facturation) delete services.e_facturation;
    return sanitized;
};

const setEnabledIds = (config, path, map, { clear = false } = {}) => {
    let cursor = config;
    for (const key of path) {
        if (!cursor || typeof cursor !== 'object' || !(key in cursor)) return;
        cursor = cursor[key];
    }
    if (!cursor || typeof cursor !== 'object' || !Array.isArray(cursor.enabled)) return;
    cursor.enabled = clear ? [] : remapIdArray(map, cursor.enabled, { nullable: true });
};

const remapRoleConfig = (sourceConfig, maps) => {
    const config = removeExcludedModules(sourceConfig);
    setEnabledIds(config, ['access', 'stores'], maps.get('Ecosystem.stores'));
    setEnabledIds(config, ['access', 'cellars'], maps.get('Inventory.cellars'));
    setEnabledIds(config, ['access', 'bussines'], maps.get('Ecosystem.bussines'));
    setEnabledIds(config, ['access', 'costCenters'], maps.get('Ecosystem.costCenters'));
    setEnabledIds(config, ['access', 'payments', 'payment_methods'], maps.get('Ecosystem.payment_methods'));
    setEnabledIds(config, ['access', 'sections', 'cashBoxes'], maps.get('Treasury.cash_boxes'));
    setEnabledIds(config, ['access', 'process_instances'], undefined, { clear: true });
    return config;
};

async function tableExists(client, schema, table) {
    const result = await client.query('SELECT to_regclass($1) IS NOT NULL AS exists', [`${quoteIdentifier(schema)}.${quoteIdentifier(table)}`]);
    return result.rows[0].exists;
}

async function assertCompanyExists(client, companyId, label) {
    const result = await client.query(
        'SELECT company_id FROM "Ecosystem".companies WHERE company_id = $1',
        [companyId]
    );
    if (result.rowCount === 0) throw new Error(`La compañía ${label} (${companyId}) no existe.`);
}

async function assertTargetIsEmpty(client, targetCompanyId) {
    const occupied = [];
    for (const [schema, table] of CONFIGURATION_TABLES) {
        if (!await tableExists(client, schema, table)) continue;
        const result = await client.query(
            `SELECT EXISTS (SELECT 1 FROM ${quoteIdentifier(schema)}.${quoteIdentifier(table)} WHERE company_id = $1) AS exists`,
            [targetCompanyId]
        );
        if (result.rows[0].exists) occupied.push(`${schema}.${table}`);
    }
    if (occupied.length > 0) {
        throw new Error(`La compañía destino ya tiene configuración en: ${occupied.join(', ')}. No se realizó ninguna copia.`);
    }
}

async function allocateTableIds(client, qualifiedTable, count) {
    const metadata = await client.query(
        `SELECT
            a.attidentity,
            pg_get_serial_sequence($1, 'id') AS sequence_name
         FROM pg_attribute a
         WHERE a.attrelid = $1::regclass
           AND a.attname = 'id'
           AND NOT a.attisdropped`,
        [qualifiedTable]
    );
    if (metadata.rowCount === 0) throw new Error(`La tabla ${qualifiedTable} no tiene columna id.`);

    const { attidentity: identityType, sequence_name: sequenceName } = metadata.rows[0];
    if (sequenceName) {
        const allocated = await client.query(
            'SELECT nextval($1::regclass)::bigint AS id FROM generate_series(1, $2::integer)',
            [sequenceName, count]
        );
        return {
            ids: allocated.rows.map((row) => row.id),
            overrideSystemValue: identityType === 'a'
        };
    }

    const maxResult = await client.query(`SELECT COALESCE(MAX(id), 0)::bigint AS max_id FROM ${qualifiedTable}`);
    let nextId = BigInt(maxResult.rows[0].max_id);
    const ids = Array.from({ length: count }, () => {
        nextId += 1n;
        return nextId.toString();
    });
    return { ids, overrideSystemValue: false };
}

async function cloneCompanyTable(client, options) {
    const {
        schema,
        table,
        sourceCompanyId,
        targetCompanyId,
        maps,
        transform = (row) => row,
        where = '',
        whereValues = []
    } = options;

    if (!await tableExists(client, schema, table)) return { count: 0, skipped: true };

    const qualifiedTable = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
    const sourceResult = await client.query(
        `SELECT * FROM ${qualifiedTable} WHERE company_id = $1 ${where} ORDER BY id`,
        [sourceCompanyId, ...whereValues]
    );
    if (sourceResult.rowCount === 0) return { count: 0 };

    const allocation = await allocateTableIds(client, qualifiedTable, sourceResult.rowCount);
    const idMap = new Map();
    sourceResult.rows.forEach((row, index) => idMap.set(rowKey(row.id), allocation.ids[index]));
    maps.set(`${schema}.${table}`, idMap);

    for (const sourceRow of sourceResult.rows) {
        const row = await transform({
            ...sourceRow,
            id: idMap.get(rowKey(sourceRow.id)),
            company_id: targetCompanyId
        }, sourceRow, maps);
        const columns = Object.keys(row);
        const placeholders = columns.map((_, index) => `$${index + 1}`);
        const identityOverride = allocation.overrideSystemValue ? ' OVERRIDING SYSTEM VALUE' : '';
        await client.query(
            `INSERT INTO ${qualifiedTable} (${columns.map(quoteIdentifier).join(', ')})${identityOverride} VALUES (${placeholders.join(', ')})`,
            columns.map((column) => row[column])
        );
    }
    return { count: sourceResult.rowCount };
}

async function cloneConceptTaxes(client, maps) {
    if (!await tableExists(client, 'Ecosystem', 'concept_taxes')) return { count: 0, skipped: true };
    const conceptMap = maps.get('Ecosystem.concepts');
    const taxMap = maps.get('Ecosystem.taxes');
    if (!conceptMap || !taxMap) return { count: 0 };

    const sourceConceptIds = [...conceptMap.keys()];
    const result = await client.query(
        'SELECT * FROM "Ecosystem".concept_taxes WHERE concept_id = ANY($1::bigint[]) ORDER BY id',
        [sourceConceptIds]
    );
    if (result.rowCount === 0) return { count: 0 };
    const allocation = await allocateTableIds(client, '"Ecosystem".concept_taxes', result.rowCount);
    for (const [index, row] of result.rows.entries()) {
        const identityOverride = allocation.overrideSystemValue ? ' OVERRIDING SYSTEM VALUE' : '';
        await client.query(
            `INSERT INTO "Ecosystem".concept_taxes (concept_id, tax_id, id, created_at)${identityOverride} VALUES ($1, $2, $3, $4)`,
            [remapId(conceptMap, row.concept_id), remapId(taxMap, row.tax_id), allocation.ids[index], row.created_at]
        );
    }
    return { count: result.rowCount };
}

async function cloneCompanySettings(client, sourceCompanyId, targetCompanyId) {
    if (!await tableExists(client, 'Ecosystem', 'company_settings')) return { count: 0, skipped: true };
    const source = await client.query(
        'SELECT config, "taxConfig", time_zone FROM "Ecosystem".company_settings WHERE company_id = $1',
        [sourceCompanyId]
    );
    if (source.rowCount === 0) return { count: 0 };
    await client.query(
        `INSERT INTO "Ecosystem".company_settings
            (company_id, config, created_at, updated_at, "taxConfig", time_zone)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3, $4)`,
        [
            targetCompanyId,
            removeExcludedModules(source.rows[0].config),
            source.rows[0].taxConfig,
            source.rows[0].time_zone
        ]
    );
    return { count: 1 };
}

async function remapClonedRoleConfigs(client, sourceCompanyId, maps) {
    const roleMap = maps.get('Ecosystem.roles');
    if (!roleMap) return;
    const source = await client.query(
        'SELECT id, config FROM "Ecosystem".roles WHERE company_id = $1 ORDER BY id',
        [sourceCompanyId]
    );
    for (const role of source.rows) {
        await client.query(
            'UPDATE "Ecosystem".roles SET config = $1 WHERE id = $2',
            [remapRoleConfig(role.config, maps), remapId(roleMap, role.id)]
        );
    }
}

const record = async (summary, name, promise) => {
    const result = await promise;
    summary.tables[name] = result.count;
    if (result.skipped) summary.skipped_missing_tables.push(name);
};

const companyConfigurationService = {};

companyConfigurationService.clone = async (payload = {}) => {
    const sourceCompanyId = parseCompanyId(payload.source_company_id, 'source_company_id');
    const targetCompanyId = parseCompanyId(payload.target_company_id, 'target_company_id');
    if (sourceCompanyId === targetCompanyId) throw new Error('La compañía origen y destino deben ser diferentes.');

    try {
        return await withTransaction(async (client) => {
            await client.query("SELECT pg_advisory_xact_lock(hashtext('clone-company-configuration'))");
            await assertCompanyExists(client, sourceCompanyId, 'origen');
            await assertCompanyExists(client, targetCompanyId, 'destino');
            await assertTargetIsEmpty(client, targetCompanyId);

        const maps = new Map();
        const summary = {
            source_company_id: sourceCompanyId,
            target_company_id: targetCompanyId,
            tables: {},
            skipped_missing_tables: [],
            excluded: EXCLUDED_DATA
        };
        const clone = (schema, table, transform, extra = {}) => record(summary, `${schema}.${table}`, cloneCompanyTable(client, {
            schema, table, sourceCompanyId, targetCompanyId, maps, transform, ...extra
        }));

        await clone('Ecosystem', 'roles');
        await clone('Ecosystem', 'stores');
        await clone('Ecosystem', 'costCenters', (row, source, allMaps) => ({
            ...row,
            parent_id: remapId(allMaps.get('Ecosystem.costCenters'), source.parent_id, { nullable: true }),
            path: remapPath(source.path, allMaps.get('Ecosystem.costCenters'))
        }));
        await clone('Ecosystem', 'bussines');
        await clone('Ecosystem', 'account_plans');
        await clone('Ecosystem', 'contable_accounts', (row, source, allMaps) => ({
            ...row,
            account_plan: remapId(allMaps.get('Ecosystem.account_plans'), source.account_plan)
        }));
        await clone('Ecosystem', 'teaxesCategories', (row, source, allMaps) => ({
            ...row,
            parent_id: remapId(allMaps.get('Ecosystem.teaxesCategories'), source.parent_id, { nullable: true }),
            path: remapPath(source.path, allMaps.get('Ecosystem.teaxesCategories'))
        }));
        await clone('Ecosystem', 'taxes', (row, source, allMaps) => ({
            ...row,
            account_id: remapOwnedOrPreserve(allMaps.get('Ecosystem.contable_accounts'), source.account_id),
            parent_id: remapId(allMaps.get('Ecosystem.teaxesCategories'), source.parent_id, { nullable: true }),
            path: remapPath(source.path, allMaps.get('Ecosystem.teaxesCategories'))
        }));
        await clone('Ecosystem', 'payment_methods', (row, source, allMaps) => ({
            ...row,
            account_id: remapOwnedOrPreserve(allMaps.get('Ecosystem.contable_accounts'), source.account_id)
        }));
        await clone('Ecosystem', 'concepts', (row, source, allMaps) => ({
            ...row,
            account_id: remapOwnedOrPreserve(allMaps.get('Ecosystem.contable_accounts'), source.account_id)
        }));
        await record(summary, 'Ecosystem.concept_taxes', cloneConceptTaxes(client, maps));
        await clone('Ecosystem', 'documents_rules');
        await record(summary, 'Ecosystem.company_settings', cloneCompanySettings(client, sourceCompanyId, targetCompanyId));

        await clone('Inventory', 'categories', (row, source, allMaps) => ({
            ...row,
            parent_id: remapId(allMaps.get('Inventory.categories'), source.parent_id, { nullable: true }),
            path: remapPath(source.path, allMaps.get('Inventory.categories'))
        }));
        await clone('Inventory', 'products&services', (row, source, allMaps) => ({
            ...row,
            stock: 0,
            entry_concept: remapOwnedOrPreserve(allMaps.get('Ecosystem.concepts'), source.entry_concept),
            exit_concept: remapOwnedOrPreserve(allMaps.get('Ecosystem.concepts'), source.exit_concept),
            tax_id: remapOwnedOrPreserve(allMaps.get('Ecosystem.taxes'), source.tax_id)
        }));
        await clone('Inventory', 'product_categories', (row, source, allMaps) => ({
            ...row,
            product_id: remapId(allMaps.get('Inventory.products&services'), source.product_id),
            category_id: remapId(allMaps.get('Inventory.categories'), source.category_id)
        }));
        await clone('Inventory', 'cellars', (row, source, allMaps) => ({
            ...row,
            store_id: remapId(allMaps.get('Ecosystem.stores'), source.store_id)
        }));
        await clone('Inventory', 'cellarSections', (row, source, allMaps) => ({
            ...row,
            store_id: remapId(allMaps.get('Ecosystem.stores'), source.store_id),
            cellar_id: remapId(allMaps.get('Inventory.cellars'), source.cellar_id)
        }));
        await clone('Inventory', 'prices_lists', (row, source, allMaps) => ({
            ...row,
            allowed_stores: remapIdArray(allMaps.get('Ecosystem.stores'), source.allowed_stores)
        }));
        await clone('Inventory', 'store_pricesLists', (row, source, allMaps) => ({
            ...row,
            "priceList_id": remapId(allMaps.get('Inventory.prices_lists'), source.priceList_id),
            store_id: remapId(allMaps.get('Ecosystem.stores'), source.store_id)
        }));
        await clone('Inventory', 'priceList_items', (row, source, allMaps) => ({
            ...row,
            "priceList_id": remapId(allMaps.get('Inventory.prices_lists'), source.priceList_id),
            "product&service_id": remapId(allMaps.get('Inventory.products&services'), source['product&service_id'])
        }));
        await clone('Treasury', 'cash_boxes', (row, source, allMaps) => ({
            ...row,
            "allowedStores": remapIdArray(allMaps.get('Ecosystem.stores'), source.allowedStores),
            "allowedUsers": [],
            status: 'closed',
            base: 0
        }));

        await clone('Fiscal', 'product_tax_relations', (row, source, allMaps) => ({
            ...row,
            product_id: remapId(allMaps.get('Inventory.products&services'), source.product_id),
            tax_id: remapId(allMaps.get('Ecosystem.taxes'), source.tax_id)
        }));
        await clone('Fiscal', 'company_tax_classifications');
        await clone('Fiscal', 'company_jurisdiction_tax_profiles');
        await clone('Fiscal', 'tax_retention_overrides', undefined, { where: 'AND relation_id IS NULL' });

        await clone('Process', 'processes');
        await clone('Process', 'process_steps', (row, source, allMaps) => ({
            ...row,
            process_id: remapId(allMaps.get('Process.processes'), source.process_id),
            required_roll: Array.isArray(source.required_roll)
                ? source.required_roll.map((id) => remapOwnedOrPreserve(allMaps.get('Ecosystem.roles'), id))
                : [],
            parent_id: remapId(allMaps.get('Process.process_steps'), source.parent_id, { nullable: true })
        }));
        await clone('Process', 'step_doc_realtion', (row, source, allMaps) => ({
            ...row,
            step_id: remapId(allMaps.get('Process.process_steps'), source.step_id)
        }));

        await remapClonedRoleConfigs(client, sourceCompanyId, maps);

            summary.total_rows_copied = Object.values(summary.tables).reduce((total, count) => total + count, 0);
            if (payload.dry_run === true) {
                summary.dry_run = true;
                throw new ConfigurationPreviewRollback(summary);
            }
            return summary;
        });
    } catch (error) {
        if (error instanceof ConfigurationPreviewRollback) return error.summary;
        throw error;
    }
};

export default companyConfigurationService;
