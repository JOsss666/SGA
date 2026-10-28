-- Migration: 0037_create_bank_audit
-- Fecha:     2026-10-27
-- Etapa:     TBANK 1.6 (feature-TreasuryBanks, Etapa 1 BD)
-- Regla:     solo aditiva — crea tabla nueva
-- Rollback:  0037_create_bank_audit.rollback.sql
-- Bitácora append-only de movimientos y detalles.
CREATE TABLE IF NOT EXISTS "Treasury".bank_audit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL,
    transaction_id bigint NOT NULL,
    detail_id bigint,
    actor_user_id bigint REFERENCES "Ecosystem".users(user_id),
    operation text NOT NULL CHECK (btrim(operation) <> ''),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, transaction_id) REFERENCES "Treasury".bank_transactions (company_id, id),
    FOREIGN KEY (company_id, detail_id) REFERENCES "Treasury".bank_transaction_details (company_id, id)
);
CREATE INDEX IF NOT EXISTS bank_audit_transaction_idx ON "Treasury".bank_audit (company_id, transaction_id);
CREATE INDEX IF NOT EXISTS bank_audit_created_idx ON "Treasury".bank_audit (company_id, created_at);

CREATE OR REPLACE TRIGGER bank_audit_append_only
    BEFORE UPDATE OR DELETE ON "Treasury".bank_audit
    FOR EACH ROW EXECUTE FUNCTION "Treasury".bank_forbid_mutation();

INSERT INTO public.schema_migrations(filename) VALUES ('0037_create_bank_audit.sql') ON CONFLICT DO NOTHING;
