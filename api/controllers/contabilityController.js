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
                WITH movements_by_account AS (
                    SELECT
                        t.account_id,

                        /* SALDO INICIAL */
                        SUM(
                            CASE
                                WHEN t.created_at < $2 THEN
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
                                WHEN t.created_at BETWEEN $2 AND $3
                                    AND t.nature = 'DB'
                                THEN t.total
                                ELSE 0
                            END
                        ) AS total_debit,

                        /* CRÉDITOS DEL PERIODO */
                        SUM(
                            CASE
                                WHEN t.created_at BETWEEN $2 AND $3
                                    AND t.nature = 'CR'
                                THEN t.total
                                ELSE 0
                            END
                        ) AS total_credit

                    FROM "Ecosystem".transaction_detail t
                    WHERE t.status = 'posted'
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

                WHERE p.company_id = $1

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
            WHERE a.company_id = $1
            GROUP BY a.id, a.code, a.name
            ORDER BY a.code;
            `;
        }
        const startDate = info.start_date !== undefined
        ? new Date(info.start_date)
        : new Date('1900-01-01');

        const endDate = info.end_date !== undefined
        ? new Date(info.end_date)
        : new Date();

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



export default contabiltyController;

