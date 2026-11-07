-- Retira únicamente la vista; no contiene datos propios.
BEGIN;
DROP VIEW "Treasury".bank_account_balances;
DELETE FROM public.schema_migrations WHERE filename = '0038_create_bank_account_balances_view.sql';
COMMIT;
