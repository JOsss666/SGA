
import { calcWeightedAverage, useDataBase } from "../app.js";
import fs from "fs";
import path from "path";
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
                sga_ecosystem.acount_plans.id AS accountPlanId
            FROM
                sga_ecosystem.companies 
            LEFT JOIN
                sga_ecosystem.acount_plans
            ON
                sga_ecosystem.companies.company_id = sga_ecosystem.acount_plans.company_id
            WHERE sga_ecosystem.companies.company_id = ? ;`
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

controller.insertNewAccount = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO
                sga_ecosystem.contable_accounts
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
                        id,code,name,level,account_path
                    FROM sga_ecosystem.account_templates_PUC
                    UNION ALL

                    SELECT 
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

// SGA - Inventory (Cambiar de archivo despues)

controller.getUserInfo = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            SELECT
                sga_ecosystem.users.* , sga_ecosystem.users_access.* 
            FROM 
                sga_ecosystem.users LEFT JOIN sga_ecosystem.users_access
            ON
                sga_ecosystem.users.user_id = sga_ecosystem.users_access.user_id 
            WHERE
                sga_ecosystem.users.user_id = ? ;`
        let consulta = await useDataBase(sentence,[info],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

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


controller.getSubCategories = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        let sentence = `SELECT * FROM categories WHERE company_id = ? ORDER BY category_code ASC ;`;
        let consulta = await useDataBase(sentence,[info],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.createSubCategory = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        let sentence = `INSERT INTO categories(category_code,category_name,company_id,category_description,category_color) VALUES (?,?,?,?,?);`;
        let consulta = await useDataBase(sentence,[info.category_code,info.category_name,info.company_id,info.category_description,info.category_color],2);
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


controller.getProducts = (req,res)=>{
    let data = ''
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        if(info.tree){
            sentence = `SELECT * FROM products WHERE category_id = ? AND subCategory_id = ? ;`
            values = [info.category_id,info.subCategory_id]
        }else if(info.totalProducts){
            let sentence = '';
            if(info.totalStocks){
                sentence = `
                SELECT
                    p.*,
                    SUM(s.stock) AS total_stock
                FROM products p
                LEFT JOIN stocks s ON p.product_id = s.product_id
                GROUP BY p.product_id, p.product_name
                ORDER BY total_stock DESC;
                `;
            }else{
                sentence = `SELECT * FROM products WHERE company_id = ?`;
            }
            let consulta = await useDataBase(sentence,[info.company_id],1);
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta));
        }else{
            if(info.pricesList){
                let sentence = `
                    SELECT 
                    products.*,
                    pricesProducts.list_id,
                    pricesProducts.unit_value,
                    pricesProducts.min_stock,
                    pricesProducts.unit_cost,
                    pricesProducts.price_id,
                    pricesProducts.total_cost,
                    stocks.stock_id,
                    stocks.stock AS storeStock  

                    FROM products

                    LEFT JOIN pricesProducts 
                    ON products.product_id = pricesProducts.product_id
                    AND pricesProducts.price_state = 'active'
                    AND pricesProducts.store_id = ?
                    AND pricesProducts.company_id = products.company_id

                    LEFT JOIN stocks 
                    ON products.product_id = stocks.product_id
                    AND stocks.store_id = ?
                    AND stocks.company_id = products.company_id

                    WHERE products.company_id = ?;
                `;
                let consulta = await useDataBase(sentence,[info.store_id,info.store_id,info.company_id],1);
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(consulta));
            }else{
                let sentence = `
                    SELECT DISTINCT
                    products.*,
                    pricesProducts.list_id,
                    pricesProducts.unit_value,
                    ${info.storeDetails? 'stores.store_name,':''}
                    pricesProducts.min_stock,
                    pricesProducts.unit_cost,
                    pricesProducts.price_id,
                    pricesProducts.total_cost,
                    stocks.stock_id,
                    stocks.cellar_id,
                    stocks.stock AS storeStock  

                    FROM products

                    ${info.priceRequired? 'INNER':'LEFT'} JOIN pricesProducts 
                    ON products.product_id = pricesProducts.product_id
                    AND pricesProducts.price_state = 'active'
                    ${info.store_id != undefined? 'AND pricesProducts.store_id = ?':" "}
                    AND pricesProducts.company_id = products.company_id

                    LEFT JOIN stocks
                    ON products.product_id = stocks.product_id
                    ${info.store_id != undefined? ' AND stocks.store_id = ? ':" "}${info.cellar_id != null? 'AND stocks.cellar_id = ?':' '}
                    AND stocks.company_id = products.company_id

                    ${info.storeDetails ?
                    'LEFT JOIN stores ON stocks.store_id = stores.store_id '
                    :''}

                    WHERE products.company_id = ? ${info.requiredStock? 'AND stocks.stock > 0 ':''}  ${info.product_id != null? 'AND products.product_id = ? ':' '};
                `;
                let values;
                console.log(info);
                if(info.store_id == null){
                    values = [info.company_id]
                    console.log("Caso 1")
                }else{
                    values = [info.store_id,info.store_id]
                    if(info.cellar_id != undefined){
                        values.push(info.cellar_id)
                    }
                    values.push(info.company_id)
                    if(info.product_id != undefined){
                        values.push(info.product_id)
                    }
                    console.log("Caso 2")
                }
                console.log(values);
                let consulta = await useDataBase(sentence,values,1);
                res.writeHead(200,{'Content-Type':'text/plain'})
                res.end(JSON.stringify(consulta));
            }
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.createProduct = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log(info)
        let sentence = `INSERT INTO products (company_id,product_code,product_name,supplier_id,category_id,stock,units,product_description) VALUES(?,?,?,?,?,?,?,?);`
        let consulta = await useDataBase(sentence,[info.company_id,info.product_code,info.name,info.supplier_id,info.category_id,0,info.units,info.description],2)
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.getPricesNameList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        console.log(data);
        let info = JSON.parse(data);
        let sentence = ``;
        if(info.limit != undefined){
            sentence = `SELECT * FROM pricesList WHERE company_id = ? LIMIT 3;`
        }else{
            sentence = `SELECT * FROM pricesList WHERE company_id = ? ; `
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

controller.createStore = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `INSERT INTO stores (company_id,store_name,store_zone,store_city,store_location) VALUES(?,?,?,?,?);`;
        let consulta = await useDataBase(sentence,[info.company_id,info.store_name,info.store_zone,info.store_city,info.store_location],2);
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
        let sentence = `SELECT * FROM stores WHERE company_id = ? ; `
        let consulta = await useDataBase(sentence,[info],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.createCellar = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `INSERT into cellars(company_id,store_id,cellar_name,cellar_location) VALUES(?,?,?,?);`
        let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.cellar_name,info.cellar_location],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.getCellars = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `SELECT * FROM cellars WHERE company_id = ? `;
        if(info.store_id != undefined){
            sentence += `and store_id = ? ;`
        }else{
            sentence += ';'
        }
        let consulta = await useDataBase(sentence,[info.company_id,info.store_id],1)
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.createPriceList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `INSERT INTO pricesList(company_id,store_id,list_name, list_state, list_description) VALUES(?,?,?,?,?);`
        let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.list_name,'Pendiente',info.list_description],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.getPricesList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `SELECT pricesList.*, stores.store_id,stores.store_name FROM pricesList LEFT JOIN stores ON pricesList.store_id = stores.store_id WHERE pricesList.company_id = ? `
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

controller.updateProductList = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        console.log(info)
        if(info.price_id == undefined){
            let sentence = `INSERT INTO pricesProducts (company_id,store_id,list_id,product_id,unit_value,price_state) VALUES (?,?,?,?,?,?); `
            let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.list_id,info.product_id,info.unit_value,"active"],4);
            let postSen = `UPDATE stocks SET list_id = ? WHERE stock_id = ? ;`
            let postCon = await useDataBase(postSen,[consulta.insertId,info.stock_id],2);
            res.writeHead(200,{'Content-Type':'text/plain'})
            res.end(JSON.stringify(consulta));
        }else{
            let sentence = `UPDATE pricesProducts SET list_id = ?, unit_value = ?, price_state = ?  WHERE price_id = ? ;`
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


controller.getPriceStock = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        console.log(info);
        let sentence = `SELECT products.*, stocks.* FROM stocks LEFT JOIN products ON products.product_id = stocks.product_id WHERE stocks.product_id = ? AND stocks.list_id = ? ;`;
        let consulta = await useDataBase(sentence,[info.product_id,info.list_id],1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
        req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

controller.newEntry = (req,res)=>{
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
        let s1 = `INSERT INTO entries (company_id,store_id,cellar_id,section_id,user_id,product_id,supplier_id,units,entry_value,unit_value,entry_status)VALUES(?,?,?,?,?,?,?,?,?,?,?);`;
        let preConsul = await useDataBase(s1,[info.company_id,info.store_id,info.cellar_id,info.section_id,info.user_id,info.product_id,info.supplier_id,info.units,info.cost,(info.cost/info.units),info.entry_status],4);
        if(preConsul){
            let PrevSen = `
                SELECT 
                    pricesProducts.list_id, 
                    pricesProducts.price_id, 
                    pricesProducts.product_id, 
                    pricesProducts.total_cost, 
                    stocks.stock_id, 
                    stocks.stock 
                FROM pricesProducts 
                LEFT  JOIN stocks 
                    ON pricesProducts.list_id = stocks.list_id 
                    AND pricesProducts.product_id = stocks.product_id 
                    AND pricesProducts.company_id = stocks.company_id 
                    AND pricesProducts.store_id = stocks.store_id 
                WHERE pricesProducts.price_state = 'active' 
                    AND pricesProducts.company_id = ? 
                    AND pricesProducts.store_id = ? 
                    AND pricesProducts.product_id = ?;
                `;

            let prevCons = await useDataBase(PrevSen,[info.store_id,info.company_id,info.product_id],1);
            console.log(prevCons)
            if(prevCons[0]){
                let s1 = `UPDATE pricesProducts SET total_cost = ? , unit_cost = ?  WHERE price_id = ? ;`
                let values = calcWeightedAverage(prevCons[1][0].total_cost,prevCons[1][0].stock,info.cost,info.units);
                console.log(values);
                let conS1 = await useDataBase(s1,[values[1],values[2],prevCons[1][0].price_id],2);
                if(prevCons[1][0].stock_id != undefined){
                    let sentence = `UPDATE stocks SET stock = ?, list_id = ?  WHERE stock_id = ? OR company_id = ? and store_id = ? and product_id = ? ;`;
                    let consulta = await useDataBase(sentence,[values[0],prevCons[1][0].list_id,prevCons[1][0].stock_id,info.company_id,info.store_id,info.product_id],2);
                    res.writeHead(200,{'Content-Type':'text/plain'})
                    res.end(JSON.stringify([consulta,preConsul]));
                }else{
                    let sentence = `INSERT INTO stocks (company_id,store_id,list_id,product_id,cellar_id,stock) VALUES(?,?,?,?,?,?);`;
                    let consulta = await useDataBase(sentence,[info.company_id,info.store_id,info.list_id,info.product_id,info.cellar_id,info.units],2);
                    res.writeHead(200,{'Content-Type':'text/plain'});
                    res.end(JSON.stringify([consulta,preConsul]));
                }
            }else{
                let s1 = `INSERT INTO pricesProducts (company_id,store_id,list_id,product_id,total_cost,unit_cost,price_state) VALUES (?,?,?,?,?,?,?);`;
                let conS1 = await useDataBase(s1,[info.company_id,info.store_id,0,info.product_id,info.cost,(info.cost/info.units),"active"],2)
                let sentence = `INSERT INTO stocks (company_id,store_id,list_id,product_id,cellar_id,stock) VALUES(?,?,?,?,?,?);`;
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


controller.newDeparture = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log(info);
        let s1 = `INSERT INTO departures (company_id,store_id,cellar_id,section_id,user_id,product_id,departure_units,departure_value,departure_status,client_id) VALUES (?,?,?,?,?,?,?,?,?,?);`
        let prevIn = await useDataBase(s1,[info.company_id,info.store_id,info.cellar_id,info.section_id,info.user_id,info.product_id,info.units,(info.units * info.departure_value),info.departure_status,0],4);
        if(prevIn){
            let s2 = `SELECT pricesProducts.* , stocks.stock from pricesProducts LEFT JOIN stocks ON pricesProducts.list_id = stocks.list_id AND pricesProducts.product_id = stocks.product_id WHERE pricesProducts.list_id = ? AND stocks.stock_id = ? ;`
            let prevC = await useDataBase(s2,[info.list_id,info.stock_id],1);
            console.log(prevC);
            if(prevC[0]){
                let s1 = `UPDATE pricesProducts SET total_cost = ?, unit_cost = ? WHERE price_id = ? ; `
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

controller.newMovement = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        console.log(info);
        let sentence = `INSERT INTO inventoryMovements (user_id,company_id,store_id,cellar_id,movement_date,document_number,movement_type,movement_value,movement_transactions,movement_state,movement_description,attach_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`
        let values = [info.user_id,info.company_id,info.store_id,info.cellar_id,info.movement_date,info.document_number,info.movement_type,info.movement_value,info.movement_transactions,"Completado",info.movement_description,"-"]
        let consulta = await useDataBase(sentence,values,4);
        if(typeof consulta == 'number'){
            if(info.processAction == true){
                let postSen = `
                    INSERT 
                        INTO sga_process.CIS(
                            op_id,
                            company_id,
                            store_id,
                            cellar_id,
                            user_id,
                            thirdParty_id,
                            movement_id,
                            description
                        )
                    VALUES(
                        ${info.op_id},
                        ${info.company_id},
                        ${info.store_id},
                        ${info.cellar_id},
                        ${info.user_id},
                        ${info.supplier_id},
                        ${consulta},
                        '${info.movement_description + ` (Consumo inventario OP#${info.op_id}`})'
                    );
                `
                let postConsul = await useDataBase(postSen,[],4);
                let senUpdate = `
                    UPDATE
                        sga_process.OPS
                    SET
                        sga_process.OPS.executedCost = sga_process.OPS.executedCost + ${info.movement_value}
                    WHERE
                        sga_process.OPS.op_id = ${info.op_id}
                    ;
                `
                let updateOP = await useDataBase(senUpdate,[],2);
                if(postConsul){
                    res.writeHead(200,{'Content-Type':'text/plain'});
                    res.end(JSON.stringify([consulta,postConsul,updateOP]));
                }else{
                    res.writeHead(200,{'Content-Type':'text/plain'});
                    res.end(JSON.stringify([false,`Error al registrar Consumo de Inventario en OP#${info.movement_value}`]));
                }
            }else{
                res.writeHead(200,{'Content-Type':'text/plain'});
                res.end(JSON.stringify(consulta));
            }
        }else{
            res.writeHead(200,{'Content-Type':'text/plain'});
            res.end(JSON.stringify(consulta));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


controller.getMovements = (req,res)=>{
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
                stores.store_name
            FROM inventoryMovements LEFT JOIN stores
            ON inventoryMovements.store_id = stores.store_id

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

controller.getTransactions = (req,res)=>{
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


controller.getRotation = (req,res)=>{
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

export default controller;
