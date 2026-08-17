import { calcWeightedAverage, encrypt, isRelevanPrompt, useDataBase, actualDate } from "../app.js";
import fs from "fs";
import path from "path";
import { send_API_AI } from "../ApiFunctions.js";
import { companyTimeZoneSql } from "../services/businessTimeZoneService.js";
const contabiltyController = {};

contabiltyController.getBalance = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = []

        whereClauses.push(`p.company_id = $1 OR company_id = 0`)
        values.push(info.company_id)

        const whereQuery = `WHERE ${whereClauses.join(" AND ")}`;

        let tableAcc = info.typePlanAccount == 'PUC'? 'account_templates_PUC':'contable_accounts';
        let sentence;
        if(tableAcc == 'account_templates_PUC'){
            const companyTimeZone = companyTimeZoneSql('$1');
            const periodStart = `($2::date::timestamp AT TIME ZONE (${companyTimeZone}))`;
            const periodEnd = `COALESCE(
                ((($3::date + 1)::timestamp) AT TIME ZONE (${companyTimeZone})),
                CURRENT_TIMESTAMP
            )`;

            sentence = `
                WITH movements_by_account AS (
                    SELECT
                        t.account_id,

                        /* SALDO INICIAL */
                        SUM(
                            CASE
                                WHEN t.created_at < ${periodStart} THEN
                                    CASE
                                        WHEN t.nature = 'DB' THEN t.total
                                        WHEN t.nature = 'CR' THEN -t.total
                                        ELSE 0
                                    END
                                ELSE 0
                            END
                        ) AS opening_balance,

                        /* DÉBITOS DEL PERIODO */
                        SUM(
                            CASE
                                WHEN t.created_at >= ${periodStart}
                                    AND t.created_at < ${periodEnd}
                                    AND t.nature = 'DB'
                                THEN t.total
                                ELSE 0
                            END
                        ) AS total_debit,

                        /* CRÉDITOS DEL PERIODO */
                        SUM(
                            CASE
                                WHEN t.created_at >= ${periodStart}
                                    AND t.created_at < ${periodEnd}
                                    AND t.nature = 'CR'
                                THEN t.total
                                ELSE 0
                            END
                        ) AS total_credit

                    FROM "Ecosystem".transaction_detail t
                    WHERE t.status = 'posted'
                        ${info.company_id != undefined && ` AND t.company_id = $1`}
                    GROUP BY t.account_id
                )

                SELECT
                    p.id,
                    p.code AS account_code,
                    p.name AS concept_name,
                    p.level,

                    COALESCE(SUM(m.opening_balance), 0) AS opening_balance,
                    COALESCE(SUM(m.total_debit), 0)     AS total_debit,
                    COALESCE(SUM(m.total_credit), 0)    AS total_credit,

                    COALESCE(
                        CASE
                            WHEN p.type = 'DB' THEN
                                SUM(m.opening_balance + m.total_debit - m.total_credit)
                            WHEN p.type = 'CR' THEN
                                SUM(m.opening_balance + m.total_credit - m.total_debit)
                            ELSE 0
                        END,
                        0
                    ) AS final_balance


                FROM "Ecosystem".contable_accounts p

                LEFT JOIN mv_account_hierarchy h
                    ON h.parent_id = p.id

                LEFT JOIN movements_by_account m
                    ON m.account_id = h.child_id

                ${whereQuery}

                GROUP BY p.id, p.code, p.name, p.level

                HAVING
                    $4 = TRUE
                    OR (
                        COALESCE(SUM(m.opening_balance), 0) <> 0
                        OR COALESCE(SUM(m.total_debit), 0) <> 0
                        OR COALESCE(SUM(m.total_credit), 0) <> 0
                    )

                ORDER BY p.code;

            `;

        }else{
            sentence = `
            SELECT 
                a.code,
                a.name,
                SUM(
                    CASE 
                        WHEN ca.nature = 'DB' THEN t.total
                        ELSE 0
                    END
                ) AS total_debit,
                SUM(
                    CASE 
                        WHEN ca.nature = 'CR' THEN t.total
                        ELSE 0
                    END
                ) AS total_credit,
                SUM(
                    CASE 
                        WHEN ca.nature = 'DB' THEN t.total
                        WHEN ca.nature = 'CR' THEN -t.total
                        ELSE 0
                    END
                ) AS balance
            FROM sga_ecosystem.contable_accounts a
            LEFT JOIN sga_ecosystem.contable_accounts ca
                ON ca.code LIKE CONCAT(a.code, '%')
            LEFT JOIN sga_ecosystem.transaction_detail t
                ON t.account_id = ca.id
            ${whereQuery}
            GROUP BY a.id, a.code, a.name
            ORDER BY a.code;
            `;
        }
        const startDate = info.start_date || '1900-01-01';
        const endDate = info.end_date || null;

        let consulta = await useDataBase(sentence,[
            info.company_id,
            startDate,
            endDate,
            info.allAccounts != undefined ? info.allAccounts:false
        ],1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(consulta));
    })
    req.on('error', (err) => {
            console.error("⚠️ Error en la recepción de datos:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Error en la recepción de datos", detail: err.message }));
    });
}


contabiltyController.refreshAccountBalanceMaterializedView = (req,res)=>{
    req.on('end',async()=>{
        let consulta = await useDataBase(`REFRESH MATERIALIZED VIEW CONCURRENTLY "Facturation".mv_shift_payment_summaries`,[],2);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(consulta));
    })
    req.on('error', (err) => {
            console.error("⚠️ Error en la recepción de datos:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Error en la recepción de datos", detail: err.message }));
    });
}


contabiltyController.updateContableAccount = (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('error', err => {
        console.error("Error al recibir los datos de la petición:", err);
        return res.status(500).json({ error: "Error al leer la petición." });
    });

    req.on('end', async () => {
        try {
            const { id } = req.params; 
            let data = {};

            if (body) {
                try {
                    data = JSON.parse(body);
                } catch (parseError) {
                    console.error("Error al parsear el JSON manual:", parseError);
                    return res.status(400).json({ error: "El formato JSON enviado es inválido." });
                }
            }

            console.log('--- Datos parseados:', data);
            if (!id || Object.keys(data).length === 0) {
                return res.status(400).json({ 
                    error: "No se enviaron datos para actualizar o falta el ID." 
                });
            }

            if (data.code) {
                const checkQuery = `
                    SELECT id FROM "Ecosystem".contable_accounts 
                    WHERE code = $1 AND id != $2 AND company_id = $3;
                `;
                const checkResult = await useDataBase(checkQuery, [data.code, id, data.company_id], 1);
                
                if (checkResult.rowCount > 0) {
                    return res.status(409).json({ 
                        error: "El código ingresado ya existe en otra cuenta contable." 
                    });
                }
            }

            const setClauses = [];
            const values = [];
            let paramIndex = 1;

            const allowedFields = ['code', 'name', 'type', 'state'];

            for (const [key, value] of Object.entries(data)) {
                if (allowedFields.includes(key)) {
                    setClauses.push(`${key} = $${paramIndex}`);
                    values.push(value);
                    paramIndex++;
                }
            }

            if (setClauses.length === 0) {
                return res.status(400).json({ 
                    error: "Los campos enviados no son válidos para la actualización." 
                });
            }

            values.push(id);
            const updateQuery = `
                UPDATE "Ecosystem".contable_accounts
                SET ${setClauses.join(', ')}
                WHERE id = $${paramIndex}
                RETURNING *;
            `;

            const updateResult = await useDataBase(updateQuery, values, 1);

            if (updateResult[0] == false){
                return res.status(404).json({ 
                    status:'Error',
                    message:'Cuenta contable no encontrada.',
                    data:[] 
                });
            }

            return res.status(200).json({
                status:'OK',
                message: "Cuenta contable actualizada correctamente.",
                data: updateResult[1]
            });

        } catch (error) {
            console.error("Error al actualizar la cuenta contable:", error);
            return res.status(500).json({ error: "Error interno del servidor." });
        }
    });
};

contabiltyController.deleteContableAccount = (req, res) => {
    let data = '';

    req.on('data', chunk => {
        data += chunk.toString();
    });

    req.on('error', err => {
        console.error("Error al recibir datos para eliminar:", err);
        return res.status(500).json({ error: "Error al leer la petición." });
    });

    req.on('end', async () => {
        try {
            let info = {};
            if (data) {
                info = JSON.parse(data);
            }

            const { id } = req.params; 
            
            if (!id) {
                return res.status(400).json({ error: "No se proporcionó el ID de la cuenta." });
            }

            const accountQuery = `SELECT code FROM "Ecosystem".contable_accounts WHERE id = $1`;
            const accountInfo = await useDataBase(accountQuery, [id], 3); 
            
            if (!accountInfo) {
                return res.status(404).json({ error: "La cuenta contable no existe." });
            }
            
            const parentCode = accountInfo.code;
            const childCountQuery = `
                SELECT COUNT(*)
                FROM "Ecosystem".contable_accounts
                WHERE code LIKE $1 AND id != $2;
            `;
            
            const [childSuccess, childrenCount] = await useDataBase(childCountQuery, [`${parentCode}%`, id], 7);
            
            if (childrenCount > 0) {
                return res.status(200).json({
                    status: 'Error',
                    message: `No puedes eliminar esta cuenta porque tiene (${childrenCount}) subcuentas (hijas) asociadas.`,
                    data: { count: childrenCount }
                });
            }

            let prevCountSentence = `
                SELECT COUNT(*)
                FROM "Ecosystem".transaction_detail
                WHERE account_id = $1;
            `;
            
            let prevCountResult = await useDataBase(prevCountSentence, [id], 7);
            const transaccionesActivas = Number(prevCountResult[1]);
            console.log('Transacciones asociadas encontradas:', transaccionesActivas);

            if (transaccionesActivas > 0) {
                return res.status(200).json({
                    status:'Error',
                    message:`No puedes eliminar esta cuenta porque ya tiene (${transaccionesActivas}) transacciones asociadas.` ,
                    data:{count:transaccionesActivas}
                });
            }

            const delteTransaction = await useDataBase(`
                DELETE FROM
                    "Ecosystem".contable_accounts
                WHERE
                    id = $1 ;
            `,[id],2)

            console.log("Resultado del delete:", delteTransaction);

            return res.status(200).json({ 
                status:'OK',
                message: "Cuenta contable eliminada correctamente.",
                data:[]
            });

        } catch (error) {
            console.error("Error en la validación/eliminación:", error);
            return res.status(500).json({ error: "Error interno del servidor." });
        }
    });
};
export default contabiltyController;
