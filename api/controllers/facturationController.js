import { useDataBase } from "../app.js";
import processController from "./processController.js";
import sellInvoiceService from "../services/sellInvoiceService.js";
import cashReceiptService from "../services/cashReceiptService.js";
import purchaseService from "../services/purchaseService.js";
import utilsController from "./utilsController.js";
const facturationController = {};


facturationController.newClientOrder = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        console.log(info)
        let docCreation = `
            INSERT INTO "Ecosystem".documents(
                company_id,
                store_id, 
                "thirdParty_id", 
                document_type,
                status, 
                "subTotal", 
                total, 
                created_by,  
                description, 
                attached, 
                instance_id,
                step_instance)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, "ownSerial";
    `;
        let consulta = await useDataBase(docCreation,[
            info.company_id,
            info.store_id,
            info.thirdParty_id,
            info.doc_type,
            info.status,
            info.subTotal,
            info.total,
            info.created_by,
            info.description,
            JSON.stringify(info.attached),
            info.instance_id != "" && info.instance_id != undefined? info.instance_id:undefined,
            info.instance_id != "" && info.instance_id != undefined? info.step_id:undefined
        ],3);
        if(info.instance_id != undefined && consulta.id != undefined){
            await processController.relatedoc_instances(consulta.id,info.instances)
        }
        if(info.productsServices != undefined && consulta.id != undefined){
            for(const element of info.productsServices){
                let insertMovSen = `
                    INSERT INTO "Inventory".services_movement(
                        company_id,
                        store_id,
                        "thirdParty_id",
                        service_id,
                        units,
                        unit_value,
                        total,
                        description,
                        instance_id,
                        doc_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
                `
                let inserServMovement = await useDataBase(insertMovSen,[
                    info.company_id,
                    info.store_id,
                    info.thirdParty_id,
                    element.id || element.product_id,
                    element.units,
                    element.unit_value,
                    element.total,
                    element.description,
                    info.instance_id != "" && info.instance_id != undefined? info.instance_id:undefined,
                    consulta.id
                ],2);
                console.log(inserServMovement)
            }
        }
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


facturationController.updateThirdPartyPortfolio = async()=>{
    let consulta = await useDataBase('REFRESH MATERIALIZED VIEW CONCURRENTLY "Ecosystem".mv_thirdparty_account_balances;',[],2);
    console.log(consulta);
}


facturationController.newCashRecipt = (req,res)=>{
    utilsController.readJsonBody(req)
        .then(async(info)=>{
            const result = await cashReceiptService.register(info);
            res.writeHead(result.status === "OK" ? 200 : 400, {'Content-Type':'application/json'});
            res.end(JSON.stringify(result));
        })
        .catch((err)=>{
            console.error("Error al crear recibo de caja:", err);
            res.writeHead(500, {'Content-Type':'application/json'});
            res.end(JSON.stringify({
                status: "Error",
                message: err.message
            }));
        });
}

facturationController.newSellInvoice = (req,res)=>{
    utilsController.readJsonBody(req)
        .then(async(info)=>{
            const result = await sellInvoiceService.register(info);
            res.writeHead(result.status === "OK" ? 200 : 400, {'Content-Type':'application/json'});
            res.end(JSON.stringify(result));
        })
        .catch((err)=>{
            console.error("Error al crear factura de venta:", err);
            res.writeHead(500, {'Content-Type':'application/json'});
            res.end(JSON.stringify({
                status: "Error",
                message: err.message
            }));
        });
}

facturationController.newPurchase = (req,res)=>{
    utilsController.readJsonBody(req)
        .then(async(info)=>{
            const result = await purchaseService.register(info);
            res.writeHead(result.status === "OK" ? 200 : 400, {'Content-Type':'application/json'});
            res.end(JSON.stringify(result));
        })
        .catch((err)=>{
            console.error("Error al crear la compra:", err);
            res.writeHead(500, {'Content-Type':'application/json'});
            res.end(JSON.stringify({
                status: "Error",
                message: err.message
            }));
        });
}

facturationController.newNote = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        console.log(info)
        let docCreation = `
            INSERT INTO "Ecosystem".documents(
	            company_id,
                store_id, 
                "thirdParty_id", 
                document_type, 
                status, 
                "subTotal", 
                total, 
                created_by,  
                description, 
                attached, 
                instance_id,
                step_instance)
	    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, "ownSerial";
    `;
        let consulta = await useDataBase(docCreation,[
            info.company_id,
            info.store_id,
            info.thirdParty_id,
            info.type,
            info.status,
            info.subTotal,
            info.total,
            info.created_by,
            info.description,
            JSON.stringify(info.attached),
            info.instance_id != "" && info.instance_id != undefined? info.instance_id:undefined,
            info.instance_id != "" && info.instance_id != undefined? info.step_id:undefined
        ],3);
        //facturationController.updateThirdPartyPortfolio();
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


facturationController.getCashBoxes = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        whereClauses.push(`"Treasury".cash_boxes.company_id = $1`);
        values.push(info.company_id);

        if (info.user_id != undefined) {
            whereClauses.push(`$${values.length + 1} = ANY("Treasury".cash_boxes.allowedUsers)`);
            values.push(info.user_id);
        }

        if (info.store_id != undefined) {
            whereClauses.push(`$${values.length + 1} = ANY("Treasury".cash_boxes.allowedStores)`);
            values.push(info.store_id);
        }

        if(info.id != undefined){
            whereClauses.push(`"Treasury".cash_boxes.id = $${values.length +1}`);
            values.push(info.id)
        }

        if(info.allowedCashBoxes != undefined){
            whereClauses.push(`"Treasury".cash_boxes.id = ANY($${values.length +1})`);
            values.push(info.allowedCashBoxes);
        }


        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT DISTINCT ON ("Treasury".cash_boxes.id)
                "Treasury".cash_boxes.*,
                "Facturation".register_shifts.id AS shift_id,
                "Facturation".register_shifts.status AS shift_status,
                "Facturation".register_shifts.opening_time
            FROM 
                "Treasury".cash_boxes
            LEFT JOIN
                "Facturation".register_shifts
            ON
                "Facturation".register_shifts."cashBox_id" = "Treasury".cash_boxes.id
            ${whereQuery}
            ORDER BY 
                "Treasury".cash_boxes.id, 
                "Facturation".register_shifts.id DESC; -- Trae el ID más alto (el último)
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


facturationController.getRegisterShift = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        whereClauses.push(`"Facturation".register_shifts.company_id = $1`);
        values.push(info.company_id);

        if(info.id != undefined){
            whereClauses.push(`i"Facturation".register_shifts.id = $${values.length + 1}`);
            values.push(info.id);
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT 
                "Facturation".register_shifts.user_id, 
                "Facturation".register_shifts.id, 
                "Facturation".register_shifts."initialBalance", 
                "Facturation".register_shifts."expectedBalance", 
                "Facturation".register_shifts.actual_balance, 
                "Facturation".register_shifts.diference, 
                "Facturation".register_shifts.status, 
                "Facturation".register_shifts.opening_time, 
                "Facturation".register_shifts.closing_time, 
                "Facturation".register_shifts.created_at,
                "Facturation".register_shifts.updated_at, 
                "Facturation".register_shifts."cashBox_id",
                "Treasury".cash_boxes.name AS "cashBox_name",
                "Ecosystem".users.user_name AS responsable,
                "Ecosystem".users.img AS user_img
	        FROM 
                "Facturation".register_shifts
            LEFT JOIN
                "Ecosystem".users
            ON
                "Facturation".register_shifts.user_id = "Ecosystem".users.user_id
            LEFT JOIN
                "Treasury".cash_boxes
            ON
                "Facturation".register_shifts."cashBox_id" = "Treasury".cash_boxes.id
            ${whereQuery}
            ORDER BY "Facturation".register_shifts.created_at DESC
            ${info.limit != undefined? 'LIMIT 1':''}
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


facturationController.openCashRegister = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        // Verification of status in last shift
            let senV1 = `
                SELECT
                    status
                FROM
                    "Facturation".register_shifts
                WHERE
                    company_id = $1 AND cashBox_id = $2 AND status = 'open'
                ORDER BY id DESC LIMIT 1 ;
            `;
            let v1 = await useDataBase(senV1,[
                info.company_id,
                info.cashBox_id
            ],1)
            console.log(v1)
            if(v1[0]){
                 res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify({
                    status:'false',
                    message:'La caja ya esta abierta y en uso.'
                }));
                return;
            }
        let sentence = `
            INSERT INTO "Facturation".register_shifts(
                company_id, 
                user_id,
                "initialBalance", 
                "expectedBalance",
                actual_balance,
                diference,
                status,
                opening_time,
                "cashBox_id")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.user_id,
            0,
            0,
            0,
            0,
            'open',
            info.opening_time,
            info.cashBox_id
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify({
            status:true,
            message:consulta[1]
        }));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

facturationController.closeCashRegister = (req,res)=>{
    let data = '';
    req.on('data',chunk =>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            UPDATE 
                "Facturation".register_shifts
            SET
                status = 'closed'
            WHERE
                company_id = $1 AND id = $2 ;
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.id
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify({
            status:consulta,
            message:'Caja cerrada exitosamente'
        }));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify({
            status:false,
            message:err
        }));
    })
}


facturationController.getCashRegisterReport = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT 
                "Facturation".mv_shift_payment_summaries."paymentMethod_id", 
                "Facturation".mv_shift_payment_summaries.total_db, 
                "Facturation".mv_shift_payment_summaries.total_cr, 
                "Facturation".mv_shift_payment_summaries.net_balance,
                "Ecosystem".payment_methods.name AS "paymentMethod_name",
                "Ecosystem".payment_methods.type AS "paymentMethod_type"
            FROM 
                "Facturation".mv_shift_payment_summaries 
            LEFT JOIN
                "Ecosystem".payment_methods
            ON
                "Facturation".mv_shift_payment_summaries."paymentMethod_id" = "Ecosystem".payment_methods.id
            WHERE "Facturation".mv_shift_payment_summaries.shift_id = $1
        `;
        let consulta = await useDataBase(sentence,[
            info.shift_id
        ],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

facturationController.getTransactionsOfCashRecord = (req, res) => {
    let data = '';

    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', async () => {
        try {
            const info = JSON.parse(data);

            let values = [];
            let whereClauses = [];

            if (info.shift_id != undefined) {
                whereClauses.push(`"Facturation".shift_settlement_details.shift_id = $${values.length + 1}`);
                values.push(info.shift_id);
            }

            if (info.paymentMethod_id != undefined) {
                whereClauses.push(`"Ecosystem".transaction_detail."paymentMethod_id" = $${values.length + 1}`);
                values.push(info.paymentMethod_id);
            }

            if (info.doc_id != undefined) {
                whereClauses.push(`"Ecosystem".transactions.doc_id = $${values.length + 1}`);
                values.push(info.doc_id);
            }

            const whereQuery = whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

            let sentence = `
                SELECT
                    "Facturation".shift_settlement_details.id AS shift_settlement_id,
                    "Ecosystem".transaction_detail.*,
                    "Ecosystem".concepts.name AS concept_name,
                    "Ecosystem".contable_accounts.code AS account_code,
                    "Ecosystem".transactions.doc_type,
                    "Ecosystem".transactions.doc_id,
                    "Ecosystem".documents.instance_id,
                    "Ecosystem".documents."ownSerial",
                    "Process".process_instance."ownSerial" AS instance_serial,
                    "Process".processes.code AS process_code,
                    "Ecosystem".payment_methods.name AS payment_name,
                    "Ecosystem".thirdparties.names AS thirdParty_name,
                    "ElectronicFacturation".documents.number AS e_doc_number,
                    "ElectronicFacturation".documents.url AS e_doc_url,
                    "Ecosystem".thirdparties.img AS thirdParty_img
                FROM
                    "Facturation".shift_settlement_details
                LEFT JOIN
                    "Ecosystem".transaction_detail
                LEFT JOIN
                    "Ecosystem".transactions
                ON
                    "Ecosystem".transaction_detail.transaction_id = "Ecosystem".transactions.id
                ON
                    "Facturation".shift_settlement_details."transactionDetail_id" = "Ecosystem".transaction_detail.id
                LEFT JOIN
                    "Ecosystem".concepts
                ON 
                    "Ecosystem".transactions.concept_id = "Ecosystem".concepts.id
                LEFT JOIN
                    "Ecosystem".contable_accounts
                ON
                    "Ecosystem".concepts.account_id = "Ecosystem".contable_accounts.id
                LEFT JOIN
                    "Ecosystem".payment_methods
                ON 
                    "Ecosystem".transaction_detail."paymentMethod_id" = "Ecosystem".payment_methods.id
                LEFT JOIN
                    "Ecosystem".thirdparties
                ON
                    "Ecosystem".transaction_detail."thirdParty_id" = "Ecosystem".thirdparties.id
                LEFT JOIN
                    "Ecosystem".documents
                ON
                    "Ecosystem".transactions.doc_id = "Ecosystem".documents.id
                LEFT JOIN
                    "ElectronicFacturation".documents
                ON
                    "Ecosystem".transactions.doc_id = "ElectronicFacturation".documents.doc_id
                LEFT JOIN
                    "Ecosystem".docs_instances
                ON
                    "Ecosystem".transactions.doc_id = "Ecosystem".docs_instances.doc_id
                LEFT JOIN
                    "Process".process_instance
                ON
                    "Ecosystem".docs_instances.instance_id = "Process".process_instance.id
                LEFT JOIN
                    "Process".processes
                ON
                    "Process".process_instance.process_id = "Process".processes.id
                ${whereQuery}
                ORDER BY "Ecosystem".transaction_detail.created_at DESC;
            `;

            const consulta = await useDataBase(sentence, values, 1);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(consulta));

        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    });

    req.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(err));
    });
};


facturationController.getBriefcaseBills = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                "Treasury".accounts_receivable.*,
                "Ecosystem".docs_instances.instance_id,
                "Ecosystem".docs_instances.doc_id,
                "Process".process_instance.process_id, 
                "Process".processes.code AS process_code
            FROM
                "Treasury".accounts_receivable
            LEFT JOIN
                "Ecosystem".docs_instances
            ON
                "Treasury".accounts_receivable.document_id = "Ecosystem".docs_instances.doc_id
            LEFT JOIN
                "Process".process_instance
            ON
                "Ecosystem".docs_instances.instance_id = "Process".process_instance.id
            LEFT JOIN
                "Process".processes
            ON
                "Process".process_instance.process_id = "Process".processes.id
            WHERE
                "Treasury".accounts_receivable.company_id = $1 
                AND "Treasury".accounts_receivable."thirdParty_id" = $2
                AND pending_amount > 0
            ORDER BY "Treasury".accounts_receivable.created_at DESC
            ;
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.thirdParty_id
        ],1)
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


facturationController.updatePaymentDocument = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log(info)
        let sentence = `
            UPDATE "Ecosystem".documents
            SET paid_amount = paid_amount + $2
            WHERE id = $1;
        `;
        let consulta = await useDataBase(sentence,[
            info.id,
            info.paid_amount,
        ],2)
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



export default facturationController;
