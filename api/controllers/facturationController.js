import { useDataBase } from "../app.js";
const facturationController = {};


facturationController.newCashRecipt = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk    })
    req.on('end',async()=>{
        let info = JSON.parse(data)
        let docCreation = `
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
                attached, 
                instance_id)
	    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);
    `;
        let consulta = await useDataBase(docCreation,[
            info.company_id,
            info.store_id,
            info.thirdparty_id,
            info.document_type,
            info.status,
            info.subTotal,
            info.total,
            info.created_by,
            info.description,
            JSON.stringify(info.attached),
            undefined
        ],2);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}




export default facturationController;