import { useDataBase } from "../../app.js";
import processController from "../processController.js";

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
            SELECT DISTINCT ON ("AssetManagement".assets.id)
                "Custom"."z&j_clickControl".*,
                "Ecosystem".users.user_name AS responsable,
                "AssetManagement".assets.name AS asset_name,
                "AssetManagement".assets.model AS asset_model,
                "AssetManagement".assets.img AS asset_img,
                "Custom"."z&j_required_asset_control".required AS "clickReuired"
            FROM 
                "AssetManagement".assets -- Iniciamos desde assets para asegurar que barremos todos los activos
            LEFT JOIN 
                "Custom"."z&j_clickControl" 
            ON
                "AssetManagement".assets.id = "Custom"."z&j_clickControl".asset_id
            LEFT JOIN
                "Ecosystem".users
            ON 
                "Custom"."z&j_clickControl".updated_by = "Ecosystem".users.user_id
            LEFT JOIN 
                "Custom"."z&j_required_asset_control"
            ON
                "AssetManagement".assets.id = "Custom"."z&j_required_asset_control".asset_id
            ${whereQuery}
            ORDER BY 
                "AssetManagement".assets.id, 
                "Custom"."z&j_clickControl".created_at DESC; -- O la columna de fecha que utilices (updated_at)
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


zjController.getHistorialClicksControl = (req,res)=>{
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

zjController.getAuditClicksReport = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        console.log(data);
        let info = JSON.parse(data);
        let values = [];
        let dailyClicksWhere = [];
        let serviceClicksWhere = [];
        let finalWhere = [];

        values.push(info.company_id);
        dailyClicksWhere.push(`cc.company_id = $${values.length}`);
        serviceClicksWhere.push(`sm.company_id = $${values.length}`);

        if(info.machine_id != undefined){
            values.push(info.machine_id);
            dailyClicksWhere.push(`cc.asset_id = $${values.length}`);
            serviceClicksWhere.push(`sec.machine_id = $${values.length}`);
        }

        if(info.start_date != undefined){
            values.push(info.start_date);
            finalWhere.push(`rc.report_date >= $${values.length}`);
        }

        if(info.end_date != undefined){
            values.push(info.end_date);
            finalWhere.push(`rc.report_date <= $${values.length}`);
        }

        const dailyClicksWhereQuery = `WHERE ${dailyClicksWhere.join(" AND ")}`;
        const serviceClicksWhereQuery = `WHERE ${serviceClicksWhere.join(" AND ")}`;
        const finalWhereQuery = finalWhere.length > 0
        ? `WHERE ${finalWhere.join(" AND ")}`
        : "";

        let sentence = `
            WITH daily_clicks AS (
                SELECT DISTINCT ON (
                    cc.company_id,
                    cc.asset_id,
                    cc.created_at::date
                )
                    cc.company_id,
                    cc.asset_id,
                    cc.attached AS "clickControlAttached",
                    cc.created_at::date AS report_date,
                    cc.created_at AS click_record_created_at,
                    cc."initialClicks"::numeric AS initial_clicks
                FROM "Custom"."z&j_clickControl" cc
                ${dailyClicksWhereQuery}
                ORDER BY
                    cc.company_id,
                    cc.asset_id,
                    cc.created_at::date,
                    cc.created_at ASC
            ),

            clicks_with_next AS (
                SELECT
                    dc.*,
                    LEAD(dc.report_date) OVER (
                        PARTITION BY dc.company_id, dc.asset_id
                        ORDER BY dc.report_date
                    ) AS next_report_date,
                    LEAD(dc.initial_clicks) OVER (
                        PARTITION BY dc.company_id, dc.asset_id
                        ORDER BY dc.report_date
                    ) AS next_initial_clicks
                FROM daily_clicks dc
            ),

            registered_clicks AS (
                SELECT
                    cwn.company_id,
                    cwn.asset_id,
                    cwn.report_date,
                    cwn.click_record_created_at,
                    cwn.initial_clicks,
                    cwn."clickControlAttached",
                    cwn.next_report_date,
                    cwn.next_initial_clicks,
                    CASE
                        WHEN cwn.next_initial_clicks IS NULL THEN NULL
                        ELSE cwn.next_initial_clicks - cwn.initial_clicks
                    END AS "clicksRegistrados"
                FROM clicks_with_next cwn
            ),

            service_clicks AS (
                SELECT
                    sm.company_id,
                    sec.machine_id AS asset_id,
                    sm.created_at::date AS report_date,
                    COUNT(sm.id)::int AS services_count,
                    COALESCE(SUM(sm.units), 0)::numeric AS services_units,
                    COALESCE(
                        SUM(sm.units::numeric * COALESCE(eq.clicks, 0)::numeric),
                        0
                    ) AS "clicksEjecutados"
                FROM "Custom"."z&j_serviceExecutionControl" sec
                INNER JOIN "Inventory".services_movement sm
                    ON sm.id = sec."serviceMovement_id"
                LEFT JOIN "Custom"."z&j_clicksEquivalence" eq
                    ON eq.service_id = sm.service_id
                ${serviceClicksWhereQuery}
                GROUP BY
                    sm.company_id,
                    sec.machine_id,
                    sm.created_at::date
            )

            SELECT
                rc.report_date AS fecha,
                rc.asset_id AS machine_id,
                a.name AS machine_name,
                a.model AS machine_model,
                a.img AS machine_img,
                rc.initial_clicks,
                rc."clickControlAttached",
                rc.next_initial_clicks,
                rc.next_report_date,
                COALESCE(rc."clicksRegistrados", 0) AS "clicksRegistrados",
                COALESCE(sc.services_count, 0) AS services_count,
                COALESCE(sc.services_units, 0) AS services_units,
                COALESCE(sc."clicksEjecutados", 0) AS "clicksEjecutados",
                COALESCE(rc."clicksRegistrados", 0) - COALESCE(sc."clicksEjecutados", 0) AS diferencia
            FROM registered_clicks rc
            LEFT JOIN service_clicks sc
                ON sc.company_id = rc.company_id
               AND sc.asset_id = rc.asset_id
               AND sc.report_date = rc.report_date
            LEFT JOIN "AssetManagement".assets a
                ON a.id = rc.asset_id
            ${finalWhereQuery}
            ORDER BY
                rc.report_date DESC,
                a.name ASC;
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
            VALUES ${valuesPre} RETURNING id;
        `;
        let preConsulta = await useDataBase(preSentence,[],3);
        if(info.instance_id != undefined && preConsulta.id != undefined){
            await processController.relatedoc_instances(preConsulta.id, info.instances)
        }
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
                    `"Inventory".services_movement.created_at < $${values.length}::date + INTERVAL '1 day'`
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
                "Process".processes.code AS process_code,
                "Custom"."z&j_clicksEquivalence".clicks AS "controlClicks"
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
            LEFT JOIN
                "Custom"."z&j_clicksEquivalence"
            ON
                "Inventory".services_movement.service_id = "Custom"."z&j_clicksEquivalence".service_id
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