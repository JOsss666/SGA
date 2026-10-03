import { companyTimeZoneSql } from './businessTimeZoneService.js';

function fail(message, statusCode = 400) {
    throw Object.assign(new Error(message), { statusCode });
}

function id(value, name) {
    if ((typeof value !== 'number' || Number.isSafeInteger(value))
        && /^[1-9]\d*$/.test(String(value)) && BigInt(value) <= 9223372036854775807n) return String(value);
    fail(`${name} no es válido.`);
}

function text(value, name, max = 4000, required = false) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (required && !normalized) fail(`${name} es obligatorio.`);
    if (normalized.length > max) fail(`${name} no puede superar ${max} caracteres.`);
    return normalized;
}

function scheduledAt(value) {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) fail('La fecha programada no es válida.');
    return date.toISOString();
}

export function createNexoDeliveryOrderService({ withTransaction }) {
    return {
        async create(input, auth) {
            if (String(auth.companyId) !== '7') fail('Esta funcionalidad está disponible únicamente para 4K 360.', 403);
            if (!Array.isArray(input?.service_movement_ids) || !input.service_movement_ids.length || input.service_movement_ids.length > 1000) {
                fail('Selecciona entre 1 y 1000 productos listos para entrega.');
            }
            const requestedMovementIds = input.service_movement_ids.map(value => id(value, 'Producto'));
            const movementIds = [...new Set(requestedMovementIds)].sort((a, b) => a.localeCompare(b));
            if (movementIds.length !== requestedMovementIds.length) fail('Un producto no puede repetirse en la misma orden de entrega.');
            const info = {
                scheduledAt: scheduledAt(input.scheduled_at),
                pickupLocation: text(input.pickup_location, 'El lugar de recogida', 1000, true),
                authorizedName: text(input.authorized_name, 'La persona autorizada', 250, true),
                authorizedIdentification: text(input.authorized_identification, 'La identificación', 100, true),
                authorizedPhone: text(input.authorized_phone, 'El teléfono', 100),
                vehicleType: text(input.vehicle_type, 'El tipo de vehículo', 100),
                vehiclePlate: text(input.vehicle_plate, 'La placa', 30),
                driverName: text(input.driver_name, 'El conductor', 250),
                observations: text(input.observations, 'Las observaciones', 4000)
            };

            return withTransaction(async client => {
                // La elegibilidad está anclada a la última etapa del subproceso del proveedor;
                // no se acepta un id enviado por el navegador sin comprobar su proceso y proveedor.
                const sources = (await client.query(`
                    SELECT movement.id AS service_movement_id, movement.units, movement.description,
                        source.id AS client_order_id, source."ownSerial" AS client_order_number,
                        delegation.id AS delegation_document_id, delegation."ownSerial" AS work_order_number,
                        assignment."thirdParty_id" AS supplier_id, supplier.names AS supplier_name,
                        child.id AS process_instance_id, service.name AS service_name,
                        store.name AS store_reference
                    FROM "Process"."ordersDelegation" assignment
                    JOIN "Inventory".services_movement movement
                        ON movement.id = assignment.service_movement_id AND movement.company_id = assignment.company_id
                    JOIN "Ecosystem".documents source
                        ON source.id = movement.doc_id AND source.company_id = movement.company_id
                    JOIN "Ecosystem".documents delegation
                        ON delegation.id = assignment.delegation_document_id AND delegation.company_id = assignment.company_id
                    JOIN "Ecosystem".thirdparties supplier
                        ON supplier.id = assignment."thirdParty_id" AND supplier.company_id = assignment.company_id
                    JOIN "Ecosystem".docs_instances delegation_link
                        ON delegation_link.doc_id = delegation.id
                    JOIN "Process".process_instance child
                        ON child.id = delegation_link.instance_id AND child.company_id = assignment.company_id AND child.parent_id IS NOT NULL
                    JOIN "Process".process_steps child_step
                        ON child_step.id = child.step_id AND child_step.process_id = child.process_id AND child_step.company_id = child.company_id
                    LEFT JOIN "Inventory"."products&services" service
                        ON service.id = movement.service_id AND service.company_id = movement.company_id
                    LEFT JOIN "Ecosystem".stores store
                        ON store.id = source.store_id AND store.company_id = source.company_id
                    WHERE assignment.company_id = $1 AND assignment.status = 'active'
                        AND movement.id = ANY($2::bigint[])
                        AND source.document_type = 'Client Order' AND source.status = 'active'
                        AND child.status = 'active' AND child_step.end_process = true
                    ORDER BY movement.id
                    FOR UPDATE OF assignment, movement, child;
                `, [auth.companyId, movementIds])).rows;
                if (sources.length !== movementIds.length) fail('Alguno de los productos no pertenece a una OTP terminada y aprobada, o ya no está disponible.', 409);
                const supplierIds = new Set(sources.map(row => String(row.supplier_id)));
                if (supplierIds.size !== 1) fail('Una orden de entrega solo puede contener productos de un mismo proveedor.', 409);

                await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`nexo-delivery-order:${auth.companyId}`]);
                const next = (await client.query(`
                    SELECT COALESCE(MAX(sequence_number), 0) + 1 AS value
                    FROM "Process".delivery_orders WHERE company_id = $1
                `, [auth.companyId])).rows[0].value;
                const orderNumber = `OE-${String(next).padStart(6, '0')}`;
                const order = (await client.query(`
                    INSERT INTO "Process".delivery_orders (
                        company_id, sequence_number, order_number, supplier_id, issued_on, scheduled_at, pickup_location,
                        authorized_name, authorized_identification, authorized_phone, vehicle_type,
                        vehicle_plate, driver_name, observations, created_by
                    ) VALUES ($1,$2,$3,$4,(CURRENT_TIMESTAMP AT TIME ZONE (${companyTimeZoneSql('$1')}))::date,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                    RETURNING id, order_number, status, issued_on, scheduled_at;
                `, [auth.companyId, next, orderNumber, sources[0].supplier_id, info.scheduledAt, info.pickupLocation,
                    info.authorizedName, info.authorizedIdentification, info.authorizedPhone, info.vehicleType,
                    info.vehiclePlate, info.driverName, info.observations, auth.userId])).rows[0];
                for (const source of sources) {
                    await client.query(`
                        INSERT INTO "Process".delivery_order_items (
                            delivery_order_id, company_id, service_movement_id, client_order_id, delegation_document_id,
                            process_instance_id, quantity, description, store_reference
                        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
                    `, [order.id, auth.companyId, source.service_movement_id, source.client_order_id,
                        source.delegation_document_id, source.process_instance_id, source.units,
                        source.description || source.service_name || 'Producto terminado', source.store_reference || '']);
                }
                await client.query(`
                    INSERT INTO "Process".delivery_order_events (delivery_order_id, company_id, user_id, action, detail)
                    VALUES ($1,$2,$3,'created',$4);
                `, [order.id, auth.companyId, auth.userId, `Creada ${orderNumber} con ${sources.length} producto(s).`]);
                return { ...order, supplier: sources[0].supplier_name, itemCount: sources.length };
            });
        }
    };
}
