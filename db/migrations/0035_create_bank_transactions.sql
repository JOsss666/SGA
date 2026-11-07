-- Migration: 0035_create_bank_transactions
-- Fecha:     2026-10-27
-- Etapa:     TBANK 1.4 (feature-TreasuryBanks, Etapa 1 BD)
-- Regla:     solo aditiva — crea tabla y funciones nuevas
-- Rollback:  0035_create_bank_transactions.rollback.sql
-- Decisión D3: operation solo 'create' o 'reverse' (no existe 'modify'; corregir = reverse + create).
-- created_at es un instante UTC (timestamptz); el día comercial vive en context.business_date.
CREATE TABLE IF NOT EXISTS "Treasury".bank_transactions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL,
    bank_account_id bigint NOT NULL,
    idempotency_key text NOT NULL CHECK (btrim(idempotency_key) <> ''),
    operation text NOT NULL CHECK (operation IN ('create', 'reverse')),
    document_id bigint REFERENCES "Ecosystem".documents(id),
    origin jsonb NOT NULL DEFAULT '{}'::jsonb,
    context jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by bigint REFERENCES "Ecosystem".users(user_id),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, bank_account_id) REFERENCES "Treasury".bank_accounts (company_id, id),
    UNIQUE (company_id, id),
    UNIQUE (company_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS bank_transactions_account_created_idx
    ON "Treasury".bank_transactions (company_id, bank_account_id, created_at);
CREATE INDEX IF NOT EXISTS bank_transactions_document_idx
    ON "Treasury".bank_transactions (document_id) WHERE document_id IS NOT NULL;

-- Compartida por bank_transactions, bank_transaction_details y bank_audit (append-only).
CREATE OR REPLACE FUNCTION "Treasury".bank_forbid_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '% es append-only: no se permite % (use operation reverse)', TG_TABLE_NAME, TG_OP;
END;
$$;

CREATE OR REPLACE TRIGGER bank_transactions_append_only
    BEFORE UPDATE OR DELETE ON "Treasury".bank_transactions
    FOR EACH ROW EXECUTE FUNCTION "Treasury".bank_forbid_mutation();

INSERT INTO public.schema_migrations(filename) VALUES ('0035_create_bank_transactions.sql') ON CONFLICT DO NOTHING;
