
import { useDataBase } from "../app.js";
const treasuryController = {};

treasuryController.getThirdPartyPortfolio = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        whereClauses.push(`"Treasury".accounts_receivable.company_id = $1`);
        values.push(info.company_id);

        if (info.thirdParty_id != undefined) {
            whereClauses.push(`$${values.length + 1} = "Ecosystem".documents."thirdParty_id"`);
            values.push(info.thirdParty_id);
        }

        if (info.store_id != undefined) {
            whereClauses.push(`$${values.length + 1} = ANY("Ecosystem".documents.store_id)`);
            values.push(info.store_id);
        }

        if(info.id != undefined){
            whereClauses.push(`"Treasury".accounts_receivable.id = $${values.length +1}`);
            values.push(info.id)
        }

        // Dates Filters
            if (info.start_date) {
                values.push(info.start_date);
                whereClauses.push(
                    `"Treasury".accounts_receivable.created_at >= $${values.length}`
                );
            }

            if (info.end_date) {
                values.push(info.end_date);
                whereClauses.push(
                    `"Treasury".accounts_receivable.created_at < $${values.length}::date + INTERVAL '1 day'`
                );
            }


        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT 
                "Treasury".accounts_receivable.company_id,
                "Treasury".accounts_receivable."thirdParty_id",
                "Treasury".accounts_receivable.document_id,
                "Treasury".accounts_receivable.id,
                "Treasury".accounts_receivable.total,
                "Treasury".accounts_receivable.paid_amount,
                "Treasury".accounts_receivable.pending_amount,
                "Treasury".accounts_receivable.due_date,
                "Treasury".accounts_receivable.created_at,
                "Treasury".accounts_receivable.updated_at,
                "Treasury".accounts_receivable.instance_id,
                "Ecosystem".documents.store_id,
                "Ecosystem".documents.id AS doc_id,
                "Ecosystem".documents."thirdParty_id",
                "Ecosystem".documents.document_type AS doc_type, 
                "Ecosystem".documents."ownSerial",
                "Ecosystem".stores.name AS store_name,
                "Process".process_instance.process_id,
                "Process".process_instance."ownSerial" AS instance_serial,
                "Process".processes.code AS process_code
	        FROM 
                "Treasury".accounts_receivable
            LEFT JOIN
                "Ecosystem".documents
            ON
                "Treasury".accounts_receivable.document_id = "Ecosystem".documents.id
            LEFT JOIN
                "Ecosystem".stores
            ON
                "Ecosystem".documents.store_id = "Ecosystem".stores.id
            LEFT JOIN
                "Process".process_instance
            ON
                "Treasury".accounts_receivable.instance_id = "Process".process_instance.id
            LEFT JOIN
                "Process".processes
            ON
                "Process".process_instance.process_id = "Process".processes.id
            ${whereQuery}
            ORDER BY 
                "Treasury".accounts_receivable.created_at DESC
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

export default treasuryController;