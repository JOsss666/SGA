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
            ORDER BY created_at DESC
            LIMIT 1;
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
               description)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        let consulta = await useDataBase(sentence,[
            info.company_id,
            info.user_id,
            info.initialClicks,
            info.finalClicks,
            info.user_id,
            info.attached,
            info.description
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

zjController.closeClickControl = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        const nuevoAdjunto = JSON.stringify([]);
        let sentence = `
            UPDATE "Custom"."z&j_clickControl"
            SET 
                "finalClicks" = $1,
                updated_by = $2,
                attached = attached || $3,
                status = 'closed'
            WHERE id = $4 ;
        `;
        let consulta = await useDataBase(sentence,[
            info.finalClicks,
            info.user_id,
            info.attached,
            info.id
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


export default zjController;