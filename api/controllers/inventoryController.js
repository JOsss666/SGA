import { useDataBase } from "../app.js";
const inventoryController = {};

inventoryController.getSubCategories = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        let sentence = `SELECT * FROM "Inventory".categories WHERE company_id = ? ORDER BY category_code ASC ;`;
        let consulta = await useDataBase(sentence,[info],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


inventoryController.createCatetory = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        let sentence = `
            INSERT INTO "Inventory".categories(
                company_id, name, slug, parent_id, path, description, status, img)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.name,
            info.slug,
            info.parent_id != ''? info.parent_id:0,
            info.path,
            info.description,
            info.status,
            info.photo
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



inventoryController.getProducts = (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', async () => {
        const info = JSON.parse(data);
        const values = [];
        let whereClauses = [];

        whereClauses.push(`ps.company_id = $1`);
        values.push(info.company_id)

        if (info.category_id != null) {
            whereClauses.push(`AND c.id = $${values.length +1}`);
            values.push(info.category_id);
        }
        
        if(info.type != undefined){
            whereClauses.push(`ps.type = $${values.length +1}`)
            values.push(info.type)
        }

        const whereQuery = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

        const sentence = `
            SELECT
                ps.*,
                ac.name AS tax_name,
                t.base AS tax_base,
                t.rate AS tax_rate,
                c_exit.account_id AS exit_account,
                c_entry.account_id AS entry_account,
                array_remove(array_agg(c.name), NULL) AS categories
            FROM
                "Inventory"."products&services" AS ps
            LEFT JOIN 
                "Ecosystem".taxes AS t
                ON ps.tax_id = t.id
            LEFT JOIN 
                "Ecosystem".contable_accounts AS ac
                ON t.account_id = ac.id
            LEFT JOIN
                "Inventory".product_categories AS pc
                ON pc.product_id = ps.id
            LEFT JOIN
                "Inventory".categories AS c
                ON pc.category_id = c.id
            LEFT JOIN 
                "Ecosystem".concepts AS c_exit
            ON 
                ps.exit_concept = c_exit.id
            LEFT JOIN 
                "Ecosystem".concepts AS c_entry
            ON 
                ps.entry_concept = c_entry.id
            ${whereQuery}
            GROUP BY
                ps.id,
                c_entry.account_id,
                ac.name,
                t.base,
                t.rate,
                c_exit.account_id
            ORDER BY
                ps.order_index ASC, ps.name ASC
        `;

        const consulta = await useDataBase(sentence, values, 1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(consulta));
    });
};


inventoryController.createProduct = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log(info)
        let sentence = `
            INSERT INTO
                "Inventory"."products&services"(
                    company_id,
                    code,
                    name,
                    stock,
                    units,
                    entry_concept,
                    exit_concept,
                    taxed,
                    tax_id,
                    img,
                    type,
                    description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id ;`
        let consulta = await useDataBase(sentence,[
                    info.company_id,
                    info.code,
                    info.name,
                    info.stock,
                    info.units,
                    info.purchaseConcept,
                    info.sellConcept,
                    info.taxed,
                    info.tax_id,
                    info.photo,
                    info.type_product,
                    info.description],3);
        console.log('---> ',consulta);
        let insert_id = parseInt(consulta.id);
        console.log('---> ',insert_id);
        if(typeof(parseInt(consulta.id)) == 'number' && info.category_id != null){
            let postSen = `
                INSERT INTO "Inventory".product_categories(
                    company_id, product_id, category_id)
                VALUES ($1, $2, $3);
            `
            let postCons = await useDataBase(postSen,[
                info.company_id,
                insert_id,
                info.category_id
            ],2);
            res.writeHead(200,{'Content-Type':'text/plain'})
            if(postCons[0]){
                res.end(JSON.stringify(true));
            }else{
                res.end(JSON.stringify(false));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            if(parseInt(consulta.id) == 'number'){
                res.end(JSON.stringify(true));
            }else{
                res.end(JSON.stringify(false));
            }
        }
        
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


inventoryController.getPricesNameList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        console.log(data);
        let info = JSON.parse(data);
        let sentence = ``;
        if(info.limit != undefined){
            sentence = `SELECT * FROM "Inventory".pricesList WHERE company_id = ? LIMIT 3;`
        }else{
            sentence = `SELECT * FROM "Inventory".pricesList WHERE company_id = ? ; `
        }
        let consulta = await useDataBase(sentence,[info.company_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


inventoryController.createCellar = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT into "Inventory".cellars(
                company_id,
                store_id,
                name,
                address
            ) VALUES($1,$2,$3,$4);`
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.store_id,
            info.name,
            info.address],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

inventoryController.getCellars = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];
        console.log(info)
        whereClauses.push(`company_id = $${values.length +1}`)
        values.push(info.company_id)
        const storeIdParsed = Number(info.store_id);

        if(Number.isInteger(storeIdParsed)) {
            whereClauses.push(`store_id = $${values.length + 1}`);
            values.push(storeIdParsed);
        }
        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";


        let sentence = `
            SELECT * FROM 
                "Inventory".cellars
            ${whereQuery} ;
            `;
        
        let consulta = await useDataBase(sentence,values,1)
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

inventoryController.createPriceList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `INSERT INTO "Inventory".pricesList(company_id,store_id,list_name, list_state, list_description) VALUES(?,?,?,?,?);`
        let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.list_name,'Pendiente',info.list_description],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


inventoryController.getPricesList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `SELECT pricesList.*, sga_ecosystem.stores.id,sga_ecosystem.stores.name FROM sga_process.pricesList LEFT JOIN sga_ecosystem.stores ON sga_ecosystem.pricesList.store_id = sga_ecosystem.stores.id WHERE sga_process.pricesList.company_id = ? `
        if(info.store_id != undefined){
            sentence += `AND store_id = ? `
        }
        sentence += `ORDER BY pricesList.created_at DESC `
        if(info.limit != undefined){
            sentence += `LIMIT ${info.limit} ;`
        }
        let consulta = await useDataBase(sentence,[info.company_id,info.store_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

/* ELEMINAR LISTA DE PRECIOS */
inventoryController.deletePriceList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const idListsArray = info.lists.map(() => "?").join(",");
        let sentence = `
                DELETE FROM "Inventory".pricesList
                WHERE id IN (${idListsArray});
            `;
        let consulta = await useDataBase(sentence,[
            info.lists
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



inventoryController.updateProductList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        console.log(info)
        if(info.price_id == undefined){
            let sentence = `INSERT INTO "Inventory".prices"products&services" (company_id,store_id,list_id,product_id,unit_value,price_state) VALUES (?,?,?,?,?,?); `
            let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.list_id,info.product_id,info.unit_value,"active"],4);
            let postSen = `UPDATE stocks SET list_id = ? WHERE stock_id = ? ;`
            let postCon = await useDataBase(postSen,[consulta.insertId,info.stock_id],2);
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta));
        }else{
            let sentence = `UPDATE pricesproducts&services SET list_id = ?, unit_value = ?, price_state = ?  WHERE price_id = ? ;`
            let consulta = await useDataBase(sentence,[info.list_id,info.unit_value,'active',info.price_id],2);
            let postSen = `UPDATE stocks SET list_id = ? WHERE stock_id = ? ;`
            let postCon = await useDataBase(postSen,[info.list_id,info.stock_id],2);
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta));
        }
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


inventoryController.getPriceStock = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        console.log(info);
        let sentence = `SELECT products&services.*, stocks.* FROM "Inventory".stocks LEFT JOIN products&services ON products&services.product_id = stocks.product_id WHERE stocks.product_id = ? AND stocks.list_id = ? ;`;
        let consulta = await useDataBase(sentence,[info.product_id,info.list_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

inventoryController.newEntry = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        console.log(info);
        if(typeof info.cost == "string"){
            info.cost = JSON.parse(info.cost);
        }
        if(typeof info.units == "string"){
            info.units = JSON.parse(info.units);
        }
        let s1 = `INSERT INTO "Inventory".entries (company_id,store_id,cellar_id,section_id,user_id,product_id,supplier_id,units,entry_value,unit_value,entry_status)VALUES(?,?,?,?,?,?,?,?,?,?,?);`;
        let preConsul = await useDataBase(s1,[info.company_id,info.store_id,info.cellar_id,info.section_id,info.user_id,info.product_id,info.supplier_id,info.units,info.cost,(info.cost/info.units),info.entry_status],4);
        if(preConsul){
            let PrevSen = `
                SELECT 
                    pricesproducts&services.list_id, 
                    pricesproducts&services.price_id, 
                    pricesproducts&services.product_id, 
                    pricesproducts&services.total_cost, 
                    stocks.stock_id, 
                    stocks.stock 
                FROM "Inventory".pricesproducts&services 
                LEFT  JOIN stocks 
                    ON pricesproducts&services.list_id = stocks.list_id 
                    AND pricesproducts&services.product_id = stocks.product_id 
                    AND pricesproducts&services.company_id = stocks.company_id 
                    AND pricesproducts&services.store_id = stocks.store_id 
                WHERE pricesproducts&services.price_state = 'active' 
                    AND pricesproducts&services.company_id = ? 
                    AND pricesproducts&services.store_id = ? 
                    AND pricesproducts&services.product_id = ?;
                `;

            let prevCons = await useDataBase(PrevSen,[info.store_id,info.company_id,info.product_id],1);
            console.log(prevCons)
            if(prevCons[0]){
                let s1 = `UPDATE pricesproducts&services SET total_cost = ? , unit_cost = ?  WHERE price_id = ? ;`
                let values = calcWeightedAverage(prevCons[1][0].total_cost,prevCons[1][0].stock,info.cost,info.units);
                console.log(values);
                let conS1 = await useDataBase(s1,[values[1],values[2],prevCons[1][0].price_id],2);
                if(prevCons[1][0].stock_id != undefined){
                    let sentence = `UPDATE stocks SET stock = ?, list_id = ?  WHERE stock_id = ? OR company_id = ? and store_id = ? and product_id = ? ;`;
                    let consulta = await useDataBase(sentence,[values[0],prevCons[1][0].list_id,prevCons[1][0].stock_id,info.company_id,info.store_id,info.product_id],2);
                    res.writeHead(200,{'Content-Type':'text/plain'})
                    res.end(JSON.stringify([consulta,preConsul]));
                }else{
                    let sentence = `INSERT INTO "Inventory".stocks (company_id,store_id,list_id,product_id,cellar_id,stock) VALUES(?,?,?,?,?,?);`;
                    let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.list_id,info.product_id,info.cellar_id,info.units],2);
                    res.writeHead(200,{'Content-Type':'text/plain'});
                    res.end(JSON.stringify([consulta,preConsul]));
                }
            }else{
                let s1 = `INSERT INTO "Inventory".pricesproducts&services (company_id,store_id,list_id,product_id,total_cost,unit_cost,price_state) VALUES (?,?,?,?,?,?,?);`;
                let conS1 = await useDataBase(s1,[info.company_id,info.store_id,0,info.product_id,info.cost,(info.cost/info.units),"active"],2)
                let sentence = `INSERT INTO "Inventory".stocks (company_id,store_id,list_id,product_id,cellar_id,stock) VALUES(?,?,?,?,?,?);`;
                let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.list_id,info.product_id,info.cellar_id,info.units],2);
                res.writeHead(200,{'Content-Type':'text/plain'});
                res.end(JSON.stringify([consulta,preConsul]));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify([false,[]]));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



inventoryController.newDeparture = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log(info);
        let s1 = `INSERT INTO "Inventory".departures (company_id,store_id,cellar_id,section_id,user_id,product_id,departure_units,departure_value,departure_status,client_id) VALUES (?,?,?,?,?,?,?,?,?,?);`
        let prevIn = await useDataBase(s1,[info.company_id,info.store_id,info.cellar_id,info.section_id,info.user_id,info.product_id,info.units,(info.units * info.departure_value),info.departure_status,0],4);
        if(prevIn){
            let s2 = `SELECT pricesproducts&services.* , stocks.stock FROM "Inventory".pricesproducts&services LEFT JOIN stocks ON pricesproducts&services.list_id = stocks.list_id AND pricesproducts&services.product_id = stocks.product_id WHERE pricesproducts&services.list_id = ? AND stocks.stock_id = ? ;`
            let prevC = await useDataBase(s2,[info.list_id,info.stock_id],1);
            console.log(prevC);
            if(prevC[0]){
                let s1 = `UPDATE pricesproducts&services SET total_cost = ?, unit_cost = ? WHERE price_id = ? ; `
                let newStock = prevC[1][0].stock - info.units;
                let newCostProduct = prevC[1][0].total_cost - (info.units * prevC[1][0].unit_cost);
                let cs1 = await useDataBase(s1,[newCostProduct,(newCostProduct/newStock).toFixed(0),prevC[1][0].list_id],2);
                let sentence = `UPDATE stocks SET stock = ?  WHERE stock_id = ? ; `
                let consulta = await useDataBase(sentence,[newStock,info.stock_id],2);
                res.writeHead(200,{'Content-Type':'text/plain'});
                res.end(JSON.stringify([consulta,prevIn]));
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(false,[]));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(false,[]));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

// Handlers y funciones para movimientos de inventario

async function createMainDocument(info){
    let senMainDoc = `
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
            attached)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id;
    `;
    let valuesMainDoc = [
        info.company_id,
        info.store_id,
        info.thirdParty_id,
        info.movement_type,
        info.status,
        info.totalProducts,
        info.totalProducts,
        info.created_by,
        info.description,
        info.attached_document
    ];
    let createMainDoc = await useDataBase(senMainDoc,valuesMainDoc,3);
    let idMainDoc = parseInt(createMainDoc.id);
    return idMainDoc;
}

async function insertMovement(info,element,idMainDoc){
    console.log("Información movimientos ---> ",info)
    let sentence = `
        INSERT INTO
            "Inventory"."inventoryMovements"(
                company_id,
                "thirdParty_id",
                store_id,
                cellar_id,
                "product&service_id",
                movement_type,
                units,
                value,
                movement_group_id,
                attached_document,
                status,
                description, 
                created_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);
        `;
    let consulta = await useDataBase(sentence,[
                info.company_id,
                info.thirdParty_id,
                info.store_id,
                info.cellar_id,
                element.id,
                info.movement_type,
                info.movement_type == 'Inventory Entry'? (element.movementsUnits):(element.movementsUnits * -1),
                element.unit_cost != undefined ? element.unit_cost:element.avg_cost,
                idMainDoc,
                info.attached_document,
                info.status,
                info.description,
                info.created_by,],2);
    return consulta;
}

async function updateStocks(info,element){
    let sentence = `
        INSERT INTO "Inventory".stocks(
            company_id,
            store_id,
            cellar_id,
            product_id,
            stock,
            min_stock,
            max_stock,
            avg_cost)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (company_id, store_id, cellar_id, product_id)
        DO UPDATE SET
            avg_cost = (
            ("Inventory"."stocks".stock * "Inventory"."stocks".avg_cost)
            + (EXCLUDED.stock * EXCLUDED.avg_cost)
        ) / ("Inventory"."stocks".stock + EXCLUDED.stock),
        stock = "Inventory"."stocks".stock + EXCLUDED.stock, 
        updated_at = NOW();
    `;
    let consulta = await useDataBase(sentence,[
        info.company_id,
        info.store_id,
        info.cellar_id,
        element.id,
        info.movement_type == 'Inventory Entry'? (element.movementsUnits):(element.movementsUnits * -1),
        0,
        0,
        element.unit_cost != undefined ? element.unit_cost:element.avg_cost
    ],2);
    return consulta;
}

async function inventoryOutHandler(info,idMainDoc){
    let results = [];
    for (const element of info.listProducts) {
        let movement = await insertMovement(info,element,idMainDoc)
        let stockUpdate = await updateStocks(info,element)
        results.push({
            movement:movement,
            stock:stockUpdate
        });
    }
    return results;
}

async function inventoryEntryHandler(info,idMainDoc){
    let results = [];
    for (const element of info.listProducts) {
        let movement = await insertMovement(info,element,idMainDoc)
        let stockUpdate = await updateStocks(info,element)
        results.push({
            movement:movement,
            stock:stockUpdate
        });
    }
    return results;
}

async function inventoryTransferHandler(info){
    // documento salida
    const exit_id = await createMainDocument({
        ...info,
        movement_type: 'Inventory Out',
        store_id: info.origin_store_id,
        cellar_id: info.origin_cellar_id,
    });

    const exitResult = await inventoryOutHandler({
        ...info,
        movement_type: 'Inventory Out',
        store_id: info.origin_store_id,
        cellar_id: info.origin_cellar_id,
    }, exit_id);

    // documento entrada
    const entry_id = await createMainDocument({
        ...info,
        movement_type: 'Inventory Entry',
        store_id: info.destiny_store_id,
        cellar_id: info.destiny_cellar_id,
    });

    const entryResult = await inventoryEntryHandler({
        ...info,
        movement_type: 'Inventory Entry',
        store_id: info.destiny_store_id,
        cellar_id: info.destiny_cellar_id,
    }, entry_id);

    return { exit: exitResult, entry: entryResult };
}



inventoryController.newMovement2 = async (req, res) => {
    let data = ''
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        const info = JSON.parse(data);
        const docId = await createMainDocument(info);
        let result;
        if(typeof(docId) === 'number'){
            switch (info.movement_type) {
                case 'Inventory Entry':
                result = await inventoryEntryHandler(info, docId);
                break;

                case 'Inventory Out':
                result = await inventoryOutHandler(info, docId);
                break;

                case 'Inventory Consume':
                result = await inventoryOutHandler(info, docId);
                break;

                case 'Inventory Transfer':
                result = await inventoryTransferHandler(info,docId);
                break;

                default:
                throw new Error('Tipo de movimiento no soportado');
            }
            res.writeHead(200,{'Content-Type':'text/plain'});
            res.end(JSON.stringify([true,{
                doc_id:docId,
                lines:result
            }]));
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'});
            res.end(JSON.stringify([false,'Error al crear documento']));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
};

inventoryController.getMovements = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                inventoryMovements.* ,
                sga_ecosystem.users.user_name,
                ${info.cellar_name? 'cellars.cellar_name,':''}
                sga_ecosystem.stores.name
            FROM "Inventory".inventoryMovements LEFT JOIN sga_ecosystem.stores
            ON inventoryMovements.store_id = sga_ecosystem.stores.id

            LEFT JOIN sga_ecosystem.users
            ON inventoryMovements.user_id = users.user_id

            ${info.cellar_name? 'LEFT JOIN cellars ON inventoryMovements.cellar_id = cellars.cellar_id ':''}

            WHERE inventoryMovements.company_id = ? 
            ${info.store_id != null? ' AND inventoryMovements.store_id = ?':''}
            ${info.cellar_id != null? ' AND inventoryMovements.cellar_id = ?':''}
            ${info.product_id != null? 'AND inventoryMovements.product_id = ? ':''}
            ORDER BY created_at DESC ${info.limit != undefined? 'LIMIT '+info.limit:''};
        `
        let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.cellar_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

/* ELIMINAR MOVIMIENTOS DE INVENTARIO */
inventoryController.deleteMovement = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const idMovementsArray = info.movements.map(() => "?").join(",");
        let sentence = `
                DELETE FROM "Inventory".inventoryMovements
                WHERE movement_id IN (${idMovementsArray});
            `;
        let consulta = await useDataBase(sentence,[
            info.movements
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

// Obtener stocks
inventoryController.getStocks = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log('---> ',info)
        let values = [];
        let whereClauses = [];
        whereClauses.push(`"Inventory".stocks.company_id = $${values.length +1}`)
        values.push(info.company_id)
        const storeIdParsed = Number(info.store_id);
        const cellarIdParsed = Number(info.cellar_id);

        if(Number.isInteger(storeIdParsed)) {
            whereClauses.push(`"Inventory".stocks.store_id = $${values.length + 1}`);
            values.push(storeIdParsed);
        }

        if(Number.isInteger(cellarIdParsed)) {
            whereClauses.push(`"Inventory".stocks.cellar_id = $${values.length + 1}`);
            values.push(cellarIdParsed);
        }

        whereClauses.push(`"Inventory".stocks.stock > $${values.length +1}`);
        values.push(info.minStock != undefined? info.minStock:0)

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT
                "Inventory".stocks.company_id,
                "Inventory".stocks.store_id,
                "Inventory".stocks.cellar_id,
                "Inventory".stocks.product_id AS id,
                "Inventory".stocks.id AS stock_id,
                "Inventory".stocks.stock,
                "Inventory".stocks.min_stock,
                "Inventory".stocks.max_stock,
                "Inventory".stocks.updated_at,
                "Inventory".stocks.avg_cost,
                "Inventory"."products&services".name,
                "Inventory"."products&services".code,
                "Inventory"."products&services".taxed,
                "Inventory"."products&services".tax_id,
                "Inventory"."products&services".stock AS globalStock,
                c_exit.account_id AS exit_account,
                c_entry.account_id AS entry_account,
                
                "Inventory"."products&services".img
            FROM
                "Inventory".stocks
            LEFT JOIN
                "Inventory"."products&services"
            ON
                "Inventory".stocks.product_id = "Inventory"."products&services".id
            LEFT JOIN 
                "Ecosystem".concepts AS c_exit
            ON 
                "Inventory"."products&services".exit_concept = c_exit.id
            LEFT JOIN 
                "Ecosystem".concepts AS c_entry
            ON 
                "Inventory"."products&services".entry_concept = c_entry.id

            ${whereQuery}
            ORDER BY "Inventory"."products&services".name ASC;
        `;
        let consulta = await useDataBase(sentence,values,1)
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}



inventoryController.getDepartures = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
        SELECT * FROM (
            SELECT 
                departure_id AS transaction_id,
                company_id,
                store_id,
                cellar_id,
                user_id,
                product_id,
                client_id AS third_party_id,
                departure_units AS units,
                departure_value AS value,
                departure_status AS status,
                created_at,
                'departure' AS type
            FROM departures
            WHERE company_id = ${info.company_id}
            ${info.store_id   != null ? `AND store_id = ${info.store_id}` : ''}
            ${info.cellar_id  != null ? `AND cellar_id = ${info.cellar_id}` : ''}
            ${info.product_id != null ? `AND product_id = ${info.product_id}` : ''}

            UNION ALL

            SELECT
                entry_id AS transaction_id,
                company_id,
                store_id,
                cellar_id,
                user_id,
                product_id,
                supplier_id AS third_party_id,
                units,
                entry_value AS value,
                entry_status AS status,
                created_at,
                'entry' AS type
            FROM entries
            WHERE company_id = ${info.company_id}
            ${info.store_id   != null ? `AND store_id = ${info.store_id}` : ''}
            ${info.cellar_id  != null ? `AND cellar_id = ${info.cellar_id}` : ''}
            ${info.product_id != null ? `AND product_id = ${info.product_id}` : ''}
        ) AS transactions
        ORDER BY created_at DESC;
    `;

        let consulta = await useDataBase(sentence,[],1);
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


inventoryController.getRotation = (req,res)=>{
    let data ='';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        // Calculo Saldo inicial
        let s1 = `
        SELECT
            (
                SELECT IFNULL(SUM(units), 0)
                FROM entries
                WHERE company_id = ${info.company_id}
                ${info.store_id != null? ` AND store_id = ${info.store_id}`:''}
                ${info.cellar_id != null? ` AND  cellar_id = ${info.cellar_id}`:''}
                ${info.product_id != null? ` AND  product_id = ${info.product_id}`:''}
                AND DATE(created_at) <= '${info.initialDate}'
            ) -
            (
                SELECT IFNULL(SUM(departure_units), 0)
                FROM departures
                WHERE company_id = ${info.company_id}
                ${info.store_id != null? ` AND store_id = ${info.store_id}`:''}
                ${info.cellar_id != null? ` AND  cellar_id = ${info.cellar_id}`:''}
                ${info.product_id != null? ` AND  product_id = ${info.product_id}`:''}
                AND DATE(created_at) <= '${info.initialDate}'
            ) AS initialStock;`
        let initialBalance = await useDataBase(s1,[],1);
        
        // Calculo Saldo Final
        let s2 =`
        SELECT
        (
            SELECT IFNULL(SUM(units), 0)
            FROM entries
            WHERE company_id = ${info.company_id}
            ${info.store_id != null? ` AND store_id = ${info.store_id}`:''}
            ${info.cellar_id != null? ` AND  cellar_id = ${info.cellar_id}`:''}
            ${info.product_id != null? ` AND  product_id = ${info.product_id}`:''}
            AND DATE(created_at) <= '${info.finalDate}'
        ) -
        (
            SELECT IFNULL(SUM(departure_units), 0)
            FROM departures
            WHERE company_id = ${info.company_id}
            ${info.store_id != null? ` AND store_id = ${info.store_id}`:''}
            ${info.cellar_id != null? ` AND  cellar_id = ${info.cellar_id}`:''}
            ${info.product_id != null? ` AND  product_id = ${info.product_id}`:''}
            AND DATE(created_at) <= '${info.finalDate}'
        ) AS finalStock;`
        let finalBalance = await useDataBase(s2,[],1);

        // Calculo Sumatoria valor y unidades Ventas
        let sCost = `
            SELECT
                SUM(departure_units) AS ttlSellunits,
                SUM(departure_value) AS totalDepartureCost
            FROM 
            departures WHERE departure_type = 'sell' AND company_id = ${info.company_id} 
            ${info.store_id != null? `AND store_id = ${info.store_id} `:''}
            ${info.cellar_id != null? `AND cellar_id = ${info.cellar_id} `:''}
            ${info.product_id != null? `AND product_id = ${info.product_id} `:''}
            AND DATE(created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}' ;  
        `;
        let ttlSellunits = await useDataBase(sCost,[],1);

         // Calculo Sumatoria Costo entrdas
        let svalEntries = `
            SELECT
                SUM(entry_value) AS totalEntriesCost
            FROM entries
            WHERE company_id = ${info.company_id} 
            ${info.store_id != null? `AND store_id = ${info.store_id} `:''}
            ${info.cellar_id != null? `AND cellar_id = ${info.cellar_id} `:''}
            ${info.product_id != null? `AND product_id = ${info.product_id} `:''}
            AND DATE(created_at) BETWEEN '${info.initialDate}' AND '${info.finalDate}' ;  
        `;
        let ttlValEntries = await useDataBase(svalEntries,[],1); 
        res.writeHead(200,{'Content-Type':'text/plain'});
        res.end(JSON.stringify([initialBalance[1][0].initialStock,finalBalance[1][0].finalStock,ttlSellunits[1][0].ttlSellunits,ttlSellunits[1][0].totalDepartureCost,ttlValEntries[1][0].totalEntriesCost]));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

inventoryController.getCategories = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `SELECT * FROM "Inventory".categories WHERE company_id = $1 ;`
        let consulta = await useDataBase(sentence,[info.company_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

inventoryController.getKardex = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];
        const start = info.start_date || null;
        const end = info.end_date || null;
        const columnDate = '"Inventory"."inventoryMovements".created_at';

        whereClauses.push(`"Inventory"."inventoryMovements".company_id = $1`)
        values.push(info.company_id)

        if (start && end) {
            values.push(start, end);
            whereClauses.push(
                `${columnDate} >= $${values.length - 1}::timestamp
                AND ${columnDate} < ($${values.length}::timestamp + INTERVAL '1 day')`
            );

        } else if (start) {
            values.push(start);
            whereClauses.push(
                `${columnDate} >= $${values.length}::timestamp`
            );

        } else if (end) {
            values.push(end);
            whereClauses.push(
                `${columnDate} < ($${values.length}::timestamp + INTERVAL '1 day')`
            );
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT
                "Inventory"."inventoryMovements".*,
                "Inventory"."products&services".name AS product_name,
                "Inventory"."products&services".img,
                "Inventory"."products&services".code AS product_SKU,
                "Ecosystem"."thirdparties".names AS thirdparty_name,
                "Ecosystem"."thirdparties".img AS thirdparty_img,
                "Inventory"."products&services".description AS product_description
            FROM
                "Inventory"."inventoryMovements"
            LEFT JOIN
                "Inventory"."products&services"
            ON
                "Inventory"."inventoryMovements"."product&service_id" = "Inventory"."products&services".id
            LEFT JOIN
                "Ecosystem"."thirdparties"
            ON
                "Inventory"."inventoryMovements"."thirdParty_id" = "Ecosystem"."thirdparties".id
            ${whereQuery}
            ORDER BY "Inventory"."inventoryMovements".created_at DESC;
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

inventoryController.getServicesMovements = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const values = [];
        let whereClauses = [];

        whereClauses.push(`"Inventory".services_movement.company_id = $1`);
        values.push(info.company_id);

        if(info.doc_id != undefined){
            whereClauses.push(`"Inventory".services_movement.doc_id = $${values.length + 1}`);
            values.push(info.doc_id)
        }

        if(info.instance_id != undefined){
            whereClauses.push(`"Inventory".services_movement.instance_id = $${values.length + 1}`);
            values.push(info.instance_id);
        }

        const whereQuery = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";
        let sentence = `
            SELECT
                "Inventory".services_movement.*,
                "Inventory"."products&services".name AS service_name,
                "Inventory"."products&services".img AS service_img,
                "Inventory"."products&services".type
                 AS service_type
            FROM
                "Inventory".services_movement
            LEFT JOIN
                "Inventory"."products&services"
            ON
                "Inventory".services_movement.service_id = "Inventory"."products&services".id
            ${whereQuery}
            ORDER BY
                "Inventory"."products&services".order_index ASC, "Inventory"."products&services".name ASC
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

export default inventoryController;


