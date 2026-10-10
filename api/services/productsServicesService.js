import { withTransaction, useDataBase } from "../app.js";

const productsServicesService = {};

const RELATION_TYPES = {
    PURCHASE_TAX: 'purchase_tax',
    PURCHASE_WITHHOLDING: 'purchase_withholding',
    SELL_TAX: 'sell_tax',
    SELL_WITHHOLDING: 'sell_withholding'
};

const THIRD_PARTY_PRODUCT_TAX_OPERATIONS = ['purchase', 'sell'];
const THIRD_PARTY_PRODUCT_TAX_ROLES = ['tax', 'withholding'];
const THIRD_PARTY_PRODUCT_TAX_SCOPES = [
    ['purchase', 'tax'],
    ['purchase', 'withholding'],
    ['sell', 'tax'],
    ['sell', 'withholding']
];

const performedByFrom = (info) => info.user ?? info.userName ?? info.performed_by ?? 'api';

const hasValue = (value) => value !== undefined && value !== null && value !== '' && value !== false;

const normalizeIdList = (value) => {
    const list = Array.isArray(value) ? value : hasValue(value) ? [value] : [];
    return [...new Set(
        list
            .map((item) => parseInt(item?.value ?? item))
            .filter((item) => Number.isInteger(item) && item > 0)
    )];
};

const normalizeCategoryList = (value) => normalizeIdList(value);

const normalizeOperationType = (value) => {
    const operationType = `${value ?? ''}`.trim().toLowerCase();
    if (!THIRD_PARTY_PRODUCT_TAX_OPERATIONS.includes(operationType)) {
        throw productRelationError(`operation_type inválido: ${value}. Valores permitidos: purchase, sell.`);
    }
    return operationType;
};

const normalizeTaxRole = (value) => {
    const taxRole = `${value ?? ''}`.trim().toLowerCase();
    if (!THIRD_PARTY_PRODUCT_TAX_ROLES.includes(taxRole)) {
        throw productRelationError(`tax_role inválido: ${value}. Valores permitidos: tax, withholding.`);
    }
    return taxRole;
};

const productRelationError = (message, statusCode = 400, code = 'INVALID_THIRD_PARTY_PRODUCT_RELATION') => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
};

const parsePositiveId = (value, fieldName) => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw productRelationError(`${fieldName} debe ser un entero positivo válido.`);
    }
    return parsed;
};

const normalizeDateOnly = (value, fieldName) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw productRelationError(`${fieldName} debe tener formato YYYY-MM-DD.`);
    }
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        throw productRelationError(`${fieldName} no es una fecha válida.`);
    }
    return value;
};

const validateThirdPartyProductScope = async (client, companyId, thirdPartyId, productId) => {
    const result = await client.query(`
        SELECT tp.id AS third_party_id, ps.id AS product_id
        FROM "Ecosystem".thirdparties tp
        JOIN "Inventory"."products&services" ps
          ON ps.company_id = tp.company_id
        WHERE tp.company_id = $1
          AND tp.id = $2
          AND ps.id = $3
        LIMIT 1;
    `, [companyId, thirdPartyId, productId]);

    if (!result.rows[0]) {
        throw productRelationError('El tercero o el producto no existe en la compañía indicada.', 404, 'THIRD_PARTY_PRODUCT_NOT_FOUND');
    }
};

const normalizeThirdPartyProductTaxRelation = (info) => {
    const companyId = parseInt(info.company_id);
    const thirdPartyId = parseInt(info.third_party_id ?? info.thirdParty_id);
    const productId = parseInt(info.product_id ?? info.productId);
    const taxId = parseInt(info.tax_id ?? info.taxId);

    if (!Number.isInteger(companyId)) throw new Error('company_id es requerido.');
    if (!Number.isInteger(thirdPartyId)) throw new Error('third_party_id es requerido.');
    if (!Number.isInteger(productId)) throw new Error('product_id es requerido.');
    if (!Number.isInteger(taxId)) throw new Error('tax_id es requerido.');

    return {
        company_id: companyId,
        third_party_id: thirdPartyId,
        product_id: productId,
        tax_id: taxId,
        operation_type: normalizeOperationType(info.operation_type ?? info.operationType),
        tax_role: normalizeTaxRole(info.tax_role ?? info.taxRole),
        is_active: info.is_active ?? true,
        priority: Number.isInteger(parseInt(info.priority)) ? parseInt(info.priority) : 0,
        valid_from: info.valid_from ?? null,
        valid_until: info.valid_until ?? null,
        notes: info.notes ?? null,
        third_party_reference: info.third_party_reference ?? info.thirdPartyReference ?? null,
        created_by: info.created_by ?? performedByFrom(info)
    };
};

const buildTaxRelations = (info) => {
    const relations = [];

    if (info.purchaseTaxed !== false) {
        normalizeIdList(info.purchaseTax_id).forEach((taxId) => {
            relations.push({ taxId, type: RELATION_TYPES.PURCHASE_TAX });
        });
    }

    normalizeIdList(info.purchaseWithholdings).forEach((taxId) => {
        relations.push({ taxId, type: RELATION_TYPES.PURCHASE_WITHHOLDING });
    });

    if (info.taxed !== false) {
        normalizeIdList(info.tax_id).forEach((taxId) => {
            relations.push({ taxId, type: RELATION_TYPES.SELL_TAX });
        });
    }

    normalizeIdList(info.sellWithholdings).forEach((taxId) => {
        relations.push({ taxId, type: RELATION_TYPES.SELL_WITHHOLDING });
    });

    const uniqueRelations = new Map();
    relations.forEach((relation) => {
        uniqueRelations.set(`${relation.taxId}-${relation.type}`, relation);
    });

    return [...uniqueRelations.values()];
};

const hasTaxRelationPayload = (info) => (
    info.purchaseTax_id !== undefined ||
    info.purchaseWithholdings !== undefined ||
    info.tax_id !== undefined ||
    info.sellWithholdings !== undefined ||
    info.purchaseTaxed !== undefined ||
    info.taxed !== undefined
);

const insertProductTaxRelations = async (client, companyId, productId, info) => {
    const relations = buildTaxRelations(info);

    for (let index = 0; index < relations.length; index++) {
        const relation = relations[index];
        await client.query(`
            INSERT INTO "Fiscal".product_tax_relations
                (company_id, product_id, tax_id, type, priority, valid_from, valid_until)
            VALUES ($1, $2, $3, $4::"Fiscal".product_tax_relation_type, $5, $6, $7)
            ON CONFLICT ON CONSTRAINT uq_product_tax_relation
            DO UPDATE SET
                is_active = true,
                priority = EXCLUDED.priority,
                valid_from = EXCLUDED.valid_from,
                valid_until = EXCLUDED.valid_until,
                updated_at = now();
        `, [
            companyId,
            productId,
            relation.taxId,
            relation.type,
            info.priority ?? index,
            info.valid_from ?? null,
            info.valid_until ?? null
        ]);
    }

    return relations;
};

const replaceProductTaxRelations = async (client, companyId, productId, info) => {
    await client.query(`
        DELETE FROM "Fiscal".product_tax_relations
        WHERE company_id = $1 AND product_id = $2;
    `, [companyId, productId]);

    return insertProductTaxRelations(client, companyId, productId, info);
};

const syncProductCategories = async (client, companyId, productId, categoryIds, { replace = false } = {}) => {
    const normalizedCategoryIds = normalizeCategoryList(categoryIds);

    if (replace) {
        await client.query(`
            DELETE FROM "Inventory".product_categories
            WHERE company_id = $1 AND product_id = $2;
        `, [companyId, productId]);
    }

    for (const categoryId of normalizedCategoryIds) {
        await client.query(`
            INSERT INTO "Inventory".product_categories
                (company_id, product_id, category_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING;
        `, [companyId, productId, categoryId]);
    }

    return normalizedCategoryIds;
};

const auditEvent = async ({ client, companyId, eventType, entitySchema = 'Inventory', entityTable, entityId, payload, performedBy }) => {
    try {
        await client.query(`
            INSERT INTO "Fiscal".audit_events
                (company_id, event_type, entity_schema, entity_table, entity_id, payload, performed_by)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7);
        `, [
            companyId ?? null,
            eventType,
            entitySchema,
            entityTable ?? 'products&services',
            entityId ?? null,
            JSON.stringify(payload ?? {}),
            performedBy ?? 'api'
        ]);
    } catch (err) {
        console.error('⚠️ [Fiscal] No se pudo registrar audit_event de producto:', eventType, err);
    }
};

productsServicesService.register = async (info) => {
    const performedBy = performedByFrom(info);

    return withTransaction(async (client) => {
        const result = await client.query(`
            INSERT INTO "Inventory"."products&services"(
                company_id,
                code,
                name,
                stock,
                units,
                entry_concept,
                exit_concept,
                taxed,
                tax_id,
                img,
                type,
                description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id;
        `, [
            info.company_id,
            info.code,
            info.name,
            info.stock,
            info.units,
            info.purchaseConcept,
            info.sellConcept,
            info.taxed,
            hasValue(info.tax_id) ? info.tax_id : null,
            info.photo,
            info.type_product,
            info.description
        ]);

        const productId = parseInt(result.rows[0].id);

        const categoryIds = await syncProductCategories(client, info.company_id, productId, info.category_id);
        const taxRelations = await insertProductTaxRelations(client, info.company_id, productId, info);

        await auditEvent({
            client,
            companyId: info.company_id,
            eventType: 'product.created',
            entityId: productId,
            payload: {
                product_id: productId,
                code: info.code,
                name: info.name,
                type_product: info.type_product,
                categories: categoryIds,
                tax_relations: taxRelations
            },
            performedBy
        });

        return {
            status: 'OK',
            id: productId,
            product_id: productId,
            tax_relations: taxRelations
        };
    });
};

productsServicesService.update = async (info) => {
    const productId = parseInt(info.id ?? info.product_id);
    if (!Number.isInteger(productId)) {
        throw new Error('product_id/id es requerido para actualizar producto.');
    }

    const performedBy = performedByFrom(info);

    return withTransaction(async (client) => {
        const result = await client.query(`
            UPDATE "Inventory"."products&services"
            SET
                code = COALESCE($1, code),
                name = COALESCE($2, name),
                stock = COALESCE($3, stock),
                units = COALESCE($4, units),
                entry_concept = COALESCE($5, entry_concept),
                exit_concept = COALESCE($6, exit_concept),
                taxed = COALESCE($7, taxed),
                tax_id = CASE
                    WHEN $7 = false THEN NULL
                    WHEN $8 IS NULL THEN tax_id
                    ELSE $8
                END,
                img = COALESCE($9, img),
                type = COALESCE($10, type),
                description = COALESCE($11, description)
            WHERE id = $12 AND company_id = $13
            RETURNING id;
        `, [
            info.code ?? null,
            info.name ?? null,
            info.stock ?? null,
            info.units ?? null,
            info.purchaseConcept ?? null,
            info.sellConcept ?? null,
            info.taxed ?? null,
            hasValue(info.tax_id) ? info.tax_id : null,
            info.photo ?? info.img ?? null,
            info.type_product ?? info.type ?? null,
            info.description ?? null,
            productId,
            info.company_id
        ]);

        if (!result.rows[0]) {
            throw new Error(`No existe producto/servicio ${productId} para company_id ${info.company_id}.`);
        }

        if (info.category_id !== undefined) {
            await syncProductCategories(client, info.company_id, productId, info.category_id, { replace: true });
        }

        const taxRelations = hasTaxRelationPayload(info)
            ? await replaceProductTaxRelations(client, info.company_id, productId, info)
            : null;

        await auditEvent({
            client,
            companyId: info.company_id,
            eventType: 'product.updated',
            entityId: productId,
            payload: {
                product_id: productId,
                tax_relations: taxRelations
            },
            performedBy
        });

        return {
            status: 'OK',
            id: productId,
            product_id: productId,
            tax_relations: taxRelations
        };
    });
};

productsServicesService.disable = async (info) => {
    const productId = parseInt(info.id ?? info.product_id);
    if (!Number.isInteger(productId)) {
        throw new Error('product_id/id es requerido para deshabilitar producto.');
    }

    const performedBy = performedByFrom(info);

    return withTransaction(async (client) => {
        const result = await client.query(`
            UPDATE "Inventory"."products&services"
            SET status = 'disabled'
            WHERE id = $1 AND company_id = $2
            RETURNING id;
        `, [productId, info.company_id]);

        if (!result.rows[0]) {
            throw new Error(`No existe producto/servicio ${productId} para company_id ${info.company_id}.`);
        }

        await client.query(`
            UPDATE "Fiscal".product_tax_relations
            SET is_active = false, updated_at = now()
            WHERE company_id = $1 AND product_id = $2;
        `, [info.company_id, productId]);

        await auditEvent({
            client,
            companyId: info.company_id,
            eventType: 'product.disabled',
            entityId: productId,
            payload: { product_id: productId },
            performedBy
        });

        return { status: 'OK', id: productId, product_id: productId };
    });
};

productsServicesService.delete = async (info) => {
    const productId = parseInt(info.id ?? info.product_id);
    if (!Number.isInteger(productId)) {
        throw new Error('product_id/id es requerido para eliminar producto.');
    }

    const performedBy = performedByFrom(info);

    return withTransaction(async (client) => {
        await client.query(`
            DELETE FROM "Fiscal".product_tax_relations
            WHERE company_id = $1 AND product_id = $2;
        `, [info.company_id, productId]);

        await client.query(`
            DELETE FROM "Inventory".product_categories
            WHERE company_id = $1 AND product_id = $2;
        `, [info.company_id, productId]);

        const result = await client.query(`
            DELETE FROM "Inventory"."products&services"
            WHERE id = $1 AND company_id = $2
            RETURNING id;
        `, [productId, info.company_id]);

        if (!result.rows[0]) {
            throw new Error(`No existe producto/servicio ${productId} para company_id ${info.company_id}.`);
        }

        await auditEvent({
            client,
            companyId: info.company_id,
            eventType: 'product.deleted',
            entityId: productId,
            payload: { product_id: productId },
            performedBy
        });

        return { status: 'OK', id: productId, product_id: productId };
    });
};

productsServicesService.getTaxRelations = async (info) => {
    const values = [info.company_id];
    const where = ['ptr.company_id = $1'];

    if (info.product_id !== undefined || info.id !== undefined) {
        values.push(info.product_id ?? info.id);
        where.push(`ptr.product_id = $${values.length}`);
    }

    if (info.type !== undefined) {
        values.push(info.type);
        where.push(`ptr.type = $${values.length}::"Fiscal".product_tax_relation_type`);
    }

    if (info.active_only !== false) {
        where.push('ptr.is_active = true');
    }

    return useDataBase(`
        SELECT
            ptr.*,
            ptr.type::text AS relation_type,
            t.code AS tax_code,
            t.rate,
            t.base,
            t.account_id AS tax_account,
            t."isRetention",
            t.type::text AS tax_type,
            ca.name AS tax_name,
            ca.type AS account_type
        FROM "Fiscal".product_tax_relations ptr
        JOIN "Ecosystem".taxes t
            ON t.id = ptr.tax_id
        LEFT JOIN "Ecosystem".contable_accounts ca
            ON ca.id = t.account_id
        WHERE ${where.join(' AND ')}
        ORDER BY ptr.priority ASC, ca.name ASC, ptr.id ASC;
    `, values, 1);
};


// Trae, agrupadas por producto, las relaciones fiscales de COMPRA:
// impuestos (type = 'purchase_tax') y retenciones (type = 'purchase_withholding').
// Solo relación+tax con product_id: la info del producto ya la carga el front aparte.
productsServicesService.getPurchaseRelations = async (info) => {
    const values = [info.company_id];
    const where = ['ptr.company_id = $1'];

    if (info.product_id !== undefined || info.id !== undefined) {
        values.push(info.product_id ?? info.id);
        where.push(`ptr.product_id = $${values.length}`);
    }

    if (info.active_only !== false) {
        where.push('ptr.is_active = true');
    }

    where.push(`ptr.type IN (
        'purchase_tax'::"Fiscal".product_tax_relation_type,
        'purchase_withholding'::"Fiscal".product_tax_relation_type
    )`);

    const [ok, rows] = await useDataBase(`
        SELECT
            ptr.*,
            ptr.type::text AS relation_type,
            t.code AS tax_code,
            t.rate,
            t.base,
            t.account_id AS tax_account,
            t."isRetention",
            t.type::text AS tax_type,
            ca.name AS tax_name,
            ca.type AS account_type
        FROM "Fiscal".product_tax_relations ptr
        JOIN "Ecosystem".taxes t
            ON t.id = ptr.tax_id
        LEFT JOIN "Ecosystem".contable_accounts ca
            ON ca.id = t.account_id
        WHERE ${where.join(' AND ')}
        ORDER BY ptr.product_id ASC, ptr.priority ASC, ptr.id ASC;
    `, values, 1);

    if (!ok) return [false, []];

    // Agrupamos por producto: todas las relaciones de impuesto en purchase_taxes
    // y todas las retenciones (con los mismos campos del tax) en retentions.
    const grouped = {};
    rows.forEach(row => {
        if (grouped[row.product_id] === undefined) {
            grouped[row.product_id] = {
                product_id: row.product_id,
                purchase_taxes: [],
                retentions: []
            };
        }

        if (row.relation_type === 'purchase_withholding') {
            grouped[row.product_id].retentions.push(row);
        } else {
            grouped[row.product_id].purchase_taxes.push(row);
        }
    });

    return [true, Object.values(grouped)];
};

productsServicesService.registerThirdPartyProductTaxRelation = async (info) => {
    const rows = Array.isArray(info.relations) && info.relations.length > 0
        ? info.relations.map((relation, index) => normalizeThirdPartyProductTaxRelation({
            ...info,
            ...relation,
            priority: relation.priority ?? index
        }))
        : [normalizeThirdPartyProductTaxRelation(info)];

    return withTransaction(async (client) => {
        const insertedRows = [];
        const productAssociations = new Map();
        for (const row of rows) {
            const key = `${row.company_id}:${row.third_party_id}:${row.product_id}`;
            const association = productAssociations.get(key) ?? row;
            if (row.third_party_reference != null) association.third_party_reference = row.third_party_reference;
            productAssociations.set(key, association);
        }
        for (const association of productAssociations.values()) {
            await validateThirdPartyProductScope(
                client,
                association.company_id,
                association.third_party_id,
                association.product_id
            );
            await client.query(`
                INSERT INTO "Fiscal".third_party_products
                    (company_id, third_party_id, product_id, third_party_reference, is_active, created_by)
                VALUES ($1, $2, $3, $4, true, $5)
                ON CONFLICT ON CONSTRAINT uq_third_party_product
                DO UPDATE SET
                    third_party_reference = COALESCE(EXCLUDED.third_party_reference, "Fiscal".third_party_products.third_party_reference),
                    is_active = true,
                    updated_at = now();
            `, [
                association.company_id,
                association.third_party_id,
                association.product_id,
                association.third_party_reference ?? null,
                association.created_by
            ]);
        }

        for (const row of rows) {
            const result = await client.query(`
                INSERT INTO "Fiscal".third_party_product_tax_relations (
                    company_id,
                    third_party_id,
                    product_id,
                    tax_id,
                    operation_type,
                    tax_role,
                    is_active,
                    priority,
                    valid_from,
                    valid_until,
                    notes,
                    third_party_reference,
                    created_by
                )
                VALUES (
                    $1, $2, $3, $4,
                    $5::"Fiscal".third_party_product_tax_operation,
                    $6::"Fiscal".third_party_product_tax_role,
                    $7, $8, $9, $10, $11, $12, $13
                )
                ON CONFLICT ON CONSTRAINT uq_third_party_product_tax_relation
                DO UPDATE SET
                    is_active = EXCLUDED.is_active,
                    priority = EXCLUDED.priority,
                    valid_from = EXCLUDED.valid_from,
                    valid_until = EXCLUDED.valid_until,
                    notes = EXCLUDED.notes,
                    third_party_reference = EXCLUDED.third_party_reference,
                    updated_at = now()
                RETURNING *;
            `, [
                row.company_id,
                row.third_party_id,
                row.product_id,
                row.tax_id,
                row.operation_type,
                row.tax_role,
                row.is_active,
                row.priority,
                row.valid_from,
                row.valid_until,
                row.notes,
                row.third_party_reference,
                row.created_by
            ]);

            insertedRows.push(result.rows[0]);
        }

        await auditEvent({
            client,
            companyId: rows[0]?.company_id,
            eventType: 'third_party_product_tax_relation.upserted',
            entitySchema: 'Fiscal',
            entityTable: 'third_party_product_tax_relations',
            entityId: insertedRows[0]?.id,
            payload: { relations: insertedRows },
            performedBy: rows[0]?.created_by
        });

        return {
            status: 'OK',
            relations: insertedRows
        };
    });
};

/**
 * Crea o modifica la asociación tercero-producto y su referencia externa.
 * La operación es parcial: los campos ausentes conservan su valor actual.
 */
productsServicesService.updateThirdPartyProductAssociation = async (info) => {
    const companyId = parsePositiveId(info.company_id, 'company_id');
    const thirdPartyId = parsePositiveId(info.third_party_id ?? info.thirdParty_id, 'third_party_id');
    const productId = parsePositiveId(info.product_id ?? info.productId, 'product_id');
    const hasReference = Object.prototype.hasOwnProperty.call(info, 'third_party_reference')
        || Object.prototype.hasOwnProperty.call(info, 'thirdPartyReference');
    const rawReference = info.third_party_reference ?? info.thirdPartyReference;
    if (hasReference && rawReference !== null && typeof rawReference !== 'string') {
        throw productRelationError('third_party_reference debe ser texto o null.');
    }
    const reference = typeof rawReference === 'string' ? (rawReference.trim() || null) : null;
    if (info.is_active !== undefined && typeof info.is_active !== 'boolean') {
        throw productRelationError('is_active debe ser booleano.');
    }
    if (!hasReference && info.is_active === undefined) {
        throw productRelationError('Envía al menos third_party_reference o is_active para actualizar.');
    }

    return withTransaction(async (client) => {
        await validateThirdPartyProductScope(client, companyId, thirdPartyId, productId);
        const result = await client.query(`
            INSERT INTO "Fiscal".third_party_products
                (company_id, third_party_id, product_id, third_party_reference, is_active, created_by)
            VALUES ($1, $2, $3, CASE WHEN $4::boolean THEN $5::text ELSE NULL END, COALESCE($6::boolean, true), $7)
            ON CONFLICT ON CONSTRAINT uq_third_party_product
            DO UPDATE SET
                third_party_reference = CASE WHEN $4::boolean THEN EXCLUDED.third_party_reference ELSE "Fiscal".third_party_products.third_party_reference END,
                is_active = COALESCE($6::boolean, "Fiscal".third_party_products.is_active),
                updated_at = now()
            RETURNING *;
        `, [
            companyId,
            thirdPartyId,
            productId,
            hasReference,
            reference,
            info.is_active ?? null,
            performedByFrom(info)
        ]);
        const association = result.rows[0];

        // La referencia también se mantiene en la tabla fiscal anterior para que
        // los consumidores existentes sigan leyendo el mismo valor.
        let referencedTaxRelations = 0;
        let disabledTaxRelations = 0;
        if (hasReference) {
            const synced = await client.query(`
                UPDATE "Fiscal".third_party_product_tax_relations
                SET third_party_reference = $4, updated_at = now()
                WHERE company_id = $1
                  AND third_party_id = $2
                  AND product_id = $3
                  AND third_party_reference IS DISTINCT FROM $4
                RETURNING id;
            `, [companyId, thirdPartyId, productId, reference]);
            referencedTaxRelations = synced.rowCount;
        }
        if (info.is_active === false) {
            const disabled = await client.query(`
                UPDATE "Fiscal".third_party_product_tax_relations
                SET is_active = false, updated_at = now()
                WHERE company_id = $1
                  AND third_party_id = $2
                  AND product_id = $3
                  AND is_active = true
                RETURNING id;
            `, [companyId, thirdPartyId, productId]);
            disabledTaxRelations = disabled.rowCount;
        }

        await auditEvent({
            client,
            companyId,
            eventType: 'third_party_product.updated',
            entitySchema: 'Fiscal',
            entityTable: 'third_party_products',
            entityId: association.id,
            payload: {
                association,
                referenced_tax_relations: referencedTaxRelations,
                disabled_tax_relations: disabledTaxRelations
            },
            performedBy: performedByFrom(info)
        });

        return { status: 'OK', product: association };
    });
};

/**
 * Lista las asociaciones activas de productos de un tercero, incluso cuando
 * todavía no tienen impuestos o retenciones configurados.
 */
productsServicesService.getThirdPartyProductAssociations = async (info) => {
    const companyId = parsePositiveId(info.company_id, 'company_id');
    const thirdPartyId = parsePositiveId(info.third_party_id ?? info.thirdParty_id, 'third_party_id');

    return useDataBase(`
        SELECT
            tpp.id AS association_id,
            tpp.company_id,
            tpp.third_party_id,
            tpp.product_id,
            tpp.third_party_reference,
            tpp.is_active,
            ps.name AS product_name,
            ps.code AS product_code,
            ps.img AS product_img,
            ps.type AS product_type
        FROM "Fiscal".third_party_products tpp
        JOIN "Ecosystem".thirdparties tp
            ON tp.id = tpp.third_party_id
           AND tp.company_id = tpp.company_id
        JOIN "Inventory"."products&services" ps
            ON ps.id = tpp.product_id
           AND ps.company_id = tpp.company_id
        WHERE tpp.company_id = $1
          AND tpp.third_party_id = $2
          AND tpp.is_active = true
        ORDER BY ps.name ASC, ps.id ASC;
    `, [companyId, thirdPartyId], 1);
};

/**
 * Agrega o modifica impuestos y retenciones de un producto para un tercero.
 * Para sincronizar una lista completa, replace:true desactiva lógicamente las
 * relaciones activas omitidas; nunca se eliminan físicamente.
 */
productsServicesService.updateThirdPartyProductTaxRelations = async (info) => {
    const companyId = parsePositiveId(info.company_id, 'company_id');
    const thirdPartyId = parsePositiveId(info.third_party_id ?? info.thirdParty_id, 'third_party_id');
    const productId = parsePositiveId(info.product_id ?? info.productId, 'product_id');
    if (!Array.isArray(info.relations)) {
        throw productRelationError('relations debe ser una lista; envía [] para retirar todas las relaciones activas.');
    }
    if (info.replace !== undefined && typeof info.replace !== 'boolean') {
        throw productRelationError('replace debe ser booleano.');
    }
    if (info.relations.length === 0 && info.replace !== true) {
        throw productRelationError('Envía al menos una relación o usa replace:true para desactivar todas.');
    }

    const seenKeys = new Set();
    const relations = info.relations.map((relation, index) => {
        if (!relation || typeof relation !== 'object' || Array.isArray(relation)) {
            throw productRelationError(`relations[${index}] debe ser un objeto.`);
        }
        const normalized = {
            tax_id: parsePositiveId(relation.tax_id ?? relation.taxId, `relations[${index}].tax_id`),
            operation_type: normalizeOperationType(relation.operation_type ?? relation.operationType),
            tax_role: normalizeTaxRole(relation.tax_role ?? relation.taxRole),
            priority: relation.priority === undefined ? index : Number(relation.priority),
            valid_from: normalizeDateOnly(relation.valid_from, `relations[${index}].valid_from`),
            valid_until: normalizeDateOnly(relation.valid_until, `relations[${index}].valid_until`),
            notes: relation.notes,
            valid_from_provided: Object.prototype.hasOwnProperty.call(relation, 'valid_from'),
            valid_until_provided: Object.prototype.hasOwnProperty.call(relation, 'valid_until'),
            notes_provided: Object.prototype.hasOwnProperty.call(relation, 'notes')
        };
        if (!Number.isSafeInteger(normalized.priority) || normalized.priority < 0) {
            throw productRelationError(`relations[${index}].priority debe ser un entero no negativo.`);
        }
        if (relation.notes !== undefined && relation.notes !== null && typeof relation.notes !== 'string') {
            throw productRelationError(`relations[${index}].notes debe ser texto o null.`);
        }
        if (normalized.valid_from && normalized.valid_until && normalized.valid_until < normalized.valid_from) {
            throw productRelationError(`relations[${index}].valid_until debe ser igual o posterior a valid_from.`);
        }
        const key = `${normalized.operation_type}:${normalized.tax_role}:${normalized.tax_id}`;
        if (seenKeys.has(key)) throw productRelationError(`La relación ${key} está duplicada.`);
        seenKeys.add(key);
        return normalized;
    });

    return withTransaction(async (client) => {
        await validateThirdPartyProductScope(client, companyId, thirdPartyId, productId);
        const associationResult = await client.query(`
            SELECT third_party_reference
            FROM "Fiscal".third_party_products
            WHERE company_id = $1
              AND third_party_id = $2
              AND product_id = $3
              AND is_active = true
            FOR UPDATE;
        `, [companyId, thirdPartyId, productId]);
        if (!associationResult.rows[0]) {
            throw productRelationError('El producto no está asociado activamente al tercero.', 404, 'THIRD_PARTY_PRODUCT_NOT_FOUND');
        }

        const taxIds = [...new Set(relations.map(relation => relation.tax_id))];
        if (taxIds.length > 0) {
            const taxResult = await client.query(`
                SELECT id, "isRetention"
                FROM "Ecosystem".taxes
                WHERE company_id = $1 AND id = ANY($2::bigint[])
                FOR KEY SHARE;
            `, [companyId, taxIds]);
            const taxesById = new Map(taxResult.rows.map(tax => [Number(tax.id), tax]));
            if (taxesById.size !== taxIds.length) {
                throw productRelationError('Una o más tasas no existen en la compañía indicada.', 422, 'INVALID_TAX_RELATION');
            }
            for (const relation of relations) {
                const tax = taxesById.get(relation.tax_id);
                if (Boolean(tax.isRetention) !== (relation.tax_role === 'withholding')) {
                    throw productRelationError(`El impuesto ${relation.tax_id} no coincide con el rol ${relation.tax_role}.`, 422, 'TAX_ROLE_MISMATCH');
                }
            }
        }

        if (info.replace === true) {
            for (const [operationType, taxRole] of THIRD_PARTY_PRODUCT_TAX_SCOPES) {
                const taxIdsInScope = relations
                    .filter(relation => relation.operation_type === operationType && relation.tax_role === taxRole)
                    .map(relation => relation.tax_id);
                await client.query(`
                    UPDATE "Fiscal".third_party_product_tax_relations
                    SET is_active = false, updated_at = now()
                    WHERE company_id = $1
                      AND third_party_id = $2
                      AND product_id = $3
                      AND operation_type = $4::"Fiscal".third_party_product_tax_operation
                      AND tax_role = $5::"Fiscal".third_party_product_tax_role
                      AND is_active = true
                      AND NOT (tax_id = ANY($6::bigint[]));
                `, [companyId, thirdPartyId, productId, operationType, taxRole, taxIdsInScope]);
            }
        }

        const reference = associationResult.rows[0].third_party_reference;
        const savedRelations = [];
        for (const relation of relations) {
            const saved = await client.query(`
                INSERT INTO "Fiscal".third_party_product_tax_relations (
                    company_id, third_party_id, product_id, tax_id,
                    operation_type, tax_role, is_active, priority,
                    valid_from, valid_until, notes, third_party_reference, created_by
                ) VALUES (
                    $1, $2, $3, $4,
                    $5::"Fiscal".third_party_product_tax_operation,
                    $6::"Fiscal".third_party_product_tax_role,
                    true, $7, $8, $9, $10, $11, $12
                )
                ON CONFLICT ON CONSTRAINT uq_third_party_product_tax_relation
                DO UPDATE SET
                    is_active = true,
                    priority = EXCLUDED.priority,
                    valid_from = CASE WHEN $13::boolean THEN EXCLUDED.valid_from ELSE "Fiscal".third_party_product_tax_relations.valid_from END,
                    valid_until = CASE WHEN $14::boolean THEN EXCLUDED.valid_until ELSE "Fiscal".third_party_product_tax_relations.valid_until END,
                    notes = CASE WHEN $15::boolean THEN EXCLUDED.notes ELSE "Fiscal".third_party_product_tax_relations.notes END,
                    third_party_reference = EXCLUDED.third_party_reference,
                    updated_at = now()
                RETURNING *;
            `, [
                companyId,
                thirdPartyId,
                productId,
                relation.tax_id,
                relation.operation_type,
                relation.tax_role,
                relation.priority,
                relation.valid_from,
                relation.valid_until,
                relation.notes ?? null,
                reference,
                performedByFrom(info),
                relation.valid_from_provided,
                relation.valid_until_provided,
                relation.notes_provided
            ]);
            savedRelations.push(saved.rows[0]);
        }

        await auditEvent({
            client,
            companyId,
            eventType: 'third_party_product_tax_relations.synchronized',
            entitySchema: 'Fiscal',
            entityTable: 'third_party_product_tax_relations',
            entityId: savedRelations[0]?.id ?? null,
            payload: { third_party_id: thirdPartyId, product_id: productId, replace: info.replace === true, relations: savedRelations },
            performedBy: performedByFrom(info)
        });

        const activeRelations = await client.query(`
            SELECT *
            FROM "Fiscal".third_party_product_tax_relations
            WHERE company_id = $1
              AND third_party_id = $2
              AND product_id = $3
              AND is_active = true
            ORDER BY operation_type, tax_role, priority, id;
        `, [companyId, thirdPartyId, productId]);

        return { status: 'OK', relations: activeRelations.rows };
    });
};

productsServicesService.updateThirdPartyProductTaxRelation = async (info) => {
    const relationId = parseInt(info.id ?? info.relation_id);
    if (!Number.isInteger(relationId)) {
        throw new Error('id/relation_id es requerido para actualizar la relación.');
    }

    const normalized = {
        operation_type: info.operation_type !== undefined || info.operationType !== undefined
            ? normalizeOperationType(info.operation_type ?? info.operationType)
            : null,
        tax_role: info.tax_role !== undefined || info.taxRole !== undefined
            ? normalizeTaxRole(info.tax_role ?? info.taxRole)
            : null,
        tax_id: info.tax_id !== undefined || info.taxId !== undefined
            ? parseInt(info.tax_id ?? info.taxId)
            : null,
        is_active: info.is_active,
        priority: info.priority !== undefined ? parseInt(info.priority) : null,
        valid_from: info.valid_from ?? null,
        valid_until: info.valid_until ?? null,
        notes: info.notes ?? null,
        third_party_reference: info.third_party_reference ?? info.thirdPartyReference ?? null
    };

    if (normalized.tax_id !== null && !Number.isInteger(normalized.tax_id)) {
        throw new Error('tax_id inválido.');
    }

    return withTransaction(async (client) => {
        const result = await client.query(`
            UPDATE "Fiscal".third_party_product_tax_relations
            SET
                tax_id = COALESCE($1, tax_id),
                operation_type = COALESCE($2::"Fiscal".third_party_product_tax_operation, operation_type),
                tax_role = COALESCE($3::"Fiscal".third_party_product_tax_role, tax_role),
                is_active = COALESCE($4, is_active),
                priority = COALESCE($5, priority),
                valid_from = CASE WHEN $6::boolean THEN $7::date ELSE valid_from END,
                valid_until = CASE WHEN $8::boolean THEN $9::date ELSE valid_until END,
                notes = CASE WHEN $10::boolean THEN $11::text ELSE notes END,
                third_party_reference = CASE WHEN $12::boolean THEN $13::text ELSE third_party_reference END,
                updated_at = now()
            WHERE id = $14
              AND ($15::bigint IS NULL OR company_id = $15)
            RETURNING *;
        `, [
            normalized.tax_id,
            normalized.operation_type,
            normalized.tax_role,
            normalized.is_active,
            normalized.priority,
            info.valid_from !== undefined,
            normalized.valid_from,
            info.valid_until !== undefined,
            normalized.valid_until,
            info.notes !== undefined,
            normalized.notes,
            info.third_party_reference !== undefined || info.thirdPartyReference !== undefined,
            normalized.third_party_reference,
            relationId,
            info.company_id ?? null
        ]);

        if (!result.rows[0]) {
            throw new Error(`No existe relación ${relationId}.`);
        }

        await auditEvent({
            client,
            companyId: result.rows[0].company_id,
            eventType: 'third_party_product_tax_relation.updated',
            entitySchema: 'Fiscal',
            entityTable: 'third_party_product_tax_relations',
            entityId: relationId,
            payload: result.rows[0],
            performedBy: performedByFrom(info)
        });

        return {
            status: 'OK',
            relation: result.rows[0]
        };
    });
};

productsServicesService.disableThirdPartyProductTaxRelation = async (info) => {
    const relationId = parseInt(info.id ?? info.relation_id);
    if (!Number.isInteger(relationId)) {
        throw new Error('id/relation_id es requerido para desactivar la relación.');
    }

    return withTransaction(async (client) => {
        const result = await client.query(`
            UPDATE "Fiscal".third_party_product_tax_relations
            SET is_active = false, updated_at = now()
            WHERE id = $1
              AND ($2::bigint IS NULL OR company_id = $2)
            RETURNING *;
        `, [relationId, info.company_id ?? null]);

        if (!result.rows[0]) {
            throw new Error(`No existe relación ${relationId}.`);
        }

        await auditEvent({
            client,
            companyId: result.rows[0].company_id,
            eventType: 'third_party_product_tax_relation.disabled',
            entitySchema: 'Fiscal',
            entityTable: 'third_party_product_tax_relations',
            entityId: relationId,
            payload: result.rows[0],
            performedBy: performedByFrom(info)
        });

        return {
            status: 'OK',
            relation: result.rows[0]
        };
    });
};

productsServicesService.deleteThirdPartyProductTaxRelation = async (info) => {
    const relationId = parseInt(info.id ?? info.relation_id);
    if (!Number.isInteger(relationId)) {
        throw new Error('id/relation_id es requerido para eliminar la relación.');
    }

    return withTransaction(async (client) => {
        const result = await client.query(`
            DELETE FROM "Fiscal".third_party_product_tax_relations
            WHERE id = $1
              AND ($2::bigint IS NULL OR company_id = $2)
            RETURNING *;
        `, [relationId, info.company_id ?? null]);

        if (!result.rows[0]) {
            throw new Error(`No existe relación ${relationId}.`);
        }

        await auditEvent({
            client,
            companyId: result.rows[0].company_id,
            eventType: 'third_party_product_tax_relation.deleted',
            entitySchema: 'Fiscal',
            entityTable: 'third_party_product_tax_relations',
            entityId: relationId,
            payload: result.rows[0],
            performedBy: performedByFrom(info)
        });

        return {
            status: 'OK',
            relation: result.rows[0]
        };
    });
};

productsServicesService.getThirdPartyProductTaxRelations = async (info) => {
    const values = [];
    const where = [];

    if (info.company_id !== undefined) {
        values.push(info.company_id);
        where.push(`tpptr.company_id = $${values.length}`);
    }

    if (info.id !== undefined || info.relation_id !== undefined) {
        values.push(info.id ?? info.relation_id);
        where.push(`tpptr.id = $${values.length}`);
    }

    if (info.third_party_id !== undefined || info.thirdParty_id !== undefined) {
        values.push(info.third_party_id ?? info.thirdParty_id);
        where.push(`tpptr.third_party_id = $${values.length}`);
    }

    if (info.product_id !== undefined || info.productId !== undefined) {
        values.push(info.product_id ?? info.productId);
        where.push(`tpptr.product_id = $${values.length}`);
    }

    if (info.tax_id !== undefined || info.taxId !== undefined) {
        values.push(info.tax_id ?? info.taxId);
        where.push(`tpptr.tax_id = $${values.length}`);
    }

    if (info.operation_type !== undefined || info.operationType !== undefined) {
        values.push(normalizeOperationType(info.operation_type ?? info.operationType));
        where.push(`tpptr.operation_type = $${values.length}::"Fiscal".third_party_product_tax_operation`);
    }

    if (info.tax_role !== undefined || info.taxRole !== undefined) {
        values.push(normalizeTaxRole(info.tax_role ?? info.taxRole));
        where.push(`tpptr.tax_role = $${values.length}::"Fiscal".third_party_product_tax_role`);
    }

    if (info.active_only !== false) {
        where.push('tpptr.is_active = true');
    }

    const whereQuery = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    return useDataBase(`
        SELECT
            tpptr.*,
            tpptr.operation_type::text AS operation,
            tpptr.tax_role::text AS role,
            tp.names AS third_party_name,
            tp.indentification_number,
            ps.code AS product_code,
            ps.name AS product_name,
            ps.type AS product_type,
            t.code AS tax_code,
            t.rate,
            t.base,
            t.account_id AS tax_account,
            t."isRetention",
            t.type::text AS tax_type,
            ca.name AS tax_name,
            ca.type AS account_type
        FROM "Fiscal".third_party_product_tax_relations tpptr
        JOIN "Ecosystem".thirdparties tp
            ON tp.id = tpptr.third_party_id
        JOIN "Inventory"."products&services" ps
            ON ps.id = tpptr.product_id
        JOIN "Ecosystem".taxes t
            ON t.id = tpptr.tax_id
        LEFT JOIN "Ecosystem".contable_accounts ca
            ON ca.id = t.account_id
        ${whereQuery}
        ORDER BY tpptr.priority ASC, ca.name ASC, tpptr.id ASC;
    `, values, 1);
};

export default productsServicesService;
