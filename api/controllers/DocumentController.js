import { useDataBase } from "../app.js";

const documentController = {};

documentController.applyPaymentToDocument = async(documentId, amount)=>{
    return await useDataBase(`
        UPDATE "Ecosystem".documents
            SET paid_amount = paid_amount + $1
        WHERE id = $2;
    `,[amount, documentId],2);
}

documentController.registerDocument = async(data)=>{
    let info = JSON.parse(data)
        console.log(info)
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
                instance_id,
                step_instance)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, "ownSerial";
    `;
    let consulta = await useDataBase(docCreation,[
        info.company_id,
        info.store_id,
        info.thirdParty_id,
        info.doc_type,
        info.status,
        info.subTotal,
        info.total,
        info.created_by,
        info.description,
        JSON.stringify(info.attached),
        undefined,
        undefined
    ],3);
    if(info.instance_id != undefined && consulta.id != undefined){
        await processController.relatedoc_instances(consulta.id,info.instances)
    }
    return consulta;
}

export default documentController;
