
import { useDataBase } from "../app.js";
const processController = {};

processController.createDocument = async(info,ownSerial)=>{
        console.log(info)
        let sentence = `
            INSERT INTO "Ecosystem".documents(
                company_id, store_id, "thirdParty_id", document_type, status, "subTotal", total, created_by, description, attached)
            VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id , ${ownSerial? '"ownSerial"':''} ;`
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.store_id,
            info.thirdParty_id,
            info.document_type,
            info.status,
            info.subTotal != undefined? info.subTotal:0,
            info.total != undefined? info.total:0,
            info.created_by,
            info.description,
            info.attached != undefined? info.attached:''
        ],3);
        return(consulta);
}


processController.getAttachedDocuments = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];
        whereClauses.push(`"Ecosystem".documents.company_id = $1`);
        values.push(info.company_id);

        if(info.instance_id != undefined && info.instance_id != ''){
            whereClauses.push(`"Ecosystem".docs_instances.instance_id = $${values.length +1}`);
            values.push(info.instance_id);
        }

        if(info.allowedTypes != undefined){
            whereClauses.push(`"Ecosystem".documents.document_type = ANY($${values.length + 1}::document_types[])`);
            values.push(info.allowedTypes);
        }

        if(info.id != undefined){
            whereClauses.push(`"Ecosystem".documents.id = $${values.length + 1}`);
            values.push(info.id)
        }

        if(info.thirdParty_id != undefined){
            whereClauses.push(`"Ecosystem".documents."thirdParty_id" = $${values.length + 1}`);
            values.push(info.thirdParty_id)
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";
            
        let sentece = `
            SELECT
                "Ecosystem".docs_instances.*,
                "Ecosystem".documents.company_id,
                "Ecosystem".documents.store_id,
                "Ecosystem".documents."thirdParty_id",
                "Ecosystem".documents.document_type,
                "Ecosystem".documents."ownSerial",
                "Ecosystem".documents.status,
                "Ecosystem".documents."subTotal",
                "Ecosystem".documents.total,
                "Ecosystem".documents.created_by,
                "Ecosystem".documents.created_at,
                "Ecosystem".documents.updated_at,
                "Ecosystem".documents.description,
                "Ecosystem".documents.paid_amount,
                "Ecosystem".documents.pending_value,
                "Process".process_instance."ownSerial" as "instanceOwnSerial"
            FROM
                "Ecosystem".docs_instances
            LEFT JOIN
                "Ecosystem".documents
            ON
                "Ecosystem".docs_instances.doc_id = "Ecosystem".documents.id
            LEFT JOIN
                "Process".process_instance
            ON
                "Ecosystem".docs_instances.instance_id = "Process".process_instance.id
            ${whereQuery}
            ORDER
                BY "Ecosystem".docs_instances.id DESC
            ;
        `;
        let consulta = await useDataBase(sentece,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

processController.createOp = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let docN = await processController.createDocument(info,true);
        console.log('---> ',docN)
        if(typeof(parseInt(docN.id)) == 'number'){
            let sentence = `
                INSERT INTO "Ecosystem".process_details(
	                company_id, document_id)
                VALUES
                    ($1,$2) RETURNING id;
            `;
            let consulta = await useDataBase(sentence,[
                info.company_id,
                parseInt(docN.id)
            ],3)
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta));
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(false));
        }
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
        let values = []
        let whereClauses = []
        whereClauses.push(`d.company_id = $1 AND d.document_type = 'Production Order'`)
        values.push(info.company_id);

        
        if(info.id != null){
            whereClauses.push(`d.id = $${values.length+1} `);
            values.push(info.id);
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT
                d.id AS id,
                d.company_id,
                d.store_id,
                d."thirdParty_id",
                d.document_type,
                d."ownSerial",
                d.status,
                d."subTotal",
                d.total,
                d.created_by,
                d.created_at,
                d.updated_at,
                d.description,
                d.attached,

                p.id AS process_id,
                p."budgetIncome",
                p."budgetCost",
                p."executedCost",
                p."invoicedValue",
                p.delivery_date,

                u.user_name,

                t.names AS thirdparty_names
            FROM
                "Ecosystem".documents d
            LEFT JOIN
                "Ecosystem".process_details p
                ON d.id = p.document_id
            LEFT JOIN
                "Ecosystem".thirdParties t
                ON d."thirdParty_id" = t.id
            LEFT JOIN
                "Ecosystem".users u
                ON d.created_by = u.user_id
            ${whereQuery}
            ORDER BY d.id DESC
            ${ info.limint ? `LIMIT ${info.limint}` : "" }; `
        let consulta = await useDataBase(sentence,[info.company_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

processController.getDocuments = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const values = [];
        const whereClauses = []
        const variableColumns = []
        const variableJoins = []

        if(info.type == 'Client Order' || info.type == 'Production Order'){
            variableColumns.push('"Ecosystem".process_details."budgetIncome"')
            variableColumns.push('"Ecosystem".process_details."budgetCost"')
            variableColumns.push('"Ecosystem".process_details."executedCost"')
            variableColumns.push('"Ecosystem".process_details."invoicedValue"')
            variableColumns.push('"Ecosystem".process_details.delivery_date')
            variableJoins.push(`
                LEFT JOIN
                    "Ecosystem".process_details
                ON
                    "Ecosystem".documents.id = "Ecosystem".process_details.document_id
                
            `);
        }

        whereClauses.push(`"Ecosystem".documents.company_id = $${values.length +1}`)
        values.push(info.company_id);

        if(info.type != null){
            whereClauses.push(`"Ecosystem".documents.document_type = $${values.length +1}`)
            values.push(info.type)
        }

        if(info.user_id != null){
            whereClauses.push(`"Ecosystem".documents.user_id = $${values.length +1}`)
            values.push(info.user_id);
        }

        if(info.id != null){
            whereClauses.push(`"Ecosystem".documents.id = $${values.length +1}`)
            values.push(info.id);
        }

        if(info.status != null){
            whereClauses.push(`"Ecosystem".documents.status = $${values.length +1}`)
            values.push(info.status);
        }

        if(info.initialDate!= null && info.finalDate != null){
            whereClauses.push(`DATE("Ecosystem".documents.created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}`)
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";
        
        const variableColumsQuery = variableColumns.length>0
        ? `,\n ${variableColumns.join(', \n')}`
        :'';

        let sentence = `
            SELECT
                '${info.type}' AS docType,
                "Ecosystem".documents.*,
                "Ecosystem".users.user_name,
                "Ecosystem".thirdParties.names,
                "Ecosystem".stores.name AS store_name,
                "Ecosystem".documents_group.main_doc_id AS op_id
                ${variableColumsQuery}
            FROM
                "Ecosystem".documents
            LEFT JOIN
                "Ecosystem".documents_group
            ON
                "Ecosystem".documents.id = "Ecosystem".documents_group.doc_id
            LEFT JOIN
                "Ecosystem".users
            ON
                "Ecosystem".documents.created_by = "Ecosystem".users.user_id
            LEFT JOIN
                "Ecosystem".thirdParties
            ON
                "Ecosystem".documents."thirdParty_id" = "Ecosystem".thirdParties.id
            LEFT JOIN
                "Ecosystem".stores
            ON
                "Ecosystem".documents.store_id = "Ecosystem".stores.id
            ${variableJoins}
            ${whereQuery}
            ORDER BY "Ecosystem".documents."ownSerial" DESC
                ${info.limint != null? ` LIMIT ${info.limint}`:''}
            ;
        `;
        let consulta = await useDataBase(sentence,values,1);
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
        console.log(info)
        let sentence = `
            SELECT
                "Ecosystem".documents_group.id,
                "Ecosystem".documents.*
            FROM
                "Ecosystem".documents_group
            LEFT JOIN
                "Ecosystem".documents
            ON
                "Ecosystem".documents_group.doc_id = "Ecosystem".documents.id
            WHERE
                "Ecosystem".documents_group.main_doc_id = $1 ;
        `
        let consulta = await useDataBase(sentence,[info.id],1);
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
        let docN = await processController.createDocument(info,true);
        let document_id = parseInt(docN.id);
        let sentence = `
        INSERT INTO "Ecosystem".process_details(
            company_id, document_id, "budgetIncome", "budgetCost", "executedCost", "invoicedValue", delivery_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
        `
        let consulta = await useDataBase(sentence,[
            parseInt(info.company_id),
            document_id,
            info.budgetIncome,
            info.budgetCost,
            0,
            0,
            info.delivery_date != undefined? info.delivery_date:''
        ],2)
        if(consulta){
            let posSen1 = `
                INSERT INTO "Ecosystem".documents_group(
                    main_doc_id, doc_id)        
                VALUES ($1, $2);
            `
            let postCOnsul1 = await useDataBase(posSen1,[
                parseInt(info.op_id),
                document_id
            ],2);
            let sentence = `
            UPDATE
                "Ecosystem".process_details
            SET
                "budgetIncome" = "budgetIncome" + $1,
                "budgetCost" = "budgetCost" + $2
            WHERE
                document_id = $3 ; 
            `
            let postConsul = await useDataBase(sentence,[
                info.budgetIncome,
                info.budgetCost,
                parseInt(info.op_id)
            ],2);
            if(postCOnsul1 && postConsul){
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
        let docN = await processController.createDocument(info,true);
        let document_id = parseInt(docN.id);
        console.log('Doc de compra creado: ',document_id)
        if(typeof document_id === "number"){
            let posSen1 = `
                INSERT INTO "Ecosystem".documents_group(
                    main_doc_id, doc_id)        
                VALUES ($1, $2);
            `
            let postCOnsul1 = await useDataBase(posSen1,[
                parseInt(info.op_id),
                document_id
            ],2);
            let sentence = `
                UPDATE
                    "Ecosystem".process_details
                SET
                    "executedCost" = "executedCost" + $1
                WHERE
                    document_id = $2 ; 
                `
            let postConsul = await useDataBase(sentence,[
                info.total,
                parseInt(info.op_id)
            ],2);
            if(postCOnsul1 && postConsul){
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(document_id));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify([false,['Error actualizando totales']]));
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
        let docN = await processController.createDocument(info,true);
        let document_id = parseInt(docN.id);
        console.log('Doc de compra creado: ',document_id)
        if(typeof document_id === "number"){
            let posSen1 = `
                INSERT INTO "Ecosystem".documents_group(
                    main_doc_id, doc_id)        
                VALUES ($1, $2);
            `
            let postCOnsul1 = await useDataBase(posSen1,[
                parseInt(info.op_id),
                document_id
            ],2);
            let sentence = `
                UPDATE
                    "Ecosystem".process_details
                SET
                    "invoicedValue" = "invoicedValue" + $1
                WHERE
                    document_id = $2 ; 
                `
            let postConsul = await useDataBase(sentence,[
                info.total,
                parseInt(info.op_id)
            ],2);
            if(postCOnsul1 && postConsul){
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(document_id));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify([false,['Error actualizando totales']]));
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
                ${(info.initialDate!= null && info.finalDate != null)? ` AND DATE(sga_process.OPS.created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}'   `:''}
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

processController.deleteDocument =(req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            DELETE FROM
                sga_process.${info.type}S
            WHERE
                ${info.type == 'OP' && `op_id = ${info.id}`}
                ${info.type != 'OP' && `id = ${info.type}`}
        ;`;
        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.in('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}


// --- new controllers for new version of process

processController.getAviableProcess = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];
        
        whereClauses.push(`pi.company_id = $1`);
        values.push(info.company_id);

        if(info.alloweProcesses != undefined){
            whereClauses.push(`pi.id = ANY($${values.length +1})`);
            values.push(info.alloweProcesses);
        }

        if(info.status != undefined){
            whereClauses.push(`pi.status = $${values.length +1})`);
            values.push(info.status);
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";
        
        let sentence = `
            SELECT 
                pi.*,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', ps.id,
                        'name', ps.name,
                        'order', ps."order"
                    ) ORDER BY ps."order" ASC
                ) AS steps
	        FROM
                "Process".processes pi
            LEFT JOIN
                "Process".process_steps ps
            ON
                pi.id = ps.process_id
            ${whereQuery}
            GROUP BY
                pi.id, pi.company_id, ps.process_id
            ORDER BY name ASC
        `;
        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}

processController.createProcessInstace = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO "Process".process_instance(
                company_id, 
                process_id, 
                step_id,
                status, 
                parent_id, 
                parent_step, 
                start_date, 
                "delivery_date",
                "thirdParty_id",
                responsable
                )
	        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;
        `;

        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.process_id,
            info.step_id,
            info.status,
            info.parent_id,
            info.parent_step,
            info.start_date,
            info.delivery_date,
            info.thirdParty_id,
            info.user_id
        ],3);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}

processController.getProcessInstances =(req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        console.log('------zzz ',info)

        whereClauses.push(`"Process".process_instance.company_id = $1`);
        values.push(info.company_id)

        if(info.id != undefined){
            whereClauses.push(`"Process".process_instance.id = $${values.length +1}`);
            values.push(info.id);
        }

        if(info.process_id != undefined){
            whereClauses.push(`"Process".process_instance.process_id = $${values.length +1}`);
            values.push(info.process_id)
        }

        if(info.allowedInstances != undefined){
            whereClauses.push(`"Process".process_instance.id = ANY($${values.length +1})`);
            values.push(info.allowedInstances);
        }

        if(info.allowedTypes != undefined){
            whereClauses.push(`"Process".process_instance.process_id = ANY($${values.length +1})`);
            values.push(info.allowedTypes);
        }

        if(info.status != undefined && info.status[0] != 'all' ){
            whereClauses.push(`"Process".process_instance.status = ANY($${values.length +1})`);
            values.push(info.status);
        }

        if(info.thirdParty_id != undefined && info.status[0] != 'all' ){
            whereClauses.push(`"Process".process_instance."thirdParty_id" = $${values.length +1}`);
            values.push(info.thirdParty_id);
        }

        // Dates Filters
            if (info.start_date) {
                values.push(info.start_date);
                whereClauses.push(
                    `"Process".process_instance.created_at >= $${values.length}`
                );
            }

            if (info.end_date) {
                values.push(info.end_date);
                whereClauses.push(
                    `"Process".process_instance.created_at <= $${values.length}`
                );
            }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";
        let sentence = `
            SELECT
                "Process".process_instance.*,
                "Ecosystem".users.user_name AS responsable_name,
                "Process".processes.name AS process_name,
                "Process".processes.code AS process_code,
                "Process".processes.id AS process_id,
                "Ecosystem".thirdparties.names AS "thirdParty_name",
                "Process".process_steps.name AS step_name,
                "Process".process_steps.order AS current_step_order,
                -- Contamos el total de pasos para este proceso específico
                (SELECT COUNT(*) 
                FROM "Process".process_steps 
                WHERE "Process".process_steps.process_id = "Process".processes.id
                ) AS total_steps
            FROM
                "Process".process_instance
            LEFT JOIN
                "Process".processes
            ON
                "Process".process_instance.process_id = "Process".processes.id
            LEFT JOIN
                "Ecosystem".users
            ON
                "Process".process_instance.responsable = "Ecosystem".users.user_id
            LEFT JOIN
                "Ecosystem".thirdparties
            ON 
                "Process".process_instance."thirdParty_id" = "Ecosystem".thirdparties.id
            LEFT JOIN
                "Process".process_steps
            ON
                "Process".process_instance.step_id = "Process".process_steps.id
            ${whereQuery}
            ORDER BY
                "Process".process_instance.id DESC
        ;`;
        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}

processController.updateProcessInstanceStatus = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence;
        let consulta;
        if(info.status != 'cancelled'){
            sentence = `
                UPDATE
                    "Process".process_instance
                SET
                    start_date = $1,
                    delivery_date = $2,
                    status = $3,
                    "thirdParty_id" = $4,
                    responsable = $5
                WHERE company_id = $6 AND id = $7;
            `;
            consulta = await useDataBase(sentence,[
                info.start_date,
                info.delivery_date,
                info.status,
                (info.thirdParty_id === '' || info.thirdParty_id === undefined) ? null : info.thirdParty_id,
                info.user_id,
                info.company_id,
                info.id
            ],2);
        }else{
            sentence = `
                UPDATE
                    "Process".process_instance
                SET
                    status = $1,
                    responsable = $2
                WHERE company_id = $3 AND id = $4;
            `;
            consulta = await useDataBase(sentence,[
                info.status,
                info.user_id,
                info.company_id,
                info.id
            ],2);
        }
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    });
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}

processController.getProcessState = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        whereClauses.push(`pi.company_id = $1`);
        values.push(info.company_id);

        if(info.id != undefined){
            whereClauses.push(`pi.id = $${values.length +1}`);
            values.push(info.id)
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";
        
        let sentence = `
            SELECT
                pi.*,
                pr.name AS process_name,
                pr.code AS process_code,
                pr.description AS process_description,
                pr.id AS process_id,
                tp.names AS thirdParty_name,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', ps.id,
                        'name', ps.name,
                        'order', ps."order",
                        'required_roll', ps.required_roll,
                        'subprocess_id', ps.id,
                        -- Aquí integramos los documentos requeridos para este paso
                        'required_docs', COALESCE(docs.list, '[]'::json)
                    ) ORDER BY ps."order" ASC
                ) AS steps
            FROM "Process".process_instance pi
            LEFT JOIN "Process".processes pr ON pi.process_id = pr.id
            LEFT JOIN "Ecosystem".thirdparties tp ON pi."thirdParty_id" = tp.id 
            LEFT JOIN "Process".process_steps ps ON pr.id = ps.process_id
            -- Subconsulta para agrupar documentos por step_id
            LEFT JOIN (
                SELECT 
                    step_id, 
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'docType', "docType",
                            'required', required,
                            'min', min_number,
                            'max', max_number
                        )
                    ) AS list
                FROM "Process".step_doc_realtion
                GROUP BY step_id
            ) docs ON ps.id = docs.step_id
            ${whereQuery}
            GROUP BY
                pi.id, pr.id, tp.names
            ORDER BY
                pi.created_at DESC;
        `;

        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}

processController.getInstanceHistorial = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values= [];
        let whereClauses = [];

        // Dates Filters
            if (info.start_date) {
                values.push(info.start_date);
                whereClauses.push(
                    `"Process".process_historial.created_at >= $${values.length}`
                );
            }

            if (info.end_date) {
                values.push(info.end_date);
                whereClauses.push(
                    `"Process".process_historial.created_at <= $${values.length}`
                );
            }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT
                "Process".process_historial.*,
                prevstep.name AS prevstep_name,
                nextstep.name AS nextstep_name,
                "Process".processes.name AS process_name,
                "Process".processes.code AS process_code,
                "Process".process_instance.process_id,
                "Process".process_instance.status,
                "Ecosystem".users.user_name,
                "Ecosystem".users.img AS user_img
            FROM
                "Process".process_historial
            LEFT JOIN
                "Process".process_steps AS prevstep
            ON
                "Process".process_historial.previous_step = prevstep.id
            LEFT JOIN
                "Process".process_steps AS nextstep
            ON
                "Process".process_historial.next_step = nextstep.id
            LEFT JOIN
                "Process".process_instance
            ON
                "Process".process_historial.instance_id = "Process".process_instance.id
            LEFT JOIN
                "Process".processes
            ON
                "Process".process_instance.process_id = "Process".processes.id
            LEFT JOIN
                "Ecosystem".users
            ON
                "Process".process_historial.user_id = "Ecosystem".users.user_id
            ${whereQuery}
            ORDER BY "Process".process_historial.id DESC
            ${info.limint != undefined ? `LIMIT ${info.limint}`:''}
        `;

        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    });
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}

async function validateFullProcessRequirements(instance_id, process_id) {
    try {
        // 1. Obtenemos TODOS los documentos requeridos para este proceso según la tabla de relaciones
        const requirementsQuery = `
            SELECT "docType", SUM(min_number) as total_min
            FROM "Process".step_doc_realtion
            WHERE company_id = (SELECT company_id FROM "Process".process_instance WHERE id = $1)
            AND step_id IN (SELECT id FROM "Process".process_steps WHERE process_id = $2)
            AND required = true
            GROUP BY "docType"
        `;
        const reqRes = await useDataBase(requirementsQuery, [instance_id, process_id], 1);
        
        if (!reqRes[0] || reqRes[1].length === 0) return { success: true };

        const requirements = reqRes[1];

        // 2. Contamos qué documentos tiene la instancia actualmente
        const countQuery = `
            SELECT d.document_type, COUNT(di.doc_id) as total
            FROM "Ecosystem".docs_instances di
            JOIN "Ecosystem".documents d ON di.doc_id = d.id
            WHERE di.instance_id = $1
            GROUP BY d.document_type
        `;
        const countRes = await useDataBase(countQuery, [instance_id], 1);
        const attachedDocs = countRes[1] || [];

        // 3. Validamos faltantes
        let missingDocs = [];
        for (const req of requirements) {
            const docData = attachedDocs.find(d => d.document_type === req.docType);
            const currentTotal = docData ? parseInt(docData.total) : 0;

            if (currentTotal < req.total_min) {
                missingDocs.push(`${req.docType} (Mínimo: ${req.total_min}, Actual: ${currentTotal})`);
            }
        }

        if (missingDocs.length > 0) {
            return {
                success: false,
                error: `No se puede finalizar el proceso. Faltan los siguientes documentos: ${missingDocs.join(', ')}`
            };
        }

        return { success: true };
    } catch (error) {
        console.log(error)
        console.error("Error validando cierre de proceso:", error);
        return { success: false, error: "Error técnico al validar integridad de documentos." };
    }
}


processController.nextProcessStep = async (req, res) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', async () => {
        try {
            let info = JSON.parse(data);

            // 1. Obtener información de la instancia y el proceso
            const instanceQuery = `
                SELECT pi.id, pi.step_id, pi.process_id, ps.order as current_order
                FROM "Process".process_instance pi
                JOIN "Process".process_steps ps ON pi.step_id = ps.id
                WHERE pi.id = $1
            `;
            const instanceQ = await useDataBase(instanceQuery, [info.instance_id], 1);
            if (!instanceQ[0]) throw new Error("Instancia no encontrada");

            const instance = instanceQ[1][0];

            // 2. Buscar el siguiente paso
            const nextStepQuery = `
                SELECT id, name, required_roll, "order", end_process
                FROM "Process".process_steps
                WHERE process_id = $1 AND "order" > $2
                ORDER BY "order" ASC
                LIMIT 1
            `;
            const nextStepQ = await useDataBase(nextStepQuery, [instance.process_id, instance.current_order], 1);

            if (!nextStepQ[0]) {
                res.writeHead(200);
                return res.end(JSON.stringify({ success: false, message: "El proceso ya ha finalizado." }));
            }
            const nextStep = nextStepQ[1][0];

            // 3. Validar Permisos
            const hasPermission = nextStep.required_roll.includes(info.user_roll);
            if (!hasPermission) {
                res.writeHead(200);
                return res.end(JSON.stringify({ success: false, error: "No tienes el rol necesario para autorizar este paso." }));
            }

            // --- CAMBIO CLAVE: Validación de Cierre ---
            // Si el siguiente paso es el de cierre (end_process), validamos TODO el historial de documentos
            if (nextStep.end_process) {
                const validation = await validateFullProcessRequirements(info.instance_id, instance.process_id);
                if (!validation.success) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ 
                        success: false, 
                        error: validation.error 
                    }));
                }
            }

            // 4. Actualizar la instancia
            const updateQuery = `
                UPDATE "Process".process_instance 
                SET step_id = $1, updated_at = CURRENT_TIMESTAMP, responsable = $3
                WHERE id = $2
            `;
            await useDataBase(updateQuery, [nextStep.id, info.instance_id, info.user_id], 2);

            // 5. Historial
            await useDataBase(`
                INSERT INTO "Process".process_historial(
                    company_id, instance_id, previous_step, next_step, user_id, description)
                VALUES ($1, $2, $3, $4, $5, $6);
            `, [info.company_id, info.instance_id, instance.step_id, nextStep.id, info.user_id, info.description || 'Avance de etapa'], 2);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: `El proceso ha avanzado a: ${nextStep.name}`,
                nextStepId: nextStep.id 
            }));

        } catch (error) {
            console.error(error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    });
};


processController.getEficincyUsers = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        whereClauses.push(`h.company_id = $1`);
        values.push(info.company_id)

        if(info.user_id != undefined){
            whereClauses.push(`h.user_id = $${values.length + 1}`);
            values.push(info.user_id);
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            WITH CalculoTiempos AS (
                SELECT 
                    h.user_id,
                    p.name AS process_name,
                    p.code AS process_code,
                    s.name AS step_name,
                    s.order AS step_order,
                    h.instance_id,
                    h.created_at AS fecha_inicio_accion,
                    -- Obtenemos la fecha del siguiente movimiento para calcular la duración
                    LEAD(h.created_at) OVER (PARTITION BY h.instance_id ORDER BY h.created_at) AS fecha_fin_accion
                FROM "Process".process_historial h
                JOIN "Process".process_instance i ON h.instance_id = i.id
                JOIN "Process".processes p ON i.process_id = p.id
                JOIN "Process".process_steps s ON h.next_step = s.id
                ${whereQuery}
            )
            SELECT 
                user_id,
                process_name,
                process_code,
                step_name,
                step_order,
                COUNT(instance_id) AS total_tasks,
                -- Tiempo promedio en formato intervalo (días, horas, minutos)
                AVG(fecha_fin_accion - fecha_inicio_accion) AS average_time,
                -- Tiempo mínimo y máximo para detectar valores atípicos
                MIN(fecha_fin_accion - fecha_inicio_accion) AS record_time,
                MAX(fecha_fin_accion - fecha_inicio_accion) AS max_time
            FROM CalculoTiempos
            WHERE fecha_fin_accion IS NOT NULL -- Solo contamos pasos terminados
            GROUP BY user_id, process_name, step_name, step_order, process_code
            ORDER BY step_order, total_tasks DESC;
        `;
        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err))
    })
}


// Process utils

processController.relatedoc_instances = async (doc_id, instances) => {
    if (!instances || instances.length === 0) return;
    const values = [];
    const placeholders = [];
    let counter = 1;
    instances.forEach(instance => {
        const instId = instance.instance_id || instance.id;
        const stepId = instance.step_id;
        values.push(doc_id, instId, stepId);
        placeholders.push(`($${counter++}, $${counter++}, $${counter++})`);
    });
    const regDocInstanceSentence = `
        INSERT INTO "Ecosystem".docs_instances (doc_id, instance_id, step_instance)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (doc_id, instance_id) 
        DO UPDATE SET step_instance = EXCLUDED.step_instance; 
    `;

    // 4. Ejecución única en la base de datos
    try {
        return await useDataBase(regDocInstanceSentence, values, 2);
    } catch (error) {
        console.error("🚨 Error al relacionar documento con instancias:", error.message);
        throw error;
    }
};

export default processController;