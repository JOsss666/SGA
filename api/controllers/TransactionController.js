import { useDataBase } from "../app.js";

const transactionController = {};

transactionController.createHeader = async(info)=>{
    let sentence = `
        INSERT INTO
            "Ecosystem".transactions
            (
                user_id,
                "thirdParty_id",
                company_id,
                store_id,
                concept_id,
                doc_date,
                doc_type,
                doc_id,
                "subTotal",
                total,
                "costCenter_id",
                bussines_id
            )
        VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id;
    `;
    return await useDataBase(sentence,[
        info.user_id,
        info.thirdParty_id,
        info.company_id,
        info.store_id,
        info.concept_id,
        info.doc_date != undefined ? info.doc_date.replace(/\//g, '-'):undefined,
        info.doc_type,
        info.doc_id,
        info.subTotal,
        info.total,
        info.costCenter_id,
        info.bussines_id
    ],3);
}

export default transactionController;
