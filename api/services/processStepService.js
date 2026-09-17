import { validateDelegationProgress } from './delegationProgressService.js';

// Reutiliza la transacción del llamador; no confirma cambios por su cuenta.
export async function advanceProcessStep(client, info, validateFullProcessRequirements) {
    if (info.user_roll == null) {
        const user = (await client.query(`
            SELECT config.role FROM "Ecosystem".users u
            JOIN "Ecosystem".users_config config ON config.user_id = u.user_id
            WHERE u.company_id = $1 AND u.user_id = $2 AND u.status = 'active';
        `, [info.company_id, info.user_id])).rows[0];
        if (!user?.role) throw new Error('El responsable no tiene un rol interno activo.');
        info = { ...info, user_roll: user.role };
    }
    const instance = (await client.query(`
        SELECT pi.*, ps."order" AS current_order
        FROM "Process".process_instance pi
        JOIN "Process".process_steps ps ON pi.step_id=ps.id AND pi.process_id=ps.process_id
        WHERE pi.id=$1 AND pi.company_id=$2 FOR UPDATE OF pi
    `,[info.instance_id,info.company_id])).rows[0];
    if(!instance) throw new Error('Instancia no encontrada');
    if(instance.status !== 'active') throw new Error('La instancia no está activa.');
    if(info.previous_step != null && String(info.previous_step) !== String(instance.step_id)) throw new Error('El proceso cambió de paso. Recarga e intenta nuevamente.');
    const nextStep=(await client.query(`
        SELECT id,name,required_roll,"order",end_process FROM "Process".process_steps
        WHERE process_id=$1 AND company_id=$2 AND "order">$3 ORDER BY "order", id LIMIT 1
    `,[instance.process_id,info.company_id,instance.current_order])).rows[0];
    if(!nextStep) return {success:false,message:'El proceso ya ha finalizado.'};
    if(!nextStep.required_roll.map(String).includes(String(info.user_roll))) throw new Error('No tienes el rol necesario para autorizar este paso.');
    await validateDelegationProgress(client, instance);
    if(nextStep.end_process) {
        const validation=await validateFullProcessRequirements(instance.id,instance.process_id,client);
        if(!validation.success) throw new Error(validation.error);
    }
    await client.query(`UPDATE "Process".process_instance SET step_id=$1, updated_at=CURRENT_TIMESTAMP AT TIME ZONE 'UTC', responsable=$3 WHERE id=$2`,[nextStep.id,instance.id,info.user_id]);
    await client.query(`
        INSERT INTO "Process".process_historial(company_id,instance_id,previous_step,next_step,user_id,description,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
    `,[info.company_id,instance.id,instance.step_id,nextStep.id,info.user_id,info.description || 'Avance de etapa']);
    return {success:true,message:`El proceso ha avanzado a: ${nextStep.name}`,nextStepId:nextStep.id};
}
