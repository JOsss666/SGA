import { useDataBase } from "../app.js";
import treasuryController from "./TreasuryController.js";

const transactionDetailController = {};

transactionDetailController.createDetail = async(info, transactionId, element)=>{
    let sentence = `
        INSERT INTO "Ecosystem".transaction_detail(
            company_id,
            transaction_id,
            "thirdParty_id",
            account_id,
            type,
            "subTotal",
            total,
            nature,
            "paymentMethod_id",
            voucher)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;
    `;
    return await useDataBase(sentence,[
        info.company_id,
        transactionId,
        info.thirdParty_id,
        element.account_id,
        element.type,
        element.subtotal,
        element.total,
        element.nature,
        element.paymentMethod_id != undefined ? element.paymentMethod_id:undefined,
        element.voucher
    ],3);
}

transactionDetailController.createMany = async(info, transactionId)=>{
    let resultDetails = [];
    const details = info.transactionDetails ?? [];

    for(const element of details){
        let postConsulta = await transactionDetailController.createDetail(info, transactionId, element);

        if(treasuryController.shouldRegisterCashMovement(info, element) && postConsulta.id != undefined){
            await treasuryController.registerShiftSettlementDetail(info, element, postConsulta.id);
        }

        if(element.for_wallet == true){
            let insertForWallet = await treasuryController.newPendingAccount(info, element);
            console.log('Estado creacion cartera: ',insertForWallet);
        }

        if(element.for_balance){

        }
        // Espacio para actualizar aviable credit
        resultDetails.push([postConsulta.id != undefined,postConsulta.id]);
    }

    return resultDetails;
}

export default transactionDetailController;
