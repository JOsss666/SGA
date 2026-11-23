-- Migration: 0039_add_bank_contract_fields
-- Fecha:     2026-11-17
-- Etapa:     TBANK 1.x (feature-TreasuryBanks, brecha contrato UMJP vs. BD)
-- Regla:     solo aditiva — ADD COLUMN nullable/con default constante; no toca datos existentes
-- Rollback:  0039_add_bank_contract_fields.rollback.sql
-- Persiste los campos del UMJP que 0035/0036 no cubrían:
--   * bank_transactions.description      <- transacción.description
--   * bank_transaction_details.client_detail_id <- detalle.detail_id (uuid del emisor); permite
--     resolver reverses_detail_id del JSON hacia el id interno bigint.
--   * bank_transaction_details.metadata  <- detalle.metadata
-- Los triggers append-only solo bloquean UPDATE/DELETE; ADD COLUMN no los dispara.
BEGIN;

ALTER TABLE "Treasury".bank_transactions
    ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE "Treasury".bank_transaction_details
    ADD COLUMN IF NOT EXISTS client_detail_id uuid,
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS bank_transaction_details_client_detail_idx
    ON "Treasury".bank_transaction_details (company_id, client_detail_id)
    WHERE client_detail_id IS NOT NULL;

INSERT INTO public.schema_migrations(filename) VALUES ('0039_add_bank_contract_fields.sql') ON CONFLICT DO NOTHING;

COMMIT;
