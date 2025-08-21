
import { useDataBase } from "../app.js";
const processController = {};


processController.createOp = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `INSERT INTO sga_process.OPS (company_id,store_id,user_id) VALUES(?,?,?);`
        let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.user_id],4);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

processController.getOp = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                sga_process.OPS.*,
                sga_ecosystem.users.user_name,
                sga_ecosystem.thirdParties.names
            FROM
                sga_process.OPS
            LEFT JOIN
                sga_ecosystem.users
            ON
                sga_process.OPS.user_id = sga_ecosystem.users.user_id
            LEFT JOIN
                sga_ecosystem.thirdParties
            ON
                sga_process.OPS.thirdParty_id = sga_ecosystem.thirdParties.id
            WHERE
                sga_process.OPS.company_id = ${info.company_id}
                ${info.user_id != null? ` AND sga_process.OPS.user_id = ${info.user_id} `:''}
                ${info.op_id != null? ` AND sga_process.OPS.op_id = ${info.op_id} `:''}
                ${info.limint != null? ` LIMIT ${info.limint}`:''}

                ORDER BY sga_process.OPS.op_id DESC
            ;
        `
        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


processController.getOpAttached = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                sga_process.OCS.user_id,
                sga_process.OCS.id,
                sga_process.OCS.status,
                sga_process.OCS.description,
                sga_process.OCS.created_at,
                sga_ecosystem.thirdParties.names,
                'OC' as type
            FROM
                sga_process.OCS
            LEFT JOIN
                sga_ecosystem.thirdParties
            ON
                sga_process.OCS.thirdParty_id = sga_ecosystem.thirdParties.id
            WHERE
                sga_process.OCS.op_id = ${info.op_id}
            UNION ALL
            SELECT
                sga_process.DCS.user_id,
                sga_process.DCS.id,
                sga_process.DCS.status,
                sga_process.DCS.description,
                sga_process.DCS.created_at,
                sga_ecosystem.thirdParties.names,
                'DC' as type
            FROM
                sga_process.DCS
            LEFT JOIN
                sga_ecosystem.thirdParties
            ON
                sga_process.DCS.thirdParty_id = sga_ecosystem.thirdParties.id
            WHERE
                sga_process.DCS.op_id = ${info.op_id}
            UNION ALL
            SELECT
                sga_process.FVS.user_id,
                sga_process.FVS.id,
                sga_process.FVS.status,
                sga_process.FVS.description,
                sga_process.FVS.created_at,
                sga_ecosystem.thirdParties.names,
                'FV' as type
            FROM
                sga_process.FVS
            LEFT JOIN
                sga_ecosystem.thirdParties
            ON
                sga_process.FVS.thirdParty_id = sga_ecosystem.thirdParties.id
            WHERE
                sga_process.FVS.op_id = ${info.op_id}
            UNION ALL
            SELECT
                sga_process.CIS.user_id,
                sga_process.CIS.id,
                sga_process.CIS.status,
                sga_process.CIS.description,
                sga_process.CIS.created_at,
                sga_ecosystem.thirdParties.names,
                'CI' as type
            FROM
                sga_process.CIS
            LEFT JOIN
                sga_ecosystem.thirdParties
            ON
                sga_process.CIS.thirdParty_id = sga_ecosystem.thirdParties.id
            WHERE
                sga_process.CIS.op_id = ${info.op_id}
        `
        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

processController.createOc = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log(info);
        let sentence = `
        INSERT INTO
            sga_process.OCS
        (   
            company_id,
            store_id,
            user_id,
            op_id,
            thirdParty_id,
            description,
            budgetIncome,
            budgetCost
        )
            VALUES(?,?,?,?,?,?,?,?);
        `
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.store_id,
            info.user_id,
            info.op_id,
            info.thirdParty_id,
            info.description,
            info.budgetIncome,
            info.budgetCost
        ],4)
        if(typeof consulta === "number"){
            let sentence = `
            UPDATE
                sga_process.OPS
            SET
                sga_process.OPS.thirdParty_id = ${info.thirdParty_id},
                sga_process.OPS.budgetIncome = sga_process.OPS.budgetIncome + ${info.budgetIncome},
                sga_process.OPS.budgetCost = sga_process.OPS.budgetCost +  ${info.budgetCost}
            WHERE
                sga_process.OPS.op_id = ${info.op_id} ; 
            `
            let postConsul = await useDataBase(sentence,[],2);
            if(postConsul){
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(consulta));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify([false,['Error actualizando totales']]));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([false,['Error al crear OC']]));
        }
        
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


processController.createDC = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
        INSERT INTO
            sga_process.DCS
        (   
            company_id,
            store_id,
            user_id,
            op_id,
            thirdParty_id,
            description,
            value
        )
            VALUES(?,?,?,?,?,?,?);
        `
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.store_id,
            info.user_id,
            info.op_id,
            info.thirdParty_id,
            info.description,
            info.value
        ],4);
        if(typeof consulta === "number"){
            let sentence = `
            UPDATE
                sga_process.OPS
            SET
                sga_process.OPS.executedCost =  sga_process.OPS.executedCost + ${info.value}
            WHERE
                sga_process.OPS.op_id = ${info.op_id};
            `
            let postConsul = await useDataBase(sentence,[],2);
            if(postConsul){
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(consulta));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify([false,['Error actualizando costo ejecutado']]));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([false,['Error al crear DC']]));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

processController.createFV = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
        INSERT INTO
            sga_process.FVS
        (   
            company_id,
            store_id,
            user_id,
            op_id,
            thirdParty_id,
            description,
            value
        )
            VALUES(?,?,?,?,?,?,?);
        `
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.store_id,
            info.user_id,
            info.op_id,
            info.thirdParty_id,
            info.description,
            info.value
        ],4);
        if(typeof consulta === "number"){
            let sentence = `
            UPDATE
                sga_process.OPS
            SET
                sga_process.OPS.invoicedValue =  sga_process.OPS.invoicedValue + ${info.value}
            WHERE
                sga_process.OPS.op_id = ${info.op_id};
            `
            let postConsul = await useDataBase(sentence,[],2);
            if(postConsul){
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(consulta));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify([false,['Error actualizando costo ejecutado']]));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([false,['Error al crear DC']]));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

processController.searchDocument = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentenceOp = `SELECT
                'OP' AS type,
                sga_process.OPS.op_id AS id,
                sga_process.OPS.store_id,
                sga_process.OPS.thirdParty_id,
                '' AS description,
                sga_process.OPS.created_at
            FROM
                sga_process.OPS
            WHERE
                sga_process.OPS.company_id = ${info.company_id}
                AND sga_process.OPS.op_id LIKE '${info.searchVal}' 
                ${info.store_id != null? ` AND sga_process.OPS.store_id = ${info.store_id} `:''}
                ${(info.initialDate!= null && info.finalDate != null)? ` AND DATE(sga_process.OPS.created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate} '   `:''}
        `;
        let sentenceOC = `SELECT
                'OC' AS type,
                sga_process.OCS.id,
                sga_process.OCS.store_id,
                sga_process.OCS.thirdParty_id,
                sga_process.OCS.description,
                sga_process.OCS.created_at
            FROM
                sga_process.OCS
            WHERE
                sga_process.OCS.company_id = ${info.company_id} 
                AND sga_process.OCS.id LIKE '${info.searchVal}' OR sga_process.OCS.description LIKE '${info.searchVal}'
                ${info.store_id != null? ` AND sga_process.OCS.store_id = ${info.store_id} `:''}
                ${(info.initialDate!= null && info.finalDate != null)? ` AND DATE(sga_process.OCS.created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}'   `:''}
        `;
        let sentenceDC = `SELECT
                'DC' AS type,
                sga_process.DCS.id,
                sga_process.DCS.store_id,
                sga_process.DCS.thirdParty_id,
                sga_process.DCS.description,
                sga_process.DCS.created_at
            FROM
                sga_process.DCS
            WHERE
                sga_process.DCS.company_id = ${info.company_id}
                AND sga_process.DCS.id LIKE '${info.searchVal}' OR sga_process.DCS.description LIKE '${info.searchVal}'
                ${info.store_id != null? ` AND sga_process.DCS.store_id = ${info.store_id} `:''}
                ${(info.initialDate!= null && info.finalDate != null)? ` AND DATE(sga_process.DCS.created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}'   `:''}
        `;
        let sentenceFV = `SELECT
                'FC' AS type,
                sga_process.FVS.id,
                sga_process.FVS.store_id,
                sga_process.FVS.thirdParty_id,
                sga_process.FVS.description,
                sga_process.FVS.created_at
            FROM
                sga_process.FVS
            WHERE
                sga_process.FVS.company_id = ${info.company_id}
                AND sga_process.FVS.id LIKE '${info.searchVal}' OR sga_process.FVS.description LIKE '${info.searchVal}'
                ${info.store_id != null? ` AND sga_process.FVS.store_id = ${info.store_id} `:''}
                ${(info.initialDate!= null && info.finalDate != null)? ` AND DATE(sga_process.FVS.created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}'   `:''}
        `;
        let sentenceCI = `SELECT
                'CI' AS type,
                sga_process.CIS.id,
                sga_process.CIS.store_id,
                sga_process.CIS.thirdParty_id,
                sga_process.CIS.description,
                sga_process.CIS.created_at
            FROM
                sga_process.CIS
            WHERE
                sga_process.CIS.company_id = ${info.company_id}
                AND sga_process.CIS.id LIKE '${info.searchVal}' OR sga_process.CIS.description LIKE '${info.searchVal}'
                ${info.store_id != null? ` AND sga_process.CIS.store_id = ${info.store_id} `:''}
                ${(info.initialDate!= null && info.finalDate != null)? ` AND DATE(sga_process.CIS.created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}'   `:''}
        `;
        
        // Handle Filters and orders
        let dictionaryTypes = {
            'OP':sentenceOp,
            'OC':sentenceOC,
            'DC':sentenceDC,
            'FV':sentenceFV,
            'CI':sentenceCI
        }

        let searchSentence;
        if(info.types.length == 1 ){
            searchSentence = dictionaryTypes[info.types[0]];
        } else {
            searchSentence = `
                SELECT * FROM (
                    ${info.types.map(t => dictionaryTypes[t]).join(" UNION ALL ")}
                ) AS documents
                ORDER BY created_at DESC
            `;
        }
        let consulta = await useDataBase(searchSentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

export default processController;