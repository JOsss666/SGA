import { useDataBase, withTransaction } from "../app.js";

/**
 * thirdPartyService — Etapa 5 del refactor de terceros (doble escritura).
 *
 * Política: el modelo legacy ("Ecosystem") sigue siendo la fuente de verdad.
 * Toda escritura legacy se ejecuta primero; la sincronización al modelo nuevo
 * ("Fiscal") es idempotente y NUNCA tumba el request — si falla, se loguea
 * fuerte y se puede re-sincronizar después (mismo patrón que la migración 0009).
 *
 * Auditoría: cada acción de negocio registra un evento en "Fiscal".audit_events.
 */
const thirdPartyService = {};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers del modelo Fiscal (todos idempotentes)
// ─────────────────────────────────────────────────────────────────────────────

const auditEvent = async ({ companyId, eventType, entityTable, entityId, payload, performedBy }) => {
    try {
        await useDataBase(`
            INSERT INTO "Fiscal".audit_events
                (company_id, event_type, entity_schema, entity_table, entity_id, payload, performed_by)
            VALUES ($1, $2, 'Fiscal', $3, $4, $5::jsonb, $6)
            RETURNING id;
        `, [companyId ?? null, eventType, entityTable ?? null, entityId ?? null,
            JSON.stringify(payload ?? {}), performedBy ?? 'api'], 3);
    } catch (err) {
        // La auditoría jamás bloquea una operación de negocio.
        console.error('⚠️ [Fiscal] No se pudo registrar audit_event:', eventType, err);
    }
};

// Garantiza la relación tercero↔compañía en el modelo nuevo y devuelve sus ids.
// Si no se conoce company_id, la resuelve desde el propio tercero legacy.
const ensureRelations = async (thirdPartyId, companyId = null, { status, municipalityExtCode, localityId } = {}) => {
    await useDataBase(`
        INSERT INTO "Fiscal".third_party_company_relations
            (third_party_id, company_id, status, jurisdiction_id, locality_id, notes)
        SELECT t.id, t.company_id, COALESCE($2, 'active'),
               (SELECT j.id FROM "Fiscal".jurisdictions j
                 WHERE j.level = 'municipality' AND j.external_code = COALESCE(NULLIF(TRIM($3), ''), '164')),
               (SELECT l.id
                  FROM "Fiscal".localities l
                  JOIN "Fiscal".jurisdictions j ON j.id = l.municipality_id
                 WHERE j.level = 'municipality'
                   AND j.external_code = COALESCE(NULLIF(TRIM($3), ''), '164')
                   AND ($4::bigint IS NULL OR l.id = $4)
                 ORDER BY (l.id = $4::bigint) DESC, l.is_municipal_seat DESC
                 LIMIT 1),
               'Creado por doble escritura (Etapa 5)'
        FROM "Ecosystem".thirdparties t
        WHERE t.id = $1
        ON CONFLICT ON CONSTRAINT uq_tp_company_relation DO NOTHING;
    `, [thirdPartyId, status ?? null, municipalityExtCode ?? null, localityId ?? null], 2);

    const [ok, rows] = await useDataBase(`
        SELECT id, company_id
        FROM "Fiscal".third_party_company_relations
        WHERE third_party_id = $1 AND ($2::bigint IS NULL OR company_id = $2);
    `, [thirdPartyId, companyId ?? null], 1);

    return ok ? rows : [];
};

// Mapea un valor crudo (texto libre / código Factus) contra el catálogo.
// Devuelve la fila del catálogo o null si no matchea.
const mapClassificationValue = async (typeCode, rawValue) => {
    const value = (rawValue ?? '').toString().trim();
    if (value === '' || value === '-') return null;

    const [ok, rows] = await useDataBase(`
        SELECT cv.id, cv.code, cv.name, cv.external_code
        FROM "Fiscal".tax_classification_values cv
        JOIN "Fiscal".tax_classification_types ct ON ct.id = cv.classification_type_id
        WHERE ct.code = $1
          AND cv.active
          AND (cv.external_code = $2 OR UPPER(cv.code) = UPPER($2) OR LOWER(cv.name) = LOWER($2))
        LIMIT 1;
    `, [typeCode, value], 1);

    return ok ? rows[0] : null;
};

// Inserta una NUEVA clasificación (historia, nunca UPDATE) solo si el valor
// vigente es distinto. Devuelve true si hubo cambio.
const classifyIfChanged = async (relationId, typeCode, rawValue, { source = 'manual', performedBy, companyId } = {}) => {
    const mapped = await mapClassificationValue(typeCode, rawValue);

    if (mapped === null) {
        const raw = (rawValue ?? '').toString().trim();
        if (raw !== '' && raw !== '-') {
            // Valor no mapeable: no ensuciamos el modelo nuevo, pero queda auditado.
            await auditEvent({
                companyId,
                eventType: 'tax_classification.unmapped_value',
                entityTable: 'third_party_tax_classifications',
                entityId: relationId,
                payload: { classification_type: typeCode, raw_value: raw },
                performedBy
            });
        }
        return false;
    }

    const inserted = await useDataBase(`
        INSERT INTO "Fiscal".third_party_tax_classifications
            (relation_id, classification_type_id, classification_value_id,
             classification_date, source, notes, created_by)
        SELECT $1, ct.id, $2, CURRENT_DATE, $3, $4, $5
        FROM "Fiscal".tax_classification_types ct
        WHERE ct.code = $6
          AND NOT EXISTS (
              SELECT 1 FROM "Fiscal".v_third_party_current_classifications c
              WHERE c.relation_id = $1
                AND c.classification_type_code = $6
                AND c.classification_value_id = $2
          )
        RETURNING id;
    `, [relationId, mapped.id, source,
        `Valor recibido: ${(rawValue ?? '').toString().trim()}`, performedBy ?? 'api', typeCode], 3);

    return inserted?.id !== undefined;
};

// Adjunta un documento RUT si el valor es un archivo/URL real y aún no existe.
const attachRutIfPresent = async (relationId, attachedRut, performedBy) => {
    const url = (attachedRut ?? '').toString().trim();
    if (!/^http/i.test(url)) return false;

    const inserted = await useDataBase(`
        INSERT INTO "Fiscal".third_party_documents
            (relation_id, document_type_id, file_url, status, uploaded_by)
        SELECT $1, dt.id, $2, 'valid', $3
        FROM "Fiscal".document_types dt
        WHERE dt.code = 'RUT'
          AND NOT EXISTS (
              SELECT 1 FROM "Fiscal".third_party_documents e
              WHERE e.relation_id = $1 AND e.file_url = $2
          )
        RETURNING id;
    `, [relationId, url, performedBy ?? 'api'], 3);

    return inserted?.id !== undefined;
};

// Sincroniza roles con el 'type' legacy: activa el/los objetivo y desactiva el resto.
// 'both' → client + supplier.
const syncRoles = async (relationIds, legacyType) => {
    if (!relationIds.length || !legacyType) return;
    const targets = legacyType === 'both' ? ['client', 'supplier'] : [legacyType];

    for (const relationId of relationIds) {
        for (const role of targets) {
            await useDataBase(`
                INSERT INTO "Fiscal".third_party_roles (relation_id, role)
                VALUES ($1, $2)
                ON CONFLICT ON CONSTRAINT uq_tp_role
                DO UPDATE SET active = true, ended_at = NULL;
            `, [relationId, role], 2);
        }
        await useDataBase(`
            UPDATE "Fiscal".third_party_roles
            SET active = false, ended_at = now()
            WHERE relation_id = $1 AND active AND NOT (role = ANY($2::varchar[]));
        `, [relationId, targets], 2);
    }
};

const setRelationStatus = async (relationIds, status) => {
    if (!relationIds.length) return;
    await useDataBase(`
        UPDATE "Fiscal".third_party_company_relations
        SET status = $2, updated_at = now()
        WHERE id = ANY($1::bigint[]);
    `, [relationIds, status], 2);
};

// Sync completo al crear (idéntico en espíritu a la migración 0009, para 1 tercero).
const syncFiscalCreate = async (thirdPartyId, info, performedBy) => {
    const relations = await ensureRelations(thirdPartyId, info.company_id, {
        status: info.comercial_state,
        municipalityExtCode: info.mucipality_id ?? info.municipality_id, // typo legacy respetado
        localityId: info.locality_id
    });
    if (!relations.length) throw new Error(`Sin relación Fiscal para tercero ${thirdPartyId}`);

    const relationIds = relations.map(r => r.id);
    await syncRoles(relationIds, info.type);

    for (const r of relations) {
        const opts = { source: 'manual', performedBy, companyId: r.company_id };
        await classifyIfChanged(r.id, 'IVA_RESPONSIBILITY', info.IVA_responsability, opts);
        await classifyIfChanged(r.id, 'TAX_REGIME', info.regime, opts);
        await classifyIfChanged(r.id, 'RETENTION_AGENT', info.retention_type, opts);
        await attachRutIfPresent(r.id, info.attachedRut, performedBy);
    }

    await auditEvent({
        companyId: info.company_id,
        eventType: 'third_party.created',
        entityTable: 'third_party_company_relations',
        entityId: relationIds[0],
        payload: {
            third_party_id: thirdPartyId,
            type: info.type,
            indentification_number: info.indentification_number,
            IVA_responsability: info.IVA_responsability ?? null,
            regime: info.regime ?? null,
            retention_type: info.retention_type ?? null
        },
        performedBy
    });
};

const performedByFrom = (info) => info.user ?? info.userName ?? info.performed_by ?? 'api';

// ─────────────────────────────────────────────────────────────────────────────
// Acciones de negocio
// ─────────────────────────────────────────────────────────────────────────────

// Crea el tercero: legacy (3 INSERTs, ahora atómicos) + sync Fiscal no bloqueante.
thirdPartyService.register = async (info) => {
    const taxConfig = typeof info.taxConfig === 'string'
        ? info.taxConfig
        : JSON.stringify(info.taxConfig ?? {});

    const idNewThirdParty = await withTransaction(async (client) => {
        const tpResult = await client.query(`
            INSERT INTO "Ecosystem".thirdparties(
                company_id, names, "lastNames",
                first_name, second_name, first_surname, second_surname,
                indentification_type, indentification_number,
                mail, phone, country, city, address, type)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            RETURNING id;
        `, [
            info.company_id,
            `${info.first_name}${info.second_name ? ` ${info.second_name}` : ''}`,
            `${info.first_surname}${info.second_surname ? ` ${info.second_surname}` : ''}`,
            info.first_name, info.second_name, info.first_surname, info.second_surname,
            info.indentification_type, info.indentification_number,
            info.mail, info.phone, info.country, info.city, info.address, info.type
        ]);
        const newId = parseInt(tpResult.rows[0].id);

        await client.query(`
            INSERT INTO "Ecosystem"."thirdPartyComercialInfo"(
                "thirdParty_id", company_id, credit, credit_term, credit_value, interest_rate, comercial_state)
            VALUES ($1,$2,$3,$4,$5,$6,$7);
        `, [newId, info.company_id, info.credit, info.credit_term,
            info.credit_value, info.interest_rate, info.comercial_state]);

        await client.query(`
            INSERT INTO "Ecosystem"."thirdPartyTaxInfo"(
                "thirdParty_id", company_id, regime, "IVA_responsability", retention_type,
                economic_activity, "attachedRut", municipality_id, nature, "identidicationType_id",
                "taxConfig")
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb);
        `, [newId, info.company_id, info.regime, info.IVA_responsability, info.retention_type,
            info.economic_activity, info.attachedRut ?? '',
            info.mucipality_id ?? info.municipality_id, info.typePerson, info.identidicationType_id,
            taxConfig]);

        return newId;
    });

    // Doble escritura: el modelo nuevo nunca tumba el request.
    try {
        await syncFiscalCreate(idNewThirdParty, info, performedByFrom(info));
    } catch (err) {
        console.error(`🚨 [Fiscal] Falló el sync de creación del tercero ${idNewThirdParty} (legacy OK):`, err);
    }

    return [true, idNewThirdParty];
};

// Actualización de datos generales: legacy UPDATE + sync de roles si cambió el type.
thirdPartyService.updateGeneralInfo = async (info) => {
    const consulta = await useDataBase(`
        UPDATE "Ecosystem".thirdparties
        SET names=$1, "lastNames"=$2, first_name=$3, second_name=$4,
            first_surname=$5, second_surname=$6,
            indentification_type=$7, indentification_number=$8,
            mail=$9, phone=$10, country=$11, city=$12, address=$13, type=$14
        WHERE id = $15;
    `, [
        `${info.first_name}${info.second_name ? ` ${info.second_name}` : ''}`,
        `${info.first_surname}${info.second_surname ? ` ${info.second_surname}` : ''}`,
        info.first_name, info.second_name, info.first_surname, info.second_surname,
        info.indentification_type, info.indentification_number,
        info.mail, info.phone, info.country, info.city, info.address, info.type, info.id
    ], 2);

    try {
        const relations = await ensureRelations(info.id);
        await syncRoles(relations.map(r => r.id), info.type);
        await auditEvent({
            companyId: relations[0]?.company_id,
            eventType: 'third_party.role_changed',
            entityTable: 'third_party_company_relations',
            entityId: relations[0]?.id,
            payload: { third_party_id: info.id, type: info.type },
            performedBy: performedByFrom(info)
        });
    } catch (err) {
        console.error(`🚨 [Fiscal] Falló el sync de roles del tercero ${info.id} (legacy OK):`, err);
    }

    return consulta;
};

// Actualización comercial: legacy UPDATE + status de la relación Fiscal.
thirdPartyService.updateComercialInfo = async (info) => {
    const consulta = await useDataBase(`
        UPDATE "Ecosystem"."thirdPartyComercialInfo"
        SET credit=$1, credit_term=$2, credit_value=$3, interest_rate=$4, comercial_state=$5
        WHERE "thirdParty_id" = $6;
    `, [info.credit, info.credit_term, info.credit_value,
        info.interest_rate, info.comercial_state, info.id], 2);

    try {
        const relations = await ensureRelations(info.id);
        if (info.comercial_state) {
            await setRelationStatus(relations.map(r => r.id), info.comercial_state);
        }
        await auditEvent({
            companyId: relations[0]?.company_id,
            eventType: 'third_party.comercial_changed',
            entityTable: 'third_party_company_relations',
            entityId: relations[0]?.id,
            payload: {
                third_party_id: info.id,
                comercial_state: info.comercial_state,
                credit: info.credit, credit_term: info.credit_term,
                credit_value: info.credit_value, interest_rate: info.interest_rate
            },
            performedBy: performedByFrom(info)
        });
    } catch (err) {
        console.error(`🚨 [Fiscal] Falló el sync comercial del tercero ${info.id} (legacy OK):`, err);
    }

    return consulta;
};

// Actualización fiscal: legacy UPDATE (destructivo, como siempre) + en Fiscal
// se INSERTA nueva clasificación por cada tipo cuyo valor cambió (historia real).
thirdPartyService.updateTaxInfo = async (info) => {
    const consulta = await useDataBase(`
        UPDATE "Ecosystem"."thirdPartyTaxInfo"
        SET regime=$1, "IVA_responsability"=$2, retention_type=$3,
            economic_activity=$4, "attachedRut"=$5, nature=$6, "identidicationType_id"=$7
        WHERE "thirdParty_id" = $8 AND company_id = $9;
    `, [info.regime, info.IVA_responsability, info.retention_type,
        info.economic_activity, info.attachedRut ?? '-', info.nature,
        info.identidicationType_id, info.thirdParty_id, info.company_id], 2);

    try {
        const performedBy = performedByFrom(info);
        const relations = await ensureRelations(info.thirdParty_id, info.company_id);
        const changes = {};

        for (const r of relations) {
            const opts = { source: 'manual', performedBy, companyId: r.company_id };
            changes.IVA_RESPONSIBILITY = await classifyIfChanged(r.id, 'IVA_RESPONSIBILITY', info.IVA_responsability, opts);
            changes.TAX_REGIME        = await classifyIfChanged(r.id, 'TAX_REGIME', info.regime, opts);
            changes.RETENTION_AGENT   = await classifyIfChanged(r.id, 'RETENTION_AGENT', info.retention_type, opts);
            changes.rut_document      = await attachRutIfPresent(r.id, info.attachedRut, performedBy);

            // Domicilio fiscal solo si el payload lo trae (el form actual no lo edita).
            const municipality = info.municipality_id ?? info.mucipality_id;
            if (municipality !== undefined && municipality !== null && `${municipality}`.trim() !== '') {
                await useDataBase(`
                    UPDATE "Fiscal".third_party_company_relations r
                    SET jurisdiction_id = j.id, updated_at = now()
                    FROM "Fiscal".jurisdictions j
                    WHERE r.id = $1 AND j.level = 'municipality' AND j.external_code = $2
                      AND (r.jurisdiction_id IS DISTINCT FROM j.id);
                `, [r.id, `${municipality}`.trim()], 2);
            }
        }

        if (Object.values(changes).some(Boolean)) {
            await auditEvent({
                companyId: info.company_id,
                eventType: 'third_party.tax_info_changed',
                entityTable: 'third_party_tax_classifications',
                entityId: relations[0]?.id,
                payload: { third_party_id: info.thirdParty_id, changes,
                           received: { regime: info.regime, IVA_responsability: info.IVA_responsability,
                                       retention_type: info.retention_type } },
                performedBy
            });
        }
    } catch (err) {
        console.error(`🚨 [Fiscal] Falló el sync fiscal del tercero ${info.thirdParty_id} (legacy OK):`, err);
    }

    return consulta;
};

// Bloqueo (capacidad NUEVA, nace en el modelo Fiscal y se refleja al legacy).
thirdPartyService.block = async (info) => {
    if (!info.thirdParty_id) throw new Error('thirdParty_id es requerido');
    if (!info.reason || !`${info.reason}`.trim()) throw new Error('El motivo del bloqueo es requerido');

    const relations = await ensureRelations(info.thirdParty_id, info.company_id ?? null);
    if (!relations.length) throw new Error(`El tercero ${info.thirdParty_id} no existe`);

    const blocks = [];
    for (const r of relations) {
        const block = await useDataBase(`
            INSERT INTO "Fiscal".third_party_blocks
                (relation_id, block_type, reason, blocked_by, ends_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `, [r.id, info.block_type ?? 'manual', `${info.reason}`.trim(),
            performedByFrom(info), info.ends_at ?? null], 3);
        blocks.push(block?.id);
    }

    await setRelationStatus(relations.map(r => r.id), 'blocked');

    // Reflejo al modelo legacy para que la app actual vea el bloqueo.
    await useDataBase(`
        UPDATE "Ecosystem"."thirdPartyComercialInfo"
        SET comercial_state = 'blocked'
        WHERE "thirdParty_id" = $1 AND ($2::bigint IS NULL OR company_id = $2);
    `, [info.thirdParty_id, info.company_id ?? null], 2);

    await auditEvent({
        companyId: info.company_id ?? relations[0].company_id,
        eventType: 'third_party.blocked',
        entityTable: 'third_party_blocks',
        entityId: blocks[0],
        payload: { third_party_id: info.thirdParty_id, block_type: info.block_type ?? 'manual',
                   reason: `${info.reason}`.trim(), ends_at: info.ends_at ?? null },
        performedBy: performedByFrom(info)
    });

    return [true, { blocks }];
};

// Desbloqueo: libera los bloqueos activos y restaura el estado en ambos modelos.
thirdPartyService.unblock = async (info) => {
    if (!info.thirdParty_id) throw new Error('thirdParty_id es requerido');

    const relations = await ensureRelations(info.thirdParty_id, info.company_id ?? null);
    if (!relations.length) throw new Error(`El tercero ${info.thirdParty_id} no existe`);
    const relationIds = relations.map(r => r.id);

    const [, released] = await useDataBase(`
        UPDATE "Fiscal".third_party_blocks
        SET released_at = now(), released_by = $2
        WHERE relation_id = ANY($1::bigint[]) AND released_at IS NULL;
    `, [relationIds, performedByFrom(info)], 2);

    await setRelationStatus(relationIds, info.restore_state ?? 'active');

    await useDataBase(`
        UPDATE "Ecosystem"."thirdPartyComercialInfo"
        SET comercial_state = $3
        WHERE "thirdParty_id" = $1 AND ($2::bigint IS NULL OR company_id = $2);
    `, [info.thirdParty_id, info.company_id ?? null, info.restore_state ?? 'active'], 2);

    await auditEvent({
        companyId: info.company_id ?? relations[0].company_id,
        eventType: 'third_party.unblocked',
        entityTable: 'third_party_company_relations',
        entityId: relationIds[0],
        payload: { third_party_id: info.thirdParty_id, released_blocks: released },
        performedBy: performedByFrom(info)
    });

    return [true, { released_blocks: released }];
};

// Borrado físico seguro: solo se permite cuando el tercero no tiene actividad
// transaccional. La configuración comercial/fiscal se limpia por CASCADE.
thirdPartyService.remove = async (info) => {
    const thirdPartyId = Number(info.thirdParty_id ?? info.suppliers?.[0]);
    const companyId = Number(info.company_id);

    if (!Number.isInteger(thirdPartyId) || thirdPartyId <= 0) {
        const error = new Error('thirdParty_id es requerido');
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(companyId) || companyId <= 0) {
        const error = new Error('company_id es requerido');
        error.statusCode = 400;
        throw error;
    }

    return withTransaction(async (client) => {
        const thirdPartyResult = await client.query(`
            SELECT t.*,
                   to_jsonb(ci) AS commercial_info,
                   to_jsonb(ti) AS tax_info
            FROM "Ecosystem".thirdparties t
            LEFT JOIN "Ecosystem"."thirdPartyComercialInfo" ci
                   ON ci."thirdParty_id" = t.id AND ci.company_id = t.company_id
            LEFT JOIN "Ecosystem"."thirdPartyTaxInfo" ti
                   ON ti."thirdParty_id" = t.id AND ti.company_id = t.company_id
            WHERE t.id = $1 AND t.company_id = $2
            FOR UPDATE OF t;
        `, [thirdPartyId, companyId]);

        if (thirdPartyResult.rowCount === 0) {
            const error = new Error('El tercero no existe o no pertenece a la compañía');
            error.statusCode = 404;
            throw error;
        }

        const movementsResult = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM "Ecosystem".documents
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS documents,
                (SELECT COUNT(*) FROM "Ecosystem".transactions
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS transactions,
                (SELECT COUNT(*) FROM "Ecosystem".transaction_detail
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS transaction_details,
                (SELECT COUNT(*) FROM "Inventory"."inventoryMovements"
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS inventory_movements,
                (SELECT COUNT(*) FROM "Inventory".services_movement
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS service_movements,
                (SELECT COUNT(*) FROM "Process".process_instance
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS process_instances,
                (SELECT COUNT(*) FROM "Treasury".accounts_receivable
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS accounts_receivable,
                (SELECT COUNT(*) FROM "Treasury".portfolio_payments
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS portfolio_payments,
                (SELECT COUNT(*) FROM "Treasury".accounts_payable
                  WHERE "thirdParty_id" = $1 AND company_id = $2) AS accounts_payable;
        `, [thirdPartyId, companyId]);

        const dependencies = Object.fromEntries(
            Object.entries(movementsResult.rows[0] ?? {})
                .map(([name, total]) => [name, Number(total)])
                .filter(([, total]) => total > 0)
        );

        if (Object.keys(dependencies).length > 0) {
            const error = new Error(
                'No se puede eliminar el tercero porque tiene movimientos o documentos asociados. Puedes bloquearlo para impedir nuevas operaciones.'
            );
            error.statusCode = 409;
            error.code = 'THIRD_PARTY_HAS_MOVEMENTS';
            error.dependencies = dependencies;
            throw error;
        }

        const snapshot = thirdPartyResult.rows[0];
        await client.query(`
            INSERT INTO "Fiscal".audit_events
                (company_id, event_type, entity_schema, entity_table, entity_id, payload, performed_by)
            VALUES ($1, 'third_party.deleted', 'Ecosystem', 'thirdparties', $2, $3::jsonb, $4);
        `, [companyId, thirdPartyId, JSON.stringify(snapshot), performedByFrom(info)]);

        const deleteResult = await client.query(`
            DELETE FROM "Ecosystem".thirdparties
            WHERE id = $1 AND company_id = $2
            RETURNING id;
        `, [thirdPartyId, companyId]);

        return [true, {
            id: deleteResult.rows[0].id,
            message: 'Tercero eliminado correctamente.'
        }];
    });
};

export default thirdPartyService;
