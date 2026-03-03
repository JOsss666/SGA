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
            ORDER BY created_at DESC;
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
            VALUES ($1, $2, $3, $4, $5, $6, $7);
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
        const valuesPre = info.services
            .filter(element => element.company_id !== undefined)
            .map(element => {
                const doubleFace = element.double_face ? element.double_face : false;
                return `(${info.company_id},6,52,'Machine use','active',0,0, ${info.user_id},'${info.description}',${info.instance_id},5)`;
            })
            .join(', ');

        if (valuesPre.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: "No hay servicios válidos para insertar" }));
        }
        let preSentence = `
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
                instance_id,
                step_instance)
            VALUES ${valuesPre};
        `;
        let preConsulta = await useDataBase(preSentence,[],2);
        const values = info.services
            .filter(element => element.asset_id !== undefined)
            .map(element => {
                const doubleFace = element.double_face ? element.double_face : false;
                return `(${element.id}, ${element.asset_id}, ${doubleFace})`;
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
                double_face)
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

zjController.getServiceMovements = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

            // Dates Filters
            if (info.start_date) {
                values.push(info.start_date);
                whereClauses.push(
                    `"Inventory".services_movement.created_at >= $${values.length}`
                );
            }

            if (info.end_date) {
                values.push(info.end_date);
                whereClauses.push(
                    `"Inventory".services_movement.created_at <= $${values.length}`
                );
            }

        const whereQuery = whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";
        let sentence = `
            SELECT
                "Inventory".services_movement.*,
                "Inventory"."products&services".name AS service_name,
                "Inventory"."products&services".code AS service_code,
                "Inventory"."products&services".img AS service_img,
                "Custom"."z&j_serviceExecutionControl".machine_id,
                "Custom"."z&j_serviceExecutionControl".double_face,
                "AssetManagement".assets.name AS machine_name,
                "AssetManagement".assets.model AS machine_model,
                "AssetManagement".assets.img AS machine_img,
                "Ecosystem".thirdparties.names AS thirdParty_name,
                "Process".process_instance."ownSerial" AS instance_serial,
                "Process".processes.code AS process_code
            FROM
                "Inventory".services_movement
            LEFT JOIN
                "Inventory"."products&services"
            ON
                "Inventory".services_movement.service_id = "Inventory"."products&services".id
            LEFT JOIN
                "Custom"."z&j_serviceExecutionControl"
            ON 
                "Inventory".services_movement.id = "Custom"."z&j_serviceExecutionControl"."serviceMovement_id"
            LEFT JOIN
                "AssetManagement".assets
            ON
                "Custom"."z&j_serviceExecutionControl".machine_id = "AssetManagement".assets.id
            LEFT JOIN
                "Ecosystem".thirdparties
            ON
                "Inventory".services_movement."thirdParty_id" = "Ecosystem".thirdparties.id
            LEFT JOIN
                "Process".process_instance
            ON
                "Inventory".services_movement.instance_id = "Process".process_instance.id
            LEFT JOIN
                "Process".processes
            ON
                "Process".process_instance.process_id = "Process".processes.id
            ${whereQuery}
            ORDER BY "Inventory".services_movement.created_at DESC ;
        `;
        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(consulta));
    })
    req.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(err));
    });
}



export default zjController;