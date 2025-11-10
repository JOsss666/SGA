
import { calcWeightedAverage, encrypt, isRelevanPrompt, useDataBase, actualDate } from "../app.js";
import fs from "fs";
import path from "path";
import { send_API_AI } from "../ApiFunctions.js";
const controller = {};

controller.uploadChunk = (req, res) => {
    const { fileId, chunkIndex } = req.body;
    const chunkFolder = path.join(CHUNKS_DIR, fileId);

    if (!fs.existsSync(chunkFolder)) fs.mkdirSync(chunkFolder);

    fs.renameSync(req.file.path, path.join(chunkFolder, `${chunkIndex}`));
    res.json({ message: "Chunk recibido" });
};

controller.mergeChunks = (req, res) => {
    const { fileId, fileName } = req.body;
    
    const chunkFolder = path.join(CHUNKS_DIR, fileId);
    const finalPath = path.join(FINAL_DIR, fileName);

    if (!fs.existsSync(chunkFolder)) {
        return res.status(400).json({ error: "No se encontraron chunks" });
    }

    const chunkFiles = fs.readdirSync(chunkFolder).sort((a, b) => Number(a) - Number(b));
    const writeStream = fs.createWriteStream(finalPath);

    for (const chunkFile of chunkFiles) {
        const chunkPath = path.join(chunkFolder, chunkFile);
        const data = fs.readFileSync(chunkPath);
        writeStream.write(data);
        fs.unlinkSync(chunkPath);
    }

    writeStream.end();
    fs.rmdirSync(chunkFolder);

    res.json({ message: "Archivo ensamblado correctamente", path: finalPath });
};


controller.createCompany = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO
                sga_ecosystem.companies(
                    legal_name,
                    trade_name,
                    indentification_type,
                    indentification_number,
                    company_mail,
                    company_key,
                    phone,
                    country,
                    city,
                    address
                )
            VALUES(?,?,?,?,?,?,?,?,?,?);
        `;
        let newompany_key = encrypt(`
            ${info.trade_name}*_${info.indentification_number}SGA_ab26212caa96090eacaebbf1${info.phone}_${actualDate.toISOString()}
        `);
        let consulta = await useDataBase(sentence,[
            legal_name,
                info.trade_name,
                info.indentification_type,
                info.indentification_number,
                info.company_mail,
                newompany_key,
                info.phone,
                info.country,
                info.city,
                info.address
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getUserInfo = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        if(data != ''){
            let info = JSON.parse(data);
            let sentence = `
                SELECT
                    sga_ecosystem.users.* , sga_ecosystem.users_access.* 
                FROM 
                    sga_ecosystem.users LEFT JOIN sga_ecosystem.users_access
                ON
                    sga_ecosystem.users.user_id = sga_ecosystem.users_access.user_id 
                WHERE
                    sga_ecosystem.users.user_key = ? ;`
            let consulta = await useDataBase(sentence,[info],1);
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


controller.getCompanyInfo = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT 
                sga_ecosystem.companies.*,
                sga_ecosystem.acount_plans.id AS accountPlanId,
                sga_ecosystem.acount_plans.type AS accountPlanType
            FROM
                sga_ecosystem.companies 
            LEFT JOIN
                sga_ecosystem.acount_plans
            ON
                sga_ecosystem.companies.company_id = sga_ecosystem.acount_plans.company_id
            WHERE sga_ecosystem.companies.company_key = ? ;`
        let consulta = await useDataBase(sentence,[info],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.createAccountsPlan = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO
                sga_ecosystem.acount_plans
            (
                company_id,
                name,
                type
            )
            VALUES(
                ${info.company_id},
                '${info.name}',
                '${info.typePLan}'
            );
        `;
    let consulta = await useDataBase(sentence,[],2);
    res.writeHead(200,{'Content-Type':'text/plain'})
    res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.logIn = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                sga_ecosystem.users.*,
                sga_ecosystem.companies.company_key
            FROM    
                sga_ecosystem.users
            LEFT JOIN
                sga_ecosystem.companies
            ON
                sga_ecosystem.users.company_id = sga_ecosystem.companies.company_id
            WHERE
                user_mail = '${info.mail}'
                AND user_password = '${encrypt(info.pass)}'
            LIMIT 1;
        `
        let consulta = await useDataBase(sentence,[],1);
        if(consulta[0]){
            let postSen = `
                UPDATE sga_ecosystem.users_access
                SET user_session = 1
                WHERE user_id = ?
            `;
            let postConsul = await useDataBase(postSen,[consulta[1][0].user_id],2);
            if(postConsul){
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(consulta));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify([false,[]]));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.logOut = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
        UPDATE sga_ecosystem.users_access
        SET user_session = 0 
        WHERE user_id = ?
        ;
        `;
        let consulta = await useDataBase(sentence,[info.user_id],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.signUp = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT
            INTO   
                sga_ecosystem.users(
                    company_id,
                    user_name,
                    user_mail,
                    user_password,
                    user_key
                )
            VALUES(?,?,?,?,?);
        `;
        let newUserKey = encrypt(`${info.name.slice(1,info.name.length -1)}${info.mail.split('@')[0]}|SGA_ab26212caa96090eacaebbf1**_${info.pass}${actualDate.toISOString()}`);
        let consulta = await useDataBase(sentence,[info.company_id,info.name,info.mail,encrypt(info.pass),newUserKey],4);
        if(typeof(consulta) == 'number'){
            let posSen = `
                INSERT INTO 
                    sga_ecosystem.users_access (user_id)
                VALUES(?);
            `;
            let posCon = await useDataBase(posSen,[consulta],2);
            if(posCon){
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(true));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(false));
            }
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

controller.insertNewAccount = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let tableAcc = info.typePlanAccount == 'PUC'? 'account_templates_PUC':'contable_accounts';
        let sentence = `
            INSERT INTO
                sga_ecosystem.${tableAcc}
            (
                company_id,
                code,
                name,
                level,
                type,
                account_path
            )VALUES(
                ${info.company_id},
                '${info.code}',
                '${info.name}',
                ${(info.code).length},
                '${info.type}',
                '${info.code}'
            );
        `; 
        let consulta = await useDataBase(sentence,[],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getAccountsPlan = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let prevSen = `
            SELECT
                *
            FROM
                sga_ecosystem.acount_plans
            WHERE
                sga_ecosystem.acount_plans.company_id = ${info.company_id};
        ` 
        let prevCons = await useDataBase(prevSen,[],1);
        if(prevCons[0]){
            let sentence = `
                SELECT * FROM (
                    SELECT 
                        'PUC' as type,
                        id,code,name,level,account_path
                    FROM sga_ecosystem.account_templates_PUC
                    UNION ALL
                    SELECT 
                        'personalized',
                        id,code,name,level,account_path
                    FROM sga_ecosystem.contable_accounts
                    WHERE 
                        sga_ecosystem.contable_accounts.company_id = ${info.company_id}
                        AND sga_ecosystem.contable_accounts.active = 1
                ) 
                AS results
                    ORDER BY account_path ASC;  
            `;
            let consulta = await useDataBase(sentence,[],1);
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([prevCons,consulta]));
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([false,'No existe un plan de cuentas.']));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
    
}

controller.createTax = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO
                sga_ecosystem.taxes(
                    company_id,
                    account_id,
                    code,
                    rate,
                    base
                )
            VALUES(?,?,?,?,?);
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.account_id,
            info.code,
            info.rate,
            info.base
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getTaxes = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence;
        let tableAcc = info.typePlanAccount == 'PUC'? 'contable_accounts':'account_templates_PUC';
        if(info.attached == undefined){
            sentence = `
            SELECT
                sga_ecosystem.taxes.id AS tax_id,
                sga_ecosystem.taxes.code,
                sga_ecosystem.taxes.rate,
                sga_ecosystem.taxes.base,
                sga_ecosystem.${tableAcc}.*
            FROM
                sga_ecosystem.taxes
            LEFT JOIN
                sga_ecosystem.${tableAcc}
            ON
                sga_ecosystem.taxes.account_id = sga_ecosystem.${tableAcc}.id
            WHERE
                sga_ecosystem.taxes.company_id = ${info.company_id}
                ${info.id != null?`AND sga_ecosystem.taxes.id = ${info.id}`:''}
                ${info.limit != null? `LIMIT ${info.limit}`:''}
                ORDER BY sga_ecosystem.taxes.account_id ASC;
            ;`;
        }else{
            sentence = `
                SELECT
                    sga_ecosystem.concept_taxes.id,
                    sga_ecosystem.taxes.id AS tax_id,
                    sga_ecosystem.taxes.account_id,
                    sga_ecosystem.taxes.rate,
                    sga_ecosystem.taxes.base,
                    sga_ecosystem.taxes.code,
                    sga_ecosystem.${tableAcc}.name
                FROM
                    sga_ecosystem.concept_taxes
                LEFT JOIN 
                    sga_ecosystem.taxes
                ON
                    sga_ecosystem.concept_taxes.tax_id = sga_ecosystem.taxes.id
                LEFT JOIN
                    sga_ecosystem.${tableAcc}
                ON
                    sga_ecosystem.taxes.account_id = sga_ecosystem.${tableAcc}.id
                WHERE
                    sga_ecosystem.concept_taxes.concept_id = ${info.concept_id}
                ORDER BY sga_ecosystem.${tableAcc}.name ASC ; 
            `
        }
        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



/* ELIMINAR IMPUESTOS*/

controller.deleteTax = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);

        const idTaxesArray = info.taxes.map(() => "?").join(",");

        let sentence = `
                DELETE FROM sga_ecosystem.taxes
                WHERE id IN (${idTaxesArray});
            `;

        let consulta = await useDataBase(sentence,[
            info.taxes
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



controller.createConcept = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO
                sga_ecosystem.concepts
                (
                    company_id,
                    name,
                    account_id,
                    payment_method
                )
            VALUES (?,?,?,?);
        `;
        let newConcept = await useDataBase(sentence,[
            info.company_id,
            info.name,
            info.account_id,
            info.payment_method
        ],4);
        if(newConcept){
            let sen2 = `
                INSERT INTO
                    sga_ecosystem.concept_taxes
                    (
                        concept_id,
                        tax_id
                    )
                VALUES
                    ${info.selectedTaxes.map((element) => 
                        `(${newConcept},${element.value})`
                    ).join(',')}
            ;`;
            let consulta = await useDataBase(sen2,[],2);
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta));
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([false,`Error al crear nuevo concepto`]));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.getConcepts = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let tableAcc = info.typePlanAccount == 'PUC'? 'account_templates_PUC':'contable_accounts';
        let sentence = `
            SELECT
                sga_ecosystem.concepts.*,
                sga_ecosystem.payment_methods.name AS paymentMethodName,
                sga_ecosystem.${tableAcc}.id AS account_id,
                sga_ecosystem.${tableAcc}.code,
                sga_ecosystem.${tableAcc}.name AS account_name
            FROM
                sga_ecosystem.concepts
            LEFT JOIN
                sga_ecosystem.${tableAcc}
            ON
                sga_ecosystem.concepts.account_id = sga_ecosystem.${tableAcc}.id
            LEFT JOIN
                sga_ecosystem.payment_methods
            ON
                sga_ecosystem.concepts.payment_method = sga_ecosystem.payment_methods.id
            WHERE
                sga_ecosystem.concepts.company_id = ${info.company_id}
                ${info.id != null? `AND sga_ecosystem.concepts.id = ${info.id}`:''}
                ;
        `;
        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


/* ELIMINAR CONCEPTOS*/
controller.deleteConcept = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const idConceptsArray = info.concepts.map(() => "?").join(",");
        let sentence = `
                DELETE FROM sga_ecosystem.concepts
                WHERE id IN (${idConceptsArray});
            `;
        let consulta = await useDataBase(sentence,[
            info.concepts
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}




controller.getPaymentMethods = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                id,
                code,
                name,
                currency,
                state,
                account_id
            FROM
                sga_ecosystem.payment_methods
            WHERE
                company_id = ${info.company_id}
            ORDER BY name ASC;
        `;
        let consulta = await useDataBase(sentence,[],1);;
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.createTransaction = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO
                sga_ecosystem.transactions
                (
                    user_id,
                    company_id,
                    store_id,
                    concept_id,
                    doc_date,
                    doc_type,
                    doc_id,
                    subtotal,
                    total
                )
            VALUES
                (?,?,?,?,?,?,?,?,?);
        `;
        let consulta = await useDataBase(sentence,[
            info.user_id,
            info.company_id,
            info.store_id,
            info.concept_id,
            info.doc_date,
            info.doc_type,
            info.doc_id,
            info.subtotal,
            info.total
        ],6)
        console.log('Transacción Creada correctamente No: ',consulta);
        if(consulta[0]){
            let resultDetails = [];
            for(const element of info.transactionDetails){
                let sentence = `
                    INSERT INTO
                        sga_ecosystem.transaction_detail
                        (
                            transaction_id,
                            account_id,
                            account_type,
                            type,
                            subtotal,
                            total
                        )
                    VALUES
                    (?,?,?,?,?,?)
                `
                let postConsulta = await useDataBase(sentence,[
                    consulta[1],
                    element.account_id,
                    element.account_type,
                    element.type,
                    element.subtotal,
                    element.total
                ],2);
                resultDetails.push([postConsulta]);
            }
            consulta.push(resultDetails)
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

controller.createTransactionDetail = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO
                sga_ecosystem.transaction_detail
                (
                    transaction_id,
                    account_id,
                    account_type,
                    type,
                    subtotal,
                    total
                )
            VALUES
            (?,?,?,?,?,?);
        `
        let consulta = await useDataBase(sentence,[
            info.transaction_id,
            info.account_id,
            info.account_type,
            info.type,
            info.subtotal,
            info.total
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getTransactions = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                sga_ecosystem.transactions.*,
                sga_ecosystem.users.user_name,
                sga_ecosystem.stores.name AS store_name,
                sga_ecosystem.concepts.name AS concept_name,
                'TR' AS docType
            FROM
                sga_ecosystem.transactions
            LEFT JOIN
                sga_ecosystem.users
            ON
                sga_ecosystem.transactions.user_id = sga_ecosystem.users.user_id
            LEFT JOIN
                sga_ecosystem.stores
            ON
                sga_ecosystem.transactions.store_id = sga_ecosystem.stores.id
            LEFT JOIN
                sga_ecosystem.concepts
            ON
                sga_ecosystem.transactions.concept_id = sga_ecosystem.concepts.id
            WHERE
                sga_ecosystem.transactions.company_id = ${info.company_id}
            ORDER BY sga_ecosystem.transactions.created_at DESC;
        `;
        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



/* ELIMINAR TRASACTIONS */

controller.deleteTransaction = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const idTransactionsArray = info.transactions.map(() => "?").join(",");
        let sentence = `
                DELETE FROM sga_ecosystem.transactions
                WHERE id IN (${idTransactionsArray});
            `;
        let consulta = await useDataBase(sentence,[
            info.transactions
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.getTransactionDetails = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let tableAcc = info.typePlanAccount == 'PUC'? 'account_templates_PUC':'contable_accounts';
        let sentence = `
            SELECT
                sga_ecosystem.transaction_detail.*,
                sga_ecosystem.${tableAcc}.name AS concept_name,
                sga_ecosystem.${tableAcc}.code AS account_code,
                sga_ecosystem.payment_methods.name AS payment_name
            FROM
                sga_ecosystem.transaction_detail
            LEFT JOIN
                sga_ecosystem.${tableAcc}
            ON 
                sga_ecosystem.transaction_detail.account_id = sga_ecosystem.${tableAcc}.id
            LEFT JOIN
                sga_ecosystem.payment_methods
            ON 
                sga_ecosystem.${tableAcc}.id = sga_ecosystem.payment_methods.id
            WHERE
                sga_ecosystem.transaction_detail.transaction_id = ? ;
        `;
        let consulta = await useDataBase(sentence,[info.transaction_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.updateTransactionState = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log('Transacción a actualizar: ');
        console.log(info);
        let sentence1 = `
            UPDATE
                sga_ecosystem.transactions
            SET
                status = '${info.status}'
            WHERE
                id = ${info.transaction_id} ;
        `
        let consulta1 = await useDataBase(sentence1,[],2);
        if(consulta1){
            let sentence2 = `
                UPDATE
                    sga_ecosystem.transaction_detail
                SET
                    status = '${info.status}'
                WHERE
                    transaction_id = ${info.transaction_id} ;
            `
            let consulta2 = await useDataBase(sentence2,[],2);
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([consulta1,consulta2]));
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta1));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


// SGA - Inventory (Cambiar de archivo despues)

controller.getSalute = (req,res)=>{
    console.log('Recibido')
    req.on('end',async()=>{
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end('Respuesta del servidor');
    })
}

controller.getCategories = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `SELECT * FROM categories WHERE company_id = ? ;`
        let consulta = await useDataBase(sentence,[info],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



controller.getSuppliers = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        console.log(data);
        let info = data != undefined? JSON.parse(data):''
        let sentence = `SELECT * FROM sga_ecosystem.thirdParties WHERE company_id = ? ;`; 
        let consulta = await useDataBase(sentence,[info],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

/* ELIMINAR PROVEEDORES */
controller.deleteSupplier = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const idSuppliersArray = info.suppliers.map(() => "?").join(",");
        let sentence = `
                DELETE FROM sga_ecosystem.thirdParties
                WHERE id IN (${idSuppliersArray});
            `;
        let consulta = await useDataBase(sentence,[
            info.suppliers
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}




// Ai_asistant Actions

controller.processAiRequest= (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let validatePrompt = await isRelevanPrompt(info.text);
        if(validatePrompt.relevant){
            let newRes = await send_API_AI(info.text,info.userInfo,info.attached)
            validatePrompt.AI_response = newRes;
        }
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end(JSON.stringify(validatePrompt));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



//getDocAnalyticDOcNumber --> Nombre de la funcion

controller.getDocAnalyticDocNumber = async (req, res) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', async () => {
            try {
                const info = JSON.parse(data);
                console.log("Datos recibidos:", info);

                if (!info.doc_type) {
                    return res.status(400).json({ error: "'doc_type' es requerido" });
                }

                const period = (req.query.period || "MONTH").toUpperCase();
                const format = (period === "DAY") ? "%Y-%m-%d" : (period === "YEAR") ? "%Y" : "%Y-%m";

                const tableName = info.doc_type === "TRS"
                    ? `sga_ecosystem.transaction_detail`
                    : `sga_process.${info.doc_type}`;

                const noFilters =
                    !info.dateStart &&
                    !info.dateEnd &&
                    !info.status &&
                    !info.filterValue &&
                    !info.orderBy &&
                    !info.limit;


                if (noFilters) {
                    const sentence = `
                        SELECT
                            DATE_FORMAT(created_at, '${format}') AS label,
                            COUNT(*) AS total
                        FROM ${tableName}
                        GROUP BY DATE_FORMAT(created_at, '${format}')
                        ORDER BY DATE_FORMAT(created_at, '${format}') ASC;
                    `;

                    const consulta = await useDataBase(sentence, [], 1);
                    return res.status(200).json(consulta);
                }

                const whereClauses = [];
                const values = [];

                if (info.dateStart) {
                    whereClauses.push(`created_at >= ?`);
                    values.push(info.dateStart);
                }

                if (info.dateEnd) {
                    whereClauses.push(`created_at <= ?`);
                    values.push(info.dateEnd);
                }

                if (info.status) {
                    whereClauses.push(`status = ?`);
                    values.push(info.status);
                }

                if (info.filterField && info.filterValue) {
                    whereClauses.push(`${info.filterField} LIKE ?`);
                    values.push(`%${info.filterValue}%`);
                }

                const whereQuery = whereClauses.length > 0
                    ? `WHERE ${whereClauses.join(" AND ")}`
                    : "";

                const orderQuery = info.orderBy
                    ? `ORDER BY ${info.orderBy} ${info.orderDirection === "DESC" ? "DESC" : "ASC"}`
                    : `ORDER BY DATE_FORMAT(created_at, '${format}') ASC`;

                const limitQuery = info.limit ? `LIMIT ${parseInt(info.limit)}` : "";

                const sentence = `
                    SELECT
                        DATE_FORMAT(created_at, '${format}') AS label,
                        COUNT(*) AS total
                    FROM ${tableName}
                    ${whereQuery}
                    GROUP BY DATE_FORMAT(created_at, '${format}')
                    ${orderQuery}
                    ${limitQuery};
                `;

                console.log("SQL generado:", sentence, values);

                const consulta = await useDataBase(sentence, values, 1);
                return res.status(200).json(consulta);

            } catch (err) {
                console.error("⚠️ Error:", err);
                res.status(500).json({ error: "Error procesando la solicitud", detail: err.message });
            }
        });

        req.on('error', (err) => {
            console.error("⚠️ Error en la recepción de datos:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Error en la recepción de datos", detail: err.message }));
        });
};


inventoryController.getTransactionsData = async (req, res) => {
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const period = (req.query.period || "MONTH").toUpperCase();
        let format;
        if (period === "DAY") format = "%Y-%m-%d";
        else if (period === "YEAR") format = "%Y";
        else format = "%Y-%m";
        const sentence = `
        SELECT
            DATE_FORMAT(created_at, '${format}') AS label,
            SUM(subtotal) AS total
        FROM sga_ecosystem.transactions
        ${info.doc_type != null ? `
        WHERE
            sga_ecosystem.transactions.doc_type = '${info.doc_type}'
        `:''}
        GROUP BY DATE_FORMAT(created_at, '${format}')
        ORDER BY DATE_FORMAT(created_at, '${format}') ASC;
        `;
        const consulta = await useDataBase(sentence, [], 1);
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
};

controller.getDocAnalyticDocNumberTable = async (req, res) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', async () => {
                let info = JSON.parse(data)
                if (!info.type) {
                    console.warn("⚠️ 'type' no recibido en el cuerpo de la solicitud");
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: "'type' es requerido" }));
                }
                const period = (req.query.period || "MONTH").toUpperCase();
                let format;
                if (period === "DAY") format = "%Y-%m-%d";
                else if (period === "YEAR") format = "%Y";
                else format = "%Y-%m";

                let sentence =` `;

                if(info.doc_type === 'TRS'){
                    sentence = `
                    SELECT
                        *
                    FROM sga_ecosystem.transaction_detail;
                    `;
                }else{
                    const tableName = `sga_process.${info.doc_type}`;
                    sentence = `
                    SELECT
                        *
                    FROM ${tableName};
                    `;
                }

                const consulta = await useDataBase(sentence, [], 1);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(consulta));
        });

        req.on('error', (err) => {
            console.error("⚠️ Error en la recepción de datos:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Error en la recepción de datos", detail: err.message }));
        });
};

export default controller;
