
import { useDataBase, withTransaction } from "../app.js";
import { companyTimeZoneSql } from "../services/businessTimeZoneService.js";
import { createProcessInstance, createProcessEvidenceService, isExternalAccess, resolveExternalAccessUser } from "../services/processInstanceService.js";
import utilsController from './utilsController.js';
import { advanceProcessStep } from "../services/processStepService.js";
const processController = {};

const handleEvidence = method => async (req, res) => {
    try {
        const service = createProcessEvidenceService({
            withTransaction,
            registerDocument: utilsController.registerDocument,
            linkDocumentInstances: utilsController.linkDocumentInstances
        });
        const data = await service[method](req.body ?? {});
        res.status(method === 'register' ? 201 : 200).json({ status: 'OK', data });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ status: 'ERROR', message: status < 500 ? error.message : 'No se pudo guardar o consultar la evidencia. Intenta nuevamente.' });
    }
};
processController.getEvidenceOptions = handleEvidence('options');
processController.registerEvidence = handleEvidence('register');

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
                COALESCE("Ecosystem".documents."specialConfig"->>'paramDoc_id',
                    "Ecosystem".documents."specialConfig"->>'paramdoc_id') AS paramdoc_id,
                -- Nombre de la plantilla para documentos parametrizados (JSON Parametrization).
                paramtpl.name AS name,
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
                "Custom"."externalDocParameters" paramtpl
            ON
                paramtpl.id = NULLIF(COALESCE("Ecosystem".documents."specialConfig"->>'paramDoc_id',
                    "Ecosystem".documents."specialConfig"->>'paramdoc_id'), '')::bigint
                AND (paramtpl.company_id = "Ecosystem".documents.company_id OR paramtpl.company_id = 0)
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
        let consulta = await useDataBase(sentence,values,1);
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

        if(info.type == 'Sell Invoice'){
            variableColumns.push('electronic_document.number AS electronic_invoice_number')
            variableColumns.push('electronic_document.url AS electronic_invoice_url')
            variableJoins.push(`
                LEFT JOIN LATERAL (
                    SELECT
                        electronic_invoice.number,
                        electronic_invoice.url
                    FROM "ElectronicFacturation".documents electronic_invoice
                    WHERE electronic_invoice.doc_id = "Ecosystem".documents.id
                        AND electronic_invoice.company_id = "Ecosystem".documents.company_id
                        AND electronic_invoice.type = 'electronic invoice'
                    ORDER BY electronic_invoice.id DESC
                    LIMIT 1
                ) electronic_document ON TRUE
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
        const documentId = info.id ?? info.op_id;

        if(documentId == null){
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([false,['Se requiere el id del documento']]))
            return;
        }

        const values = [documentId];
        const companyFilter = info.company_id != null
            ? `AND "Ecosystem".documents.company_id = $2`
            : '';
        if(info.company_id != null) values.push(info.company_id);

        let sentence = `
            WITH target_group AS (
                SELECT COALESCE(
                    (
                        SELECT main_doc_id
                        FROM "Ecosystem".documents_group
                        WHERE doc_id = $1
                        LIMIT 1
                    ),
                    $1::integer
                ) AS main_doc_id
            )
            SELECT
                "Ecosystem".documents.*
            FROM
                "Ecosystem".documents
            CROSS JOIN target_group
            WHERE
                "Ecosystem".documents.id = target_group.main_doc_id
                ${companyFilter}

            UNION

            SELECT
                "Ecosystem".documents.*
            FROM
                "Ecosystem".documents_group
            INNER JOIN
                "Ecosystem".documents
            ON
                "Ecosystem".documents_group.doc_id = "Ecosystem".documents.id
            CROSS JOIN target_group
            WHERE
                "Ecosystem".documents_group.main_doc_id = target_group.main_doc_id
                ${companyFilter}

            ORDER BY id DESC;
        `
        let consulta = await useDataBase(sentence,values,1);
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

        // Procesos permitidos: se puede pasar una lista explícita (info.alloweProcesses)
        // y/o resolverla desde la config del rol del usuario (access.processes).
        let allowedProcesses = Array.isArray(info.alloweProcesses) ? info.alloweProcesses : undefined;

        // Restricción por usuario: leemos access.processes del rol.
        //   overAll:true (o sin config) -> sin restricción (ve todos los procesos)
        //   overAll:false              -> solo los ids listados en "enabled" (vacío = ninguno)
        if(info.user_id != undefined){
            const processesAccess = await useDataBase(`
                SELECT "Ecosystem".roles.config->'access'->'processes' AS processes
                FROM "Ecosystem".users_config
                JOIN "Ecosystem".roles
                  ON "Ecosystem".roles.id = "Ecosystem".users_config.role
                WHERE "Ecosystem".users_config.user_id = $1
                  AND "Ecosystem".users_config.company_id = $2
                LIMIT 1
            `,[info.user_id, info.company_id], 3);
            const access = processesAccess?.processes;
            if(access && access.overAll === false){
                const enabled = Array.isArray(access.enabled) ? access.enabled : [];
                allowedProcesses = allowedProcesses != undefined
                    ? allowedProcesses.filter(id => enabled.map(String).includes(String(id)))
                    : enabled;
            }
        }

        if(allowedProcesses != undefined){
            whereClauses.push(`pi.id = ANY($${values.length +1})`);
            values.push(allowedProcesses);
        }

        if(info.status != undefined){
            whereClauses.push(`pi.status = $${values.length +1}`);
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
        try {
            const info = JSON.parse(data);
            const instance = await withTransaction(client => createProcessInstance(client, info));

            res.writeHead(200,{'Content-Type':'application/json'});
            res.end(JSON.stringify(instance));
        } catch (error) {
            console.error('Error creando instancia de proceso:', error);
            res.writeHead(error.statusCode || 500,{'Content-Type':'application/json'});
            res.end(JSON.stringify({ error: error.message, message: error.message }));
        }
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

        if(info.thirdParty_id != undefined){
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

// Clon de getProcessInstances para el informe "custom" del portal de proveedores:
// devuelve las mismas instancias de proceso pero agregando, por cada instancia, la
// o las referencias del paramDoc (JSON Parametrization) ligadas a sus documentos
// adjuntos. La referencia se resuelve igual que en el informe NEXO 360: por el
// paramDoc principal del grupo del documento (documents_group.main_doc_id) y, si el
// documento adjunto es en sí un JSON Parametrization, por su propia referencia.
processController.getProcessInstancesWithReferences = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

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

        if(info.thirdParty_id != undefined){
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
                ) AS total_steps,
                -- Referencias del paramDoc ligadas a los documentos de la instancia.
                COALESCE(process_references.references_text, '') AS references_text,
                COALESCE(process_references.references_list, '[]'::json) AS references_list
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
            LEFT JOIN LATERAL (
                SELECT
                    STRING_AGG(DISTINCT refs.reference, ', ' ORDER BY refs.reference) AS references_text,
                    JSON_AGG(DISTINCT refs.reference) AS references_list
                FROM "Ecosystem".docs_instances link
                JOIN "Ecosystem".documents linked_doc
                    ON linked_doc.id = link.doc_id
                LEFT JOIN LATERAL (
                    -- (a) el documento adjunto es en sí un paramDoc (JSON Parametrization)
                    SELECT linked_doc."specialConfig"->'values'->>'reference' AS reference
                    WHERE linked_doc.document_type = 'JSON Parametrization'
                    UNION
                    -- (b) el paramDoc principal del grupo del documento adjunto
                    SELECT paramdoc_doc."specialConfig"->'values'->>'reference' AS reference
                    FROM "Ecosystem".documents_group dg
                    JOIN "Ecosystem".documents paramdoc_doc
                        ON paramdoc_doc.id = dg.main_doc_id
                        AND paramdoc_doc.document_type = 'JSON Parametrization'
                    WHERE dg.doc_id = linked_doc.id
                ) refs ON TRUE
                WHERE link.instance_id = "Process".process_instance.id
                    AND refs.reference IS NOT NULL
                    AND refs.reference <> ''
            ) process_references ON TRUE
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
        // Acceso externo (portal): el responsable/autor debe ser el usuario interno
        // del acceso, nunca el tercero ni un user_id enviado por el cliente.
        if (isExternalAccess(info)) {
            try {
                const resolved = await resolveExternalAccessUser(
                    (sql, params) => useDataBase(sql, params, 1).then(([ok, rows]) => {
                        if (!ok) throw new Error('No fue posible validar el acceso externo.');
                        return rows;
                    }),
                    info
                );
                info = { ...info, company_id: resolved.company_id, user_id: resolved.user_id };
            } catch (error) {
                res.writeHead(error.statusCode || 500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message, message: error.message }));
                return;
            }
        }
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
                    responsable = $5,
                    name = $6
                WHERE company_id = $7 AND id = $8;
            `;
            consulta = await useDataBase(sentence,[
                info.start_date,
                info.delivery_date,
                info.status,
                (info.thirdParty_id === '' || info.thirdParty_id === undefined) ? null : info.thirdParty_id,
                info.user_id,
                info.name,
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
                        'subprocesses', COALESCE((
                            SELECT JSON_AGG(JSON_BUILD_OBJECT(
                                'id', child.id,
                                'ownSerial', child."ownSerial",
                                'process_code', child_process.code,
                                'step_id', child.step_id,
                                'step_name', child_step.name,
                                'delivery_date', child.delivery_date,
                                'order', child_step."order",
                                'max_order', (
                                    SELECT MAX(child_process_step."order")
                                    FROM "Process".process_steps child_process_step
                                    WHERE child_process_step.process_id=child.process_id
                                        AND child_process_step.company_id=child.company_id
                                ),
                                -- La fecha legacy de la instancia está almacenada en UTC sin zona.
                                'created_at', child.created_at AT TIME ZONE 'UTC',
                                'created_at_local', (child.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${companyTimeZoneSql('$1')}),
                                'business_date', ((child.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${companyTimeZoneSql('$1')}))::date,
                                'business_time_zone', ${companyTimeZoneSql('$1')},
                                'is_completed', child_step.end_process,
                                'status', child.status,
                                'thirdParty_name', supplier.names
                            ) ORDER BY child.id)
                            FROM "Process".process_instance child
                            JOIN "Process".processes child_process ON child_process.id=child.process_id AND child_process.company_id=pi.company_id
                            JOIN "Process".process_steps child_step ON child_step.id=child.step_id AND child_step.process_id=child.process_id
                            LEFT JOIN "Ecosystem".thirdparties supplier ON supplier.id=child."thirdParty_id" AND supplier.company_id=pi.company_id
                            WHERE child.company_id=pi.company_id AND child.parent_id=pi.id AND child.parent_step=ps.id
                        ), '[]'::json),
                        'advancement', COALESCE(
                            (
                                SELECT JSON_BUILD_OBJECT(
                                    'user_id', history.user_id,
                                    'user_name', history_user.user_name,
                                    -- Columna legacy sin zona: sus valores representan UTC.
                                    'created_at', history.created_at AT TIME ZONE 'UTC',
                                    'created_at_local', (history.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${companyTimeZoneSql('$1')}),
                                    'business_date', ((history.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${companyTimeZoneSql('$1')}))::date,
                                    'business_time_zone', ${companyTimeZoneSql('$1')}
                                )
                                FROM "Process".process_historial history
                                LEFT JOIN "Ecosystem".users history_user
                                    ON history.user_id = history_user.user_id
                                    AND history.company_id = history_user.company_id
                                WHERE history.company_id = pi.company_id
                                    AND history.instance_id = pi.id
                                    AND history.next_step = ps.id
                                ORDER BY history.created_at DESC, history.id DESC
                                LIMIT 1
                            ),
                            (
                                SELECT JSON_BUILD_OBJECT(
                                    'user_id', pi.responsable,
                                    'user_name', creator.user_name,
                                    'created_at', pi.created_at AT TIME ZONE 'UTC',
                                    'created_at_local', (pi.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${companyTimeZoneSql('$1')}),
                                    'business_date', ((pi.created_at AT TIME ZONE 'UTC') AT TIME ZONE (${companyTimeZoneSql('$1')}))::date,
                                    'business_time_zone', ${companyTimeZoneSql('$1')}
                                )
                                FROM "Ecosystem".users creator
                                WHERE creator.user_id = pi.responsable
                                    AND creator.company_id = pi.company_id
                                    AND ps.id = pi.step_id
                                    AND ps."order" = (
                                        SELECT MIN(initial_step."order")
                                        FROM "Process".process_steps initial_step
                                        WHERE initial_step.process_id = pi.process_id
                                    )
                                LIMIT 1
                            )
                        ),
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
                            'docType', CASE WHEN paramdoc_id IS NOT NULL THEN 'JSON Parametrization' ELSE "docType"::text END,
                            'required', required,
                            'min', min_number,
                            'max', max_number,
                            'paramdoc_id', paramdoc_id
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

async function validateFullProcessRequirements(instance_id, process_id, client) {
    const query = async (sql, values) => [true, (await client.query(sql, values)).rows];
    try {
        // 1. Obtenemos TODOS los documentos requeridos para este proceso según la tabla de relaciones
        const requirementsQuery = `
            SELECT CASE WHEN paramdoc_id IS NOT NULL THEN 'JSON Parametrization' ELSE "docType"::text END AS "docType",
                paramdoc_id, SUM(min_number) as total_min
            FROM "Process".step_doc_realtion
            WHERE company_id = (SELECT company_id FROM "Process".process_instance WHERE id = $1)
            AND step_id IN (SELECT id FROM "Process".process_steps WHERE process_id = $2)
            AND required = true
            GROUP BY "docType", paramdoc_id
        `;
        const reqRes = await query(requirementsQuery, [instance_id, process_id]);
        
        if (!reqRes[0] || reqRes[1].length === 0) return { success: true };

        const requirements = reqRes[1];

        // 2. Contamos qué documentos tiene la instancia actualmente
        const countQuery = `
            SELECT d.document_type,
                COALESCE(d."specialConfig"->>'paramDoc_id', d."specialConfig"->>'paramdoc_id') AS paramdoc_id,
                COUNT(DISTINCT di.doc_id) as total
            FROM "Ecosystem".docs_instances di
            JOIN "Ecosystem".documents d ON di.doc_id = d.id
            WHERE di.instance_id = $1 AND d.status::text <> 'cancelled'
            GROUP BY d.document_type, COALESCE(d."specialConfig"->>'paramDoc_id', d."specialConfig"->>'paramdoc_id')
        `;
        const countRes = await query(countQuery, [instance_id]);
        const attachedDocs = countRes[1] || [];

        // 3. Validamos faltantes
        let missingDocs = [];
        for (const req of requirements) {
            const currentTotal = attachedDocs.filter(d => d.document_type === req.docType
                && (req.paramdoc_id == null || String(d.paramdoc_id) === String(req.paramdoc_id)))
                .reduce((sum, document) => sum + Number(document.total), 0);

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


processController.advanceProcessInstance = (client, info) =>
    advanceProcessStep(client, info, validateFullProcessRequirements);

processController.nextProcessStep = async (req, res) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', async () => {
        try {
            let info = JSON.parse(data);

            const result = await withTransaction(async client => {
                // Acceso externo (portal): resolver el responsable interno antes de
                // escribir instancia/historial; un tercero no puede ser autor.
                if (isExternalAccess(info)) {
                    const resolved = await resolveExternalAccessUser(
                        (sql, params) => client.query(sql, params).then(r => r.rows),
                        info
                    );
                    info = { ...info, company_id: resolved.company_id, user_id: resolved.user_id };
                }
                return processController.advanceProcessInstance(client, info);
            });
            res.writeHead(200,{'Content-Type':'application/json'});
            res.end(JSON.stringify(result));
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
