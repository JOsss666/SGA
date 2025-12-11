import { calcWeightedAverage, encrypt, isRelevanPrompt, useDataBase, actualDate } from "../app.js";
import fs from "fs";
import path from "path";
import { uploadToCloudinary } from "../app.js";
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

controller.uploadFile = async (req, res) => {
    console.log("Archivo recibido");
    try {
        const archivos = req.files;

        if (!archivos || archivos.length === 0) {
            return res.status(400).json({ mensaje: "No se enviaron archivos" });
        }

        const urls = [];

        // Subir archivos uno por uno
        for (const archivo of archivos) {
            const resultado = await uploadToCloudinary(archivo.buffer, archivo.originalname);
            urls.push(resultado.secure_url);
        }

        res.json({ urls });

    } catch (e) {
        console.error("Error al subir archivos:", e);
        res.status(500).json({ mensaje: e.message });
    }
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
                "Ecosystem".companies(
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
            VALUES($1,$2,$3,$3,$4,$5,$6,$7,$8,$9);
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
                    "Ecosystem".users.* , "Ecosystem".users_access.* 
                FROM 
                    "Ecosystem".users LEFT JOIN "Ecosystem".users_access
                ON
                    "Ecosystem".users.user_id = "Ecosystem".users_access.user_id 
                WHERE
                    "Ecosystem".users.user_key = $1 ;`
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

controller.getUsers = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                "Ecosystem".users.*,
                "Ecosystem".users_access.*
            FROM
                "Ecosystem".users
            LEFT JOIN
                "Ecosystem".users_access
            ON
                "Ecosystem".users.user_id = "Ecosystem".users_access.user_id
            WHERE
                "Ecosystem".users.company_id = $1
            ORDER BY "Ecosystem".users.user_name ASC;  
        `;
        let consulta = await useDataBase(sentence,[info.company_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
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
                "Ecosystem".companies.*,
                "Ecosystem".account_plans.id AS "accountPlanId",
                "Ecosystem".account_plans.type AS "accountPlanType"
            FROM
                "Ecosystem".companies 
            LEFT JOIN
                "Ecosystem".account_plans
            ON
                "Ecosystem".companies.company_id = "Ecosystem".account_plans.company_id
            WHERE "Ecosystem".companies.company_key = $1 ;`
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
                "Ecosystem".account_plans
            (
                company_id,
                name,
                type
            )
            VALUES($1,$2,$3);
        `;
    let consulta = await useDataBase(sentence,[
        info.company_id,
        info.name,
        info.typePLan
    ],2);
    res.writeHead(200,{'Content-Type':'text/plain'})
    res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.createCostCenter = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO "Ecosystem"."costCenters"(
                company_id,name,description,code,parent_id 
            ) VALUES ($1,$2,$3,$4,$5);
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.name,
            info.description,
            info.code,
            info.parent_id
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getCostCenters = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT * FROM 
                "Ecosystem"."costCenters"
            WHERE
                company_id = $1
        `
        let consulta = await useDataBase(sentence,[
            info.company_id
        ],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.createStore = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO "Ecosystem".stores(
                company_id, name, zone, city, address)
            VALUES ($1, $2, $3, $4, $5);
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.name,
            info.zone,
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

controller.deleteStore = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            DELETE FROM "Ecosystem".stores WHERE company_id = $1 AND  id =$2 ;
        `
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.store_id
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getStores = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk; 
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        whereClauses.push(`company_id = $${values.length + 1}`);
        values.push(info.company_id)

        if(info.id != null){
            whereClauses.push(`id = $${values.length + 1}`)
            values.push(info.id)
        }

        
        const whereQuery = whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

        let sentence = `
            SELECT * FROM
                "Ecosystem".stores
            ${whereQuery}
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

controller.logIn = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                "Ecosystem".users.*,
                "Ecosystem".companies.company_key
            FROM    
                "Ecosystem".users
            LEFT JOIN
                "Ecosystem".companies
            ON
                "Ecosystem".users.company_id = "Ecosystem".companies.company_id
            WHERE
                user_mail = $1
                AND user_password = $2
            LIMIT 1;
        `
        let consulta = await useDataBase(sentence,[info.mail,encrypt(info.pass)],1);
        if(consulta[0]){
            let postSen = `
                UPDATE "Ecosystem".users_access
                SET user_session = true
                WHERE user_id = $1
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
        UPDATE "Ecosystem".users_access
        SET user_session = false
        WHERE user_id = $1
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
                "Ecosystem".users(
                    company_id,
                    user_name,
                    user_mail,
                    user_password,
                    user_key
                )
            VALUES($1,$2,$3,$4,$5) RETURNING user_id;
        `;
        let newUserKey = encrypt(`${info.name.slice(1,info.name.length -1)}${info.mail.split('@')[0]}|SGA_ab26212caa96090eacaebbf1**_${info.pass}${actualDate.toISOString()}`);
        let consulta = await useDataBase(sentence,[info.company_id,info.name,info.mail,encrypt(info.pass),newUserKey],3);
        let insert_id = parseInt(consulta)
        if(typeof(insert_id) == 'number'){
            let posSen = `
                INSERT INTO 
                    "Ecosystem".users_access 
                        (user_id,
                        user_roll,
                        sga_inventory_access,
                        sga_process_access,
                        sga_contability_access,
                        sga_certicloud_access,
                        sga_facturation_access,
                        sga_treasury_access,
                        sga_ctools_access
                        )
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9);
            `;
            let posCon = await useDataBase(posSen, [
                consulta.user_id,               
                info.userRol,             
                info.accessInventory,     
                info.accessProcess,       
                info.accessContability,   
                info.accessFacturation,   
                info.accessTreasury,      
                info.accessCerticloud,    
                info.accessCtools         
            ], 2);
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

controller.deleteUser = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            DELETE FROM "Ecosystem".users
            WHERE
                user_id = $1 AND company_id = $2 ;
        `
        let consulta = await useDataBase(sentence,[
            info.user_id,info.company_id
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
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
        let sentence = `
            INSERT INTO
                "Ecosystem".contable_accounts
            (   
                account_plan,
                company_id,
                code,
                name,
                level,
                type,
                type_account
            )VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id;
        `; 
        let consulta = await useDataBase(sentence,[
            info.accountPlanId,
            info.company_id,
            info.code,
            info.name,
            (info.code).length,
            info.type,
            info.accountPlanType
        ],3);
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
                "Ecosystem".account_plans
            WHERE
                "Ecosystem".account_plans.company_id = $1 OR "Ecosystem".account_plans.company_id = 1 ;
        ` 
        let prevCons = await useDataBase(prevSen,[info.company_id],1);
        if(prevCons[0]){
            let sentence = `
                SELECT * FROM
                    "Ecosystem".contable_accounts
                WHERE company_id = $1
                    AND account_plan = $2
                    AND type_account = $3
                ORDER BY code ASC;  
            `;
            let consulta = await useDataBase(sentence,[
                info.company_id,
                info.accountPlanId,
                info.accountPlanType
            ],1);
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
                "Ecosystem".taxes(
                    company_id,
                    account_id,
                    code,
                    rate,
                    base
                )
            VALUES($1,$2,$3,$4,$5);
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

controller.getTaxes = (req, res) => {
    let data = '';
    req.on('data', chunk => data += chunk);

    req.on('end', async () => {
        try {
            const info = JSON.parse(data);
            let values = [];
            let where = []; // array de condiciones dinámicas

            let sentence = `
                SELECT
                    "Ecosystem".taxes.id AS tax_id,
                    "Ecosystem".taxes.code,
                    "Ecosystem".taxes.rate,
                    "Ecosystem".taxes.base,
                    "Ecosystem".contable_accounts.*
                FROM
                    "Ecosystem".taxes
                LEFT JOIN "Ecosystem".contable_accounts
                ON "Ecosystem".taxes.account_id = "Ecosystem".contable_accounts.id
                WHERE
            `;

            //  Filtro obligatorio
            values.push(info.company_id);
            where.push(`"Ecosystem".taxes.company_id = $${values.length}`);

            //  Filtro opcional: ID
            if (info.id != null) {
                values.push(info.id);
                where.push(`"Ecosystem".taxes.id = $${values.length}`);
            }

            // Combinar WHERE dinámico
            sentence += where.join(' AND ');
            
            if (info.limit != null) {
                values.push(info.limit);
                sentence += ` LIMIT $${values.length}`;
            }

            sentence += ` ORDER BY "Ecosystem".taxes.account_id ASC;`;

            const consulta = await useDataBase(sentence, values, 1);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(consulta));

        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(err));
        }
    });
};



/* ELIMINAR IMPUESTOS*/

controller.deleteTax = (req, res) => {
    let data = '';
    req.on('data', chunk => { data += chunk });

    req.on('end', async () => {
        try {
            const info = JSON.parse(data);

            const placeholders = info.taxes.map((_, i) => `$${i + 1}`).join(",");

            const sentence = `
                DELETE FROM "Ecosystem".taxes
                WHERE id IN (${placeholders});
            `;

            const consulta = await useDataBase(sentence, info.taxes, 2);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(consulta));

        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(err));
        }
    });
};

controller.createConcept = (req, res) => {
    let data = '';
    req.on('data', chunk => { data += chunk });

    req.on('end', async () => {
        try {
            const info = JSON.parse(data);

            // Crear el concepto
            const insertConceptSQL = `
                INSERT INTO "Ecosystem".concepts
                (
                    company_id,
                    name,
                    account_id
                )
                VALUES ($1, $2, $3)
                RETURNING id;
            `;

            const newConcept = await useDataBase(
                insertConceptSQL,
                [
                    info.company_id,
                    info.name,
                    info.account_id,
                ],3);

            if (typeof newConcept !== "number") {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify([false, "Error al crear concepto"]));
            }

            // Insertar impuestos relacionados
            const taxes = info.selectedTaxes; // array de objetos {value: tax_id}

            if (!taxes || taxes.length === 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(true));
            }

            const values = [];
            const rows = taxes
                .map((t, i) => {
                    const p1 = `$${i * 2 + 1}`;
                    const p2 = `$${i * 2 + 2}`;
                    values.push(newConcept, t.value);
                    return `(${p1}, ${p2})`;
                })
                .join(",");

            const insertTaxesSQL = `
                INSERT INTO "Ecosystem".concept_taxes
                (concept_id, tax_id)
                VALUES ${rows};
            `;

            const insertTaxes = await useDataBase(insertTaxesSQL, values, 2);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(insertTaxes));

        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(err));
        }
    });
};


controller.getConcepts = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = []
        let whereClauses = []

        whereClauses.push('"Ecosystem".concepts.company_id = $1');
        values.push(info.company_id)

        if(info.id != null){
            whereClauses.push(`"Ecosystem".concepts.id = $${values.length + 1}`)
            values.push(info.id)
        }

        const whereQuery = whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

        let sentence = `
            SELECT
                "Ecosystem".concepts.*,
                "Ecosystem".contable_accounts.id AS account_id,
                "Ecosystem".contable_accounts.code,
                "Ecosystem".contable_accounts.name AS account_name
            FROM
                "Ecosystem".concepts
            LEFT JOIN
                "Ecosystem".contable_accounts
            ON
                "Ecosystem".concepts.account_id = "Ecosystem".contable_accounts.id
            ${whereQuery}
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

/* ELIMINAR CONCEPTOS*/
controller.deleteConcept = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const placeholders = info.concepts.map((_, i) => `$${i + 1}`).join(",");

        let sentence = `
                DELETE FROM "Ecosystem".concepts
                WHERE id IN (${placeholders});
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
                status,
                account_id
            FROM
                "Ecosystem".payment_methods
            WHERE
                company_id = $1
            ORDER BY name ASC;
        `;
        let consulta = await useDataBase(sentence,[info.company_id],1);;
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
                "Ecosystem".transactions
                (
                    user_id,
                    company_id,
                    store_id,
                    concept_id,
                    doc_date,
                    doc_type,
                    doc_id,
                    "subTotal",
                    total,
                    "costCenter_id"
                )
            VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id;
        `;
        let consulta = await useDataBase(sentence,[
            info.user_id,
            info.company_id,
            info.store_id,
            info.concept_id,
            info.doc_date.replace(/\//g, '-'),
            info.doc_type,
            info.doc_id,
            info.subTotal,
            info.total,
            info.costCenter_id
        ],3)
        console.log('Transacción Creada correctamente No: ',consulta);
        if(typeof(parseInt(consulta.id)) == 'number'){
            let resultDetails = [];
            for(const element of info.transactionDetails){
                let sentence = `
                    INSERT INTO "Ecosystem".transaction_detail(
                        company_id,
                        transaction_id,
                        "thirdParty_id",
                        account_id,
                        type,
                        "subTotal",
                        total,
                        nature
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
                `
                console.log('---> ',info);
                console.log('---> ',element);
                let postConsulta = await useDataBase(sentence,[
                    info.company_id,
                    parseInt(consulta.id),
                    info.thirdParty_id,
                    element.account_id,
                    element.type,
                    element.subtotal,
                    element.total,
                    element.nature
                ],2);
                resultDetails.push([postConsulta]);
            }
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([consulta.id,resultDetails]));
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
                "Ecosystem".transaction_detail
                (
                    transaction_id,
                    account_id,
                    account_type,
                    type,
                    subtotal,
                    total
                )
            VALUES
            ($1,$2,$3,$4,$5,$6);
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
                "Ecosystem".transactions.*,
                "Ecosystem".users.user_name,
                "Ecosystem".stores.name AS store_name,
                "Ecosystem".concepts.name AS concept_name,
                'TR' AS docType
            FROM
                "Ecosystem".transactions
            LEFT JOIN
                "Ecosystem".users
            ON
                "Ecosystem".transactions.user_id = "Ecosystem".users.user_id
            LEFT JOIN
                "Ecosystem".stores
            ON
                "Ecosystem".transactions.store_id = "Ecosystem".stores.id
            LEFT JOIN
                "Ecosystem".concepts
            ON
                "Ecosystem".transactions.concept_id = "Ecosystem".concepts.id
            WHERE
                "Ecosystem".transactions.company_id = $1
            ORDER BY "Ecosystem".transactions.created_at DESC;
        `;
        let consulta = await useDataBase(sentence,[info.company_id],1);
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
        const placeholders = info.transactions.map((_, i) => `$${i + 1}`).join(",");
        let sentence = `
                DELETE FROM "Ecosystem".transactions
                WHERE id IN (${placeholders});
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
        let sentence = `
            SELECT
                "Ecosystem".transaction_detail.*,
                "Ecosystem".contable_accounts.name AS concept_name,
                "Ecosystem".contable_accounts.code AS account_code,
                "Ecosystem".payment_methods.name AS payment_name
            FROM
                "Ecosystem".transaction_detail
            LEFT JOIN
                "Ecosystem".contable_accounts
            ON 
                "Ecosystem".transaction_detail.account_id = "Ecosystem".contable_accounts.id
            LEFT JOIN
                "Ecosystem".payment_methods
            ON 
                "Ecosystem".contable_accounts.id = "Ecosystem".payment_methods.id
            WHERE
                "Ecosystem".transaction_detail.transaction_id = $1 ;
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
                "Ecosystem".transactions
            SET
                status = $1
            WHERE
                id = $2 ;
        `
        let consulta1 = await useDataBase(sentence1,[info.status,info.transaction_id],2);
        if(consulta1){
            let sentence2 = `
                UPDATE
                    "Ecosystem".transaction_detail
                SET
                    status = $1
                WHERE
                    transaction_id = $2 ;
            `
            let consulta2 = await useDataBase(sentence2,[info.status,info.transaction_id],2);
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


controller.getThirdParties = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        console.log(data);
        let info = data != undefined? JSON.parse(data):'';
        let sentence = `SELECT * FROM "Ecosystem".thirdParties WHERE company_id = $1 ;`; 
        let consulta = await useDataBase(sentence,[info.company_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getThirdPartyDetails = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                "Ecosystem".thirdParties.*
            FROM
                "Ecosystem".thirdParties
            WHERE
                company_id = $1
                AND id = $2 ;
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.id
        ],1)
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


// Crear Nuevo Tercero

controller.createThirdParty = (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', async () => {
        try {
            const info = JSON.parse(data);
            console.log(info);
            const sentence = `
                INSERT INTO "Ecosystem".thirdparties(
                    company_id, names, "lastNames", indentification_type, indentification_number, mail, phone, country, city, address, type)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id;
            `;

            const values = [
                info.company_id,
                info.name,
                info.lastNames,
                info.indentification_type,
                info.indentification_number,
                info.mail,
                info.phone,
                info.country,
                info.city,
                info.address,
                info.type
            ];
            const result = await useDataBase(sentence, values, 3);
            let idNewThirdParty = parseInt(result);
            console.log(idNewThirdParty);
            if(typeof(parseInt(result))== 'number'){
                let comercialInfoSen = `
                    INSERT INTO "Ecosystem"."thirdPartyComercialInfo"(
                        "thirdParty_id", company_id, credit, credit_term, credit_value, interest_rate, comercial_state)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                ` 
                let comercialInfoCons = await useDataBase(comercialInfoSen,[
                    idNewThirdParty,
                    info.company_id,
                    info.credit,
                    info.credit_term,
                    info.credit_value,
                    info.interest_rate,
                    info.comercial_state
                ],2);
                let taxInfo = `
                    INSERT INTO "Ecosystem"."thirdPartyTaxInfo"(
                        "thirdParty_id", company_id, regime, "IVA_responsability", retention_type, economic_activity, "attachedRut")
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `;
                let taxInfoCons = await useDataBase(taxInfo,[
                    idNewThirdParty,
                    info.company_id,
                    info.regime,
                    info.IVA_responsability,
                    info.retention_type,
                    info.economic_activity,
                    info.attachedRut != undefined? info.attachedRut:''
                ],2);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(comercialInfoCons && taxInfoCons));
            }else{
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(false));
            }
        } catch (err) {
            console.error('Error en createThirdParty:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([false, err.message || err]));
        }
    });

    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
};


// Eliminar Terceros

controller.deleteThirdParty = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const placeholders = info.suppliers.map((_, i) => `$${i + 1}`).join(",");
        let sentence = `
                DELETE FROM "Ecosystem".thirdParties
                WHERE id IN (${placeholders});
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


controller.getDocAnalyticDocNumber = async (req, res) => {
    let data = '';
    req.on('data', chunk => data += chunk);

    req.on('end', async () => {
        try {
            const info = JSON.parse(data);

            if (!info.doc_type) {
                return res.status(400).json({ error: "'doc_type' es requerido" });
            }

            // Periodo: DAY, MONTH, YEAR
            const rawPeriod = info.period || req.query.period || "MONTH";
            const period = rawPeriod.toUpperCase();

            const truncUnit =
                period === "DAY" ? "day" :
                period === "YEAR" ? "year" :
                "month"; // default

            const labelFormat =
                period === "DAY" ? 'YYYY-MM-DD' :
                period === "YEAR" ? 'YYYY' :
                'YYYY-MM';

            console.log(`🕒 Agrupando por: ${period}`);

            const tableName = `"Ecosystem".documents`;

            const noFilters =
                !info.dateStart &&
                !info.dateEnd &&
                !info.status &&
                !info.filterValue &&
                !info.orderBy &&
                !info.limit;

            // 1️⃣ SIN FILTROS
            if (noFilters) {
                const sentence = `
                    SELECT
                        TO_CHAR(DATE_TRUNC('${truncUnit}', created_at), '${labelFormat}') AS label,
                        COUNT(*) AS total
                    FROM ${tableName}
                    WHERE document_type = $1
                    GROUP BY DATE_TRUNC('${truncUnit}', created_at)
                    ORDER BY DATE_TRUNC('${truncUnit}', created_at) ASC;
                `;

                const consulta = await useDataBase(sentence, [info.doc_type], 1);
                return res.status(200).json(consulta);
            }

            // 2️⃣ CON FILTROS
            const whereClauses = [`doc_type = $1`];
            const values = [info.doc_type];
            let paramIndex = 2;

            if (info.dateStart) {
                whereClauses.push(`created_at >= $${paramIndex++}`);
                values.push(info.dateStart);
            }

            if (info.dateEnd) {
                whereClauses.push(`created_at <= $${paramIndex++}`);
                values.push(info.dateEnd);
            }

            if (info.status) {
                whereClauses.push(`status = $${paramIndex++}`);
                values.push(info.status);
            }

            if (info.filterField && info.filterValue) {
                whereClauses.push(`${info.filterField} LIKE $${paramIndex++}`);
                values.push(`%${info.filterValue}%`);
            }

            const whereQuery = `WHERE ${whereClauses.join(" AND ")}`;

            const orderQuery = info.orderBy
                ? `ORDER BY ${info.orderBy} ${info.orderDirection === "DESC" ? "DESC" : "ASC"}`
                : `ORDER BY DATE_TRUNC('${truncUnit}', created_at) ASC`;

            const limitQuery = info.limit ? `LIMIT ${parseInt(info.limit)}` : "";

            const sentence = `
                SELECT
                    TO_CHAR(DATE_TRUNC('${truncUnit}', created_at), '${labelFormat}') AS label,
                    COUNT(*) AS total
                FROM ${tableName}
                ${whereQuery}
                GROUP BY DATE_TRUNC('${truncUnit}', created_at)
                ${orderQuery}
                ${limitQuery};
            `;

            console.log("🧩 SQL generado:", sentence, values);

            const consulta = await useDataBase(sentence, values, 1);
            return res.status(200).json(consulta);

        } catch (err) {
            console.error("⚠️ Error:", err);
            res.status(500).json({ error: "Error procesando la solicitud", detail: err.message });
        }
    });
};



controller.getTransactionsData = async (req, res) => {
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
        let values = [];
        let whereClauses = [];
        if(info.doc_type != null){
            whereClauses.push('"Ecosystem".transactions.doc_type = $1');
            values.push(info.doc_type);
        }
        const whereQuery = whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

        const sentence = `
        SELECT
            TO_CHAR(created_at, 'YYYY-MM') AS label,
            SUM("total") AS total
        FROM "Ecosystem".transactions
        ${whereQuery}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY TO_CHAR(created_at, 'YYYY-MM') ASC;

        `;
        const consulta = await useDataBase(sentence, values, 1);
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

                const tableName = info.doc_type === 'TRS'
                    ? '"Ecosystem".transaction_detail'
                    : `"Ecosystem".documents.${info.doc_type}`;

                const sentence = `
                    SELECT 
                        DATE_FORMAT(created_at, '${format}') AS period,
                        COUNT(*) AS total_docs
                    FROM ${tableName}
                    ${info.doc_type != 'TRS'? `
                    WHERE
                        doc_type = $1;
                        `:''}
                    GROUP BY DATE_FORMAT(created_at, '${format}')
                    ORDER BY period;
                `;

                const consulta = await useDataBase(sentence, [info.doc_type], 1);
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
