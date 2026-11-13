import { useDataBase } from '../../../app.js';

const rows = async (sql, params) => {
    const result = await useDataBase(sql, params, 1);
    return result[0] ? result[1] : [];
};

const executeGetDocumentOptions = async ({ context }) => {
    const companyId = Number(context.companyId);
    const [stores, costCenters, businesses, concepts, paymentMethods, cashBoxes, shifts] = await Promise.all([
        rows(`SELECT id, name FROM "Ecosystem".stores WHERE company_id = $1 ORDER BY name`, [companyId]),
        rows(`SELECT id, name, code FROM "Ecosystem"."costCenters" WHERE company_id = $1 ORDER BY name`, [companyId]),
        rows(`SELECT id, name FROM "Ecosystem".bussines WHERE company_id = $1 ORDER BY name`, [companyId]),
        rows(`SELECT id, name, for_wallet, for_balance, "for_cashExit" AS for_cash_exit
              FROM "Ecosystem".concepts WHERE company_id = $1 AND status = 'active' ORDER BY order_index, name`, [companyId]),
        rows(`SELECT id, name, type, for_wallet, for_balance
              FROM "Ecosystem".payment_methods WHERE company_id = $1 AND status = 'active' ORDER BY order_index, name`, [companyId]),
        rows(`SELECT id, name FROM "Treasury".cash_boxes WHERE company_id = $1 AND status::text NOT IN ('hidden', 'boqued') ORDER BY name`, [companyId]),
        rows(`SELECT id, "cashBox_id" AS cash_box_id FROM "Facturation".register_shifts
              WHERE company_id = $1 AND status = 'open' ORDER BY id DESC`, [companyId])
    ]);
    return {
        infoType: 'document_options',
        stores,
        cost_centers: costCenters,
        businesses,
        concepts,
        payment_methods: paymentMethods,
        cash_boxes: cashBoxes,
        open_shifts: shifts
    };
};

export default executeGetDocumentOptions;
