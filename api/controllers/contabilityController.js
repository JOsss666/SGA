import { calcWeightedAverage, encrypt, isRelevanPrompt, useDataBase, actualDate } from "../app.js";
import fs from "fs";
import path from "path";
import { send_API_AI } from "../ApiFunctions.js";
const contabiltyController = {};

contabiltyController.getBalance = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let tableAcc = info.typePlanAccount == 'PUC'? 'account_templates_PUC':'contable_accounts';
        let sentence;
        if(tableAcc == 'account_templates_PUC'){
            sentence = `
                SELECT 
                    a.code AS account_code,
                    a.name AS concept_name,
                    SUM(
                        CASE 
                            WHEN ca.type = 'DB' THEN t.total
                            ELSE 0
                        END
                    ) AS total_debit,
                    SUM(
                        CASE 
                            WHEN ca.type = 'CR' THEN t.total
                            ELSE 0
                        END
                    ) AS total_credit,
                    SUM(
                        CASE 
                            WHEN ca.type = 'DB' THEN t.total
                            WHEN ca.type = 'CR' THEN -t.total
                            ELSE 0
                        END
                    ) AS balance
                FROM (
                    -- 🔹 Unión de ambas tablas base (plantillas + cuentas reales)
                    SELECT id, company_id, code, name, type
                    FROM sga_ecosystem.account_templates_puc
                    UNION ALL
                    SELECT id, company_id, code, name, type
                    FROM sga_ecosystem.puc
                ) AS a
                LEFT JOIN (
                    -- 🔹 Unión para las cuentas auxiliares
                    SELECT id, company_id, code, name, type
                    FROM sga_ecosystem.account_templates_puc
                    UNION ALL
                    SELECT id, company_id, code, name, type
                    FROM sga_ecosystem.puc
                ) AS ca
                    ON ca.code LIKE CONCAT(a.code, '%')
                LEFT JOIN sga_ecosystem.transaction_detail t
                    ON t.account_id = ca.id
                    AND t.status = 'posted'   -- 👈 importante mover esta condición al JOIN
                WHERE 
                    (a.company_id = ${info.company_id} OR a.company_id = 0)
                GROUP BY 
                    a.id, a.code, a.name
                ORDER BY 
                    a.code;
            `;
        }else{
            sentence = `
            SELECT 
                a.code,
                a.name,
                SUM(
                    CASE 
                        WHEN ca.type = 'DB' THEN t.total
                        ELSE 0
                    END
                ) AS total_debit,
                SUM(
                    CASE 
                        WHEN ca.type = 'CR' THEN t.total
                        ELSE 0
                    END
                ) AS total_credit,
                SUM(
                    CASE 
                        WHEN ca.type = 'DB' THEN t.total
                        WHEN ca.type = 'CR' THEN -t.total
                        ELSE 0
                    END
                ) AS balance
            FROM sga_ecosystem.contable_accounts a
            LEFT JOIN sga_ecosystem.contable_accounts ca
                ON ca.code LIKE CONCAT(a.code, '%')
            LEFT JOIN sga_ecosystem.transaction_detail t
                ON t.account_id = ca.id
            WHERE a.company_id = ${info.company_id}
            GROUP BY a.id, a.code, a.name
            ORDER BY a.code;
            `;
        }
        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(consulta));
    })
    req.on('error', (err) => {
            console.error("⚠️ Error en la recepción de datos:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Error en la recepción de datos", detail: err.message }));
    });
}



export default contabiltyController;

