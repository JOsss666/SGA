import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import pg from 'pg';
import { moneyUnits, moneyText, prepareAdvanceDocument, getCustomerAdvances } from '../../services/customerAdvanceService.js';

const url = process.env.SGA_ADVANCE_TEST_DATABASE_URL;
let pool, cashReceiptService, sellInvoiceService, utils, hooks;
const integration = (name, fn) => test(name, { skip: !url }, fn);
before(async () => {
    if (!url) return;
    const parsed = new URL(url);
    assert.ok(['localhost','127.0.0.1'].includes(parsed.hostname), 'Tests only run against an explicitly configured local database.');
    assert.match(parsed.pathname, /^\/sga_advance_test_/);
    pool = new pg.Pool({ connectionString: url });
    await pool.query(await readFile(new URL('./fixtures/customerAdvances.sql', import.meta.url), 'utf8'));
    await pool.query('BEGIN');
    await pool.query(await readFile(new URL('../../../db/migrations/0029_customer_advances.sql', import.meta.url), 'utf8'));
    await pool.query('COMMIT');
    globalThis.sgaAdvanceTestDb = {
        async withTransaction(callback) {
            const client = await pool.connect();
            try { await client.query('BEGIN'); const result = await callback(client); await client.query('COMMIT'); return result; }
            catch (error) { await client.query('ROLLBACK'); throw error; }
            finally { client.release(); }
        },
        async useDataBase(sql, values, type) {
            if (sql.startsWith('REFRESH MATERIALIZED VIEW')) return [true, 0];
            const result = await pool.query(sql, values);
            return type === 3 ? result.rows[0] : type === 2 ? [true, result.rowCount] : [true, result.rows];
        }
    };
    // Replace only the global app bootstrap (remote DB + AI model) and unrelated
    // process linking. The production receipt, invoice, accounting and ledger run as-is.
    hooks = registerHooks({ load(url, context, next) {
        if (url.endsWith('/api/app.js')) return { format:'module', shortCircuit:true,
            source:'export const { withTransaction, useDataBase } = globalThis.sgaAdvanceTestDb;' };
        if (url.endsWith('/api/controllers/processController.js')) return { format:'module', shortCircuit:true, source:'export default {};' };
        return next(url, context);
    } });
    cashReceiptService = (await import('../../services/cashReceiptService.js')).default;
    sellInvoiceService = (await import('../../services/sellInvoiceService.js')).default;
    utils = (await import('../../controllers/utilsController.js')).default;
});
after(async () => { hooks?.deregister(); await pool?.end(); delete globalThis.sgaAdvanceTestDb; });
const payment = (id, amount, account = id === 1 ? 10 : 20) => ({ paymentMethod_id:id, account_id:account, type:'payment', nature:'DB', total:amount, subtotal:amount, cashBox_id:1, shift_id:1 });
const operation = (amount, account = 20) => ({ type:'operation', nature:'CR', total:amount, subtotal:amount, account_id:account });
const receipt = (party, amount = '500000', overrides = {}) => ({ company_id:1, thirdParty_id:party, user_id:1, created_by:1,
    store_id:1, doc_type:'Cash Recipt', status:'active', concept_id:1, total:amount, subTotal:amount,
    transactionDetails:[payment(1,amount),operation(amount)], ...overrides });
const invoice = (party, amount = '320000', overrides = {}) => ({ ...receipt(party,amount), doc_type:'Sell Invoice', concept_id:3,
    transactionDetails:[payment(2,amount),operation(amount,40)], ...overrides });
const available = async party => (await getCustomerAdvances(pool,{company_id:1,thirdParty_id:party})).advances;

test('money uses exact six-decimal arithmetic and rejects malformed values', () => {
    assert.equal(moneyText(moneyUnits('0.1') + moneyUnits('0.2')), '0.300000');
    for (const value of [-1, NaN, Infinity, '1.0000001', '', '1e5']) assert.throws(() => moneyUnits(value));
});

integration('receipt concept creates the advance with unmarked real payment methods', async () => {
    const result = await cashReceiptService.register(receipt(1));
    const [advance] = await available(1);
    assert.equal(advance.document_id, String(result.id));
    assert.equal(advance.available_amount,'500000.000000');
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM "Facturation".shift_settlement_details')).rows[0].n,1);
});
integration('partial application pays the invoice, leaves remainder and does not add another cash movement', async () => {
    const result = await sellInvoiceService.register(invoice(1));
    assert.equal((await available(1))[0].available_amount,'180000.000000');
    assert.equal((await pool.query('SELECT paid_amount FROM "Ecosystem".documents WHERE id=$1',[result.id])).rows[0].paid_amount,'320000.000000');
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM "Facturation".shift_settlement_details')).rows[0].n,1);
});
integration('mixed payment consumes only the advance portion and records actual cash once', async () => {
    await cashReceiptService.register(receipt(2,'100'));
    const result=await sellInvoiceService.register(invoice(2,'150',{transactionDetails:[payment(2,'100'),payment(1,'50'),operation('150',40)]}));
    assert.equal((await available(2)).length,0);
    const cash=await pool.query(`SELECT count(*)::int AS n FROM "Facturation".shift_settlement_details s JOIN "Ecosystem".transaction_detail td ON td.id=s."transactionDetail_id" JOIN "Ecosystem".transactions t ON t.id=td.transaction_id WHERE t.doc_id=$1`,[result.id]);
    assert.equal(cash.rows[0].n,1);
});
integration('insufficient balance rolls back document, accounting and all applications', async () => {
    await cashReceiptService.register(receipt(3,'100'));
    await assert.rejects(sellInvoiceService.register(invoice(3,'101')),/Saldo a favor insuficiente/);
    assert.equal((await available(3))[0].available_amount,'100.000000');
    const docs=await pool.query('SELECT count(*)::int AS n FROM "Ecosystem".documents WHERE "thirdParty_id"=3');
    assert.equal(docs.rows[0].n,1);
});
integration('simultaneous payments cannot spend the same balance twice', async () => {
    await cashReceiptService.register(receipt(4,'100'));
    const results=await Promise.allSettled([sellInvoiceService.register(invoice(4,'80')),sellInvoiceService.register(invoice(4,'80'))]);
    assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
    assert.equal((await available(4))[0].available_amount,'20.000000');
});
integration('retries are idempotent for both receipts and applications', async () => {
    const info=receipt(5,'100',{request_id:'receipt-test-request-0005'});
    const results=await Promise.all([cashReceiptService.register(info),cashReceiptService.register(info)]);
    assert.equal(results[0].id,results[1].id);
    const bill=invoice(5,'60',{request_id:'invoice-test-request-0005'});
    const first=await sellInvoiceService.register(bill), second=await sellInvoiceService.register(bill);
    assert.equal(first.id,second.id);
    assert.equal((await available(5))[0].available_amount,'40.000000');
    await assert.rejects(sellInvoiceService.register({...bill,total:'61'}),/otro contenido/);
});
integration('company, third party, account and currency isolate balances', async () => {
    await cashReceiptService.register(receipt(6,'100'));
    await assert.rejects(sellInvoiceService.register(invoice(7,'10')),/Saldo a favor insuficiente/);
    await assert.rejects(sellInvoiceService.register(invoice(6,'10',{company_id:2})),/medio de pago/);
    await assert.rejects(sellInvoiceService.register(invoice(6,'10',{transactionDetails:[payment(4,'10'),operation('10',40)]})),/Saldo a favor insuficiente/);
    await assert.rejects(sellInvoiceService.register(invoice(6,'10',{transactionDetails:[payment(5,'10'),operation('10',40)]})),/Saldo a favor insuficiente/);
    assert.deepEqual((await getCustomerAdvances(pool,{company_id:2,thirdParty_id:6})).advances,[]);
});
integration('server reads flags from configuration and rejects credit, recycling, drafts and mismatched accounting', async () => {
    await assert.rejects(cashReceiptService.register(receipt(8,'10',{transactionDetails:[payment(2,'10'),operation('10')]})),/medios reales/);
    await assert.rejects(cashReceiptService.register(receipt(8,'10',{transactionDetails:[payment(3,'10',30),operation('10')]})),/medios reales/);
    await assert.rejects(cashReceiptService.register(receipt(8,'10',{status:'draft'})),/definitivos/);
    await assert.rejects(cashReceiptService.register(receipt(8,'10',{transactionDetails:[payment(1,'10'),operation('9')]})),/contabilización/);
    const info=await prepareAdvanceDocument(pool,receipt(8,'10',{transactionDetails:[{...payment(1,'10'),for_balance:true},operation('10')]}));
    assert.equal(info.transactionDetails[0].for_balance,false);
});
integration('ordinary receipts do not create advances', async () => {
    await cashReceiptService.register(receipt(9,'10',{concept_id:3,transactionDetails:[payment(1,'10'),operation('10',40)]}));
    assert.deepEqual(await available(9),[]);
});
integration('multiple advances are applied FIFO with a separate trail per origin', async () => {
    await cashReceiptService.register(receipt(10,'40')); await cashReceiptService.register(receipt(10,'60'));
    const bill=await sellInvoiceService.register(invoice(10,'70'));
    assert.equal((await available(10))[0].available_amount,'30.000000');
    assert.deepEqual((await pool.query('SELECT amount FROM "Treasury".advance_applications WHERE document_id=$1 ORDER BY id',[bill.id])).rows.map(r=>r.amount),['40.000000','30.000000']);
});
integration('portfolio payment updates debt and invoice atomically and enforces ownership', async () => {
    const pending=await sellInvoiceService.register(invoice(11,'80',{transactionDetails:[payment(3,'80',30),operation('80',40)]}));
    await cashReceiptService.register(receipt(11,'100'));
    const account=(await pool.query('SELECT id FROM "Treasury".accounts_receivable WHERE document_id=$1',[pending.id])).rows[0];
    const info=receipt(11,'50',{concept_id:2,payedBills:[{id:account.id,document_id:pending.id,paid_value:'50'}],transactionDetails:[payment(2,'50'),operation('50',30)]});
    await cashReceiptService.register(info);
    assert.equal((await available(11))[0].available_amount,'50.000000');
    assert.equal((await pool.query('SELECT paid_amount FROM "Ecosystem".documents WHERE id=$1',[pending.id])).rows[0].paid_amount,'50.000000');
    await assert.rejects(cashReceiptService.register({...info,thirdParty_id:12}),/cuenta por cobrar/);
    assert.equal((await pool.query('SELECT paid_amount FROM "Treasury".accounts_receivable WHERE id=$1',[account.id])).rows[0].paid_amount,'50.000000');
});
integration('cash classifier excludes balance methods and drafts', () => {
    assert.equal(utils.shouldRegisterCashMovement({doc_type:'Cash Recipt'}, {...payment(2,'1'),for_balance:true}),false);
    assert.equal(utils.shouldRegisterCashMovement({doc_type:'Cash Recipt',status:'draft'},payment(1,'1')),false);
});

integration('advance receipt without accounting details cannot silently succeed', async () => {
    await assert.rejects(cashReceiptService.register(receipt(14,'10',{transactionDetails:[]})),/contabilización/);
});
integration('available dates respect the company timezone at midnight and DST', async () => {
    await cashReceiptService.register(receipt(15,'10'));
    await pool.query(`UPDATE "Treasury".customer_advances SET created_at='2026-09-26T04:59:59Z' WHERE "thirdParty_id"=15`);
    let item=(await available(15))[0];
    assert.equal(item.business_time_zone,'America/Bogota');
    assert.equal(item.business_date,'2026-09-25');
    // A separate company's timezone is used without inferring it from country.
    await pool.query(`UPDATE "Ecosystem".company_settings SET time_zone='America/New_York' WHERE company_id=1`);
    await pool.query(`UPDATE "Treasury".customer_advances SET created_at='2026-03-08T06:59:59Z' WHERE "thirdParty_id"=15`);
    item=(await available(15))[0];
    assert.equal(item.created_at_local,'2026-03-08 01:59:59');
    await pool.query(`UPDATE "Treasury".customer_advances SET created_at='2026-03-08T07:00:00Z' WHERE "thirdParty_id"=15`);
    item=(await available(15))[0];
    assert.equal(item.created_at_local,'2026-03-08 03:00:00');
    await pool.query(`UPDATE "Ecosystem".company_settings SET time_zone='America/Bogota' WHERE company_id=1`);
});
integration('migration can be applied twice without changing existing advances', async () => {
    const before=(await pool.query('SELECT count(*) FROM "Treasury".customer_advances')).rows[0].count;
    await pool.query(await readFile(new URL('../../../db/migrations/0029_customer_advances.sql', import.meta.url),'utf8'));
    assert.equal((await pool.query('SELECT count(*) FROM "Treasury".customer_advances')).rows[0].count,before);
});

integration('multiple balance rows share one available amount and roll back together', async () => {
    await cashReceiptService.register(receipt(16,'100'));
    await assert.rejects(sellInvoiceService.register(invoice(16,'120',{
        transactionDetails:[payment(2,'60'),payment(2,'60'),operation('120',40)]
    })),/Saldo a favor insuficiente/);
    assert.equal((await available(16))[0].available_amount,'100.000000');
});
integration('a failed portfolio application restores the prior debt and balance', async () => {
    const pending=await sellInvoiceService.register(invoice(17,'100',{transactionDetails:[payment(3,'100',30),operation('100',40)]}));
    await cashReceiptService.register(receipt(17,'30'));
    const account=(await pool.query('SELECT id FROM "Treasury".accounts_receivable WHERE document_id=$1',[pending.id])).rows[0];
    await assert.rejects(cashReceiptService.register(receipt(17,'50',{
        concept_id:2,payedBills:[{id:account.id,document_id:pending.id,paid_value:'50'}],transactionDetails:[payment(2,'50'),operation('50',30)]
    })),/Saldo a favor insuficiente/);
    assert.equal((await available(17))[0].available_amount,'30.000000');
    assert.equal((await pool.query('SELECT paid_amount FROM "Ecosystem".documents WHERE id=$1',[pending.id])).rows[0].paid_amount,'0.000000');
    assert.equal((await pool.query('SELECT paid_amount FROM "Treasury".accounts_receivable WHERE id=$1',[account.id])).rows[0].paid_amount,'0');
});
