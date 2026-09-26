-- Migration: 0029_customer_advances
-- Fecha: 2026-09-26
-- Aditiva: anticipos recibidos y aplicaciones, sin modificar saldos históricos.
-- Aplicar con psql --single-transaction después de verificar el respaldo.
-- Rollback seguro: volver al código anterior conservando estas tablas y columnas.
CREATE TABLE IF NOT EXISTS "Treasury".customer_advances (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL REFERENCES "Ecosystem".companies(company_id),
    "thirdParty_id" bigint NOT NULL REFERENCES "Ecosystem".thirdparties(id),
    document_id bigint NOT NULL REFERENCES "Ecosystem".documents(id),
    transaction_id bigint NOT NULL REFERENCES "Ecosystem".transactions(id),
    concept_id bigint NOT NULL REFERENCES "Ecosystem".concepts(id),
    account_id bigint NOT NULL REFERENCES "Ecosystem".contable_accounts(id),
    currency text NOT NULL,
    total numeric(18,6) NOT NULL CHECK (total > 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, document_id),
    UNIQUE (company_id, "thirdParty_id", id)
);
CREATE TABLE IF NOT EXISTS "Treasury".advance_applications (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL,
    "thirdParty_id" bigint NOT NULL,
    advance_id bigint NOT NULL,
    document_id bigint NOT NULL REFERENCES "Ecosystem".documents(id),
    transaction_detail_id bigint NOT NULL REFERENCES "Ecosystem".transaction_detail(id),
    amount numeric(18,6) NOT NULL CHECK (amount > 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, "thirdParty_id", advance_id)
        REFERENCES "Treasury".customer_advances(company_id, "thirdParty_id", id),
    UNIQUE (advance_id, transaction_detail_id)
);
CREATE INDEX IF NOT EXISTS customer_advances_available_idx
    ON "Treasury".customer_advances(company_id, "thirdParty_id", account_id, currency, id);
CREATE INDEX IF NOT EXISTS advance_applications_document_idx
    ON "Treasury".advance_applications(company_id, document_id);
ALTER TABLE "Ecosystem".documents ADD COLUMN IF NOT EXISTS treasury_request_key text;
ALTER TABLE "Ecosystem".documents ADD COLUMN IF NOT EXISTS treasury_request_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS documents_treasury_request_key_idx
    ON "Ecosystem".documents(company_id, document_type, treasury_request_key)
    WHERE treasury_request_key IS NOT NULL;
INSERT INTO public.schema_migrations(filename) VALUES ('0029_customer_advances.sql') ON CONFLICT DO NOTHING;
