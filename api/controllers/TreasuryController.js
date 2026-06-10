import { useDataBase } from "../app.js";
import {utilsController} from './utilsController.js'

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
                    "Ecosystem".docs_instances.instance_id,
                    "Ecosystem".documents.store_id,
                    "Ecosystem".documents.id AS doc_id,
                    "Ecosystem".documents."thirdParty_id",
                    "Ecosystem".documents.document_type AS doc_type, 
                    "Ecosystem".documents."ownSerial",
                    "Ecosystem".stores.name AS store_name,
                    "Process".process_instance.process_id, -- Ahora sí funcionará
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
                    "Ecosystem".docs_instances
                ON
                    "Ecosystem".documents.id = "Ecosystem".docs_instances.doc_id
                LEFT JOIN
                    "Process".process_instance
                ON
                    "Ecosystem".docs_instances.instance_id = "Process".process_instance.id
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

treasuryController.newAccountReceivable = async(info,element)=>{
    let res = {}
    let senInsBreafcase = `
        INSERT INTO "Treasury".accounts_receivable(
            company_id,
            "thirdParty_id",
            document_id,
            total,
            paid_amount,
            due_date)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
    `;
    let insertBreafCaseBill = await useDataBase(senInsBreafcase,[
        info.company_id,
        info.thirdParty_id,
        info.doc_id,
        element.total,
        0,
        element.due_date
    ])
    if(insertBreafCaseBill.id != undefined && insertBreafCaseBill.id != null){
        res.status = "OK"
        res.description = `Cuenta de cobro #${insertBreafCaseBill.id} creada correctamente.`
    }else{
        res.status = "Error"
        res.description = `Error al crear la cuenta de cobro`
    }
    return(res);
}

treasuryController.newPaymentOfBriefCase = async(info,element,doc_id)=>{
    let res = {}
    // Register payment
    let insertMovement = await useDataBase(`
        INSERT INTO "Treasury".portfolio_payments(
            company_id,
            store_id,
            "thirdParty_id",
            document_id,
            instance_id,
            paid_value, 
            "creationDocument_id")
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
    `,[
        info.company_id,
        info.store_id,
        info.thirdParty_id,
        element.document_id,
        element.instance_id,
        element.paid_value,
        doc_id
    ],3);
    if(insertMovement.id != undefined){
        res.insert = {
            status:"OK",
            id:insertMovement.id,
            description:"Pago registrado correctamente."
        }
        // Update bill
        let updatePayment = await useDataBase(`
            UPDATE
                "Treasury".accounts_receivable
            SET
                paid_amount = paid_amount + $2
            WHERE id = $1 ;
        `,[element.id,element.paid_value],3);

        if(updatePayment){
            res.updatePayment = {
                status:"OK",
                description:`Documento actualizado correctamente.`
            }
        }else{
            res.updatePayment = {
                status:"Error",
                description:`Error al actualizar documento.`
            }
        }

    }else{
        res.insert = {
        status:"Error",
        description:"Error al registrar el pago."
    }
    }
    treasuryController.refreshThirdPartyBalance();
    return res;
}

treasuryController.refreshThirdPartyBalance = async()=>{
    await useDataBase('REFRESH MATERIALIZED VIEW CONCURRENTLY "Ecosystem".mv_thirdparty_account_balances;',[],2);
}


treasuryController.purchase = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const document = await utilsController.registerDocument(info)
    })
}

treasuryController.accountPayable = async()=>{
    let info = "";
    let sentence = `
        
    `;
}

export default treasuryController;