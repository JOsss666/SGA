import { useDataBase } from "../app.js";

const materializedViewsController = {};

materializedViewsController.refreshAfterTransaction = async()=>{
    useDataBase(`REFRESH MATERIALIZED VIEW CONCURRENTLY "Facturation".mv_shift_payment_summaries`,[],1);
    useDataBase(`REFRESH MATERIALIZED VIEW CONCURRENTLY "Ecosystem".mv_thirdparty_account_balances`,[],1);
}

export default materializedViewsController;
