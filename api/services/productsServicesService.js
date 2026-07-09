import { withTransaction, useDataBase } from "../app.js";

const productsServicesService = {};

const RELATION_TYPES = {
    PURCHASE_TAX: 'purchase_tax',
    PURCHASE_WITHHOLDING: 'purchase_withholding',
    SELL_TAX: 'sell_tax',
    SELL_WITHHOLDING: 'sell_withholding'
};

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

const auditEvent = async ({ client, companyId, eventType, entityTable, entityId, payload, performedBy }) => {
    try {
        await client.query(`
            INSERT INTO "Fiscal".audit_events
                (company_id, event_type, entity_schema, entity_table, entity_id, payload, performed_by)
            VALUES ($1, $2, 'Inventory', $3, $4, $5::jsonb, $6);
        `, [
            companyId ?? null,
            eventType,
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

export default productsServicesService;
