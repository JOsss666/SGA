import { useDataBase } from "../../app.js";

const zjController = {};

zjController.getlastClickControl = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        console.log(data);
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        if(info.asset_id != undefined){
            whereClauses.push(`"Custom"."z&j_clickControl".asset_id = $${values.length +1}`);
            values.push(info.asset_id);
        }

        const whereQuery = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

        let sentence = `
            SELECT 
                "Custom"."z&j_clickControl" .*,
                "Ecosystem".users.user_name AS responsable,
                "AssetManagement".assets.name AS asset_name,
                "AssetManagement".assets.model AS asset_model,
                "AssetManagement".assets.img AS asset_img
	        FROM 
                "Custom"."z&j_clickControl" 
            LEFT JOIN
                "Ecosystem".users
            ON 
                "Custom"."z&j_clickControl".updated_by = "Ecosystem".users.user_id
            LEFT JOIN
                "AssetManagement".assets
            ON
                "Custom"."z&j_clickControl".asset_id = "AssetManagement".assets.id
            ${whereQuery}
            ORDER BY created_at DESC
            LIMIT 1;
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

zjController.openClickControl = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let sentence = `
            INSERT INTO "Custom"."z&j_clickControl"(
               company_id,
               created_by,
               "initialClicks",
               updated_by,
               attached,
               description,
               asset_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.user_id,
            info.initialClicks,
            info.user_id,
            info.attached,
            info.description,
            info.asset_id
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

zjController.registerServiceMachine = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const values = info.services
            .filter(element => element.asset_id !== undefined)
            .map(element => {
                const clicks = element.clicks ? element.clicks : 0;
                return `(${element.id}, ${element.asset_id}, ${clicks})`;
            })
            .join(', ');

        if (values.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: "No hay servicios válidos para insertar" }));
        }
        let sentence = `
            INSERT INTO "Custom"."z&j_serviceExecutionControl"(
                "serviceMovement_id",
                machine_id,
                clicks)
            VALUES ${values};
        `;
        let consulta = await useDataBase(sentence,[],2);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(consulta));
    })
    req.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(err));
    });
}



export default zjController;