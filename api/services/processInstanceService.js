// Recibe el cliente de la transacción del llamador; nunca abre otra conexión.
export async function createProcessInstance(client, info) {
    const result = await client.query(`
        INSERT INTO "Process".process_instance (
            company_id, process_id, step_id, status, parent_id, parent_step,
            start_date, "delivery_date", "thirdParty_id", responsable, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
            CURRENT_TIMESTAMP AT TIME ZONE 'UTC', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
        RETURNING id, "ownSerial", created_at AT TIME ZONE 'UTC' AS created_at
    `, [info.company_id, info.process_id, info.step_id, info.status,
        info.parent_id ?? null, info.parent_step ?? null, info.start_date ?? null,
        info.delivery_date ?? null, info.thirdParty_id ?? null, info.user_id]);
    const instance = result.rows[0];
    await client.query(`
        INSERT INTO "Process".process_historial (
            company_id, instance_id, previous_step, next_step, user_id, created_at, description
        ) VALUES ($1,$2,$3,$3,$4,$5::timestamptz AT TIME ZONE 'UTC',$6)
    `, [info.company_id, instance.id, info.step_id, info.user_id,
        instance.created_at, 'Creación de instancia de proceso']);
    return instance;
}
