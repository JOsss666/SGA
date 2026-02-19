import { useDataBase } from "../app.js";

const assetsController = {};

assetsController.getAssets = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
         let values = []
        let whereClauses = []

        whereClauses.push(`"AssetManagement".assets.company_id = $1`);
        values.push(info.company_id)

        if(info.id != undefined){
            whereClauses.puhs(`"AssetManagement".assets.id = $${values.length +1}`);
            values.push(info.id)
        }

        const whereQuery = whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

        let sentence = `
            SELECT 
                company_id,
                id,
                internal_code,
                name,
                brand,
                description,
                model,
                serial_number,
                status,
                purchase_date,
                purchase_price,
                current_value,
                aditional_config,
                created_at,
                updated_at,
                img
	        FROM
                "AssetManagement".assets
            ${whereQuery}    
            ORDER BY
                "AssetManagement".assets.name ASC
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


export default assetsController;