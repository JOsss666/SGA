-- Retira las columnas de 0039 solo si no hay datos en ellas. Requiere respaldo previo; nunca usar CASCADE.
BEGIN;
LOCK TABLE "Treasury".bank_transactions, "Treasury".bank_transaction_details IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Treasury".bank_transactions WHERE description IS NOT NULL)
       OR EXISTS (SELECT 1 FROM "Treasury".bank_transaction_details
                  WHERE client_detail_id IS NOT NULL OR metadata <> '{}'::jsonb) THEN
        RAISE EXCEPTION 'No se puede retirar la migración: ya hay datos en las columnas de 0039.';
    END IF;
END;
$$;
DROP INDEX "Treasury".bank_transaction_details_client_detail_idx;
ALTER TABLE "Treasury".bank_transaction_details DROP COLUMN client_detail_id, DROP COLUMN metadata;
ALTER TABLE "Treasury".bank_transactions DROP COLUMN description;
DELETE FROM public.schema_migrations WHERE filename = '0039_add_bank_contract_fields.sql';
COMMIT;
