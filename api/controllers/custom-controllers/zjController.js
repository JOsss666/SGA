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
        let sentence = `
            SELECT 
                id, 
                company_id,
                created_by,
                "initialClicks",
                "finalClicks",
                created_at,
                updated_at,
                updated_by,
                description,
                status,
                attached
	        FROM "Custom"."z&j_clickControl" 
            WHERE asset_id = $1
            ORDER BY created_at DESC
            LIMIT 1;
        `;
        let consulta = await useDataBase(sentence,[info.asset_id],1);
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
               "finalClicks",
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
            info.finalClicks,
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

zjController.closeClickControl = (req, res) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    });

    req.on('end', async () => {
        try {
            let info = JSON.parse(data);

            // 1. Transformamos el array de objetos en un array de strings JSON
            // Si info.attached es [{id:38, url:'...'}], esto crea ['{"id":38, "url":"..."}']
            const arrayParaPostgres = info.attached.map(item => JSON.stringify(item));

            let sentence = `
                UPDATE "Custom"."z&j_clickControl"
                SET 
                    "finalClicks" = $1,
                    updated_by = $2,
                    -- Usamos array_cat o || asegurando que ambos lados sean del mismo tipo
                    attached = COALESCE(attached, '{}') || $3::text[] ,
                    status = 'closed'
                WHERE id = $4 
                RETURNING *; -- Sugerencia: retornar el registro actualizado
            `;

            let consulta = await useDataBase(sentence, [
                info.finalClicks,
                info.user_id,
                arrayParaPostgres, // Pasamos el array de strings
                info.id
            ], 2);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(consulta));
        } catch (err) {
            console.error("Error en closeClickControl:", err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Error procesando la solicitud", details: err.message }));
        }
    });

    req.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(err));
    });
};


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