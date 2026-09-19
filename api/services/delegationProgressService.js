// El llamador mantiene bloqueada la instancia padre en la misma transacción.
export async function validateDelegationProgress(client, instance) {
    const config=(await client.query(`SELECT * FROM "Process".orders_delegation_config WHERE company_id=$1 AND parent_process_id=$2`,[instance.company_id,instance.process_id])).rows[0];
    if(!config) return;
    if(String(instance.step_id)===String(config.assignment_step_id)) {
        const result=await client.query(`
            SELECT movement.id FROM "Inventory".services_movement movement
            JOIN "Ecosystem".documents document ON document.id=movement.doc_id AND document.company_id=movement.company_id
            WHERE movement.company_id=$1 AND document.document_type='Client Order' AND document.status='active'
                AND (document.instance_id=$2 OR EXISTS (SELECT 1 FROM "Ecosystem".docs_instances link WHERE link.doc_id=document.id AND link.instance_id=$2))
                AND NOT EXISTS (SELECT 1 FROM "Process"."ordersDelegation" assignment WHERE assignment.company_id=$1 AND assignment.service_movement_id=movement.id AND assignment.status='active')
            LIMIT 1
        `,[instance.company_id,instance.id]);
        if(result.rowCount) throw new Error('Hay ítems de órdenes de cliente pendientes de asignar.');
    }
    if(String(instance.step_id)===String(config.production_step_id)) {
        const result=await client.query(`
            SELECT child.id FROM "Process".process_instance child
            JOIN "Process".process_steps step ON step.id=child.step_id AND step.process_id=child.process_id
            WHERE child.company_id=$1 AND child.parent_id=$2 AND child.parent_step=$3
                AND (NOT step.end_process OR child.status <> 'active')
            LIMIT 1
        `,[instance.company_id,instance.id,config.production_step_id]);
        if(result.rowCount) throw new Error('Todos los subprocesos de proveedor deben estar entregados para salir de producción.');
    }
}
