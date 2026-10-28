-- Migration: 0034_create_bank_accounts
-- Fecha:     2026-10-27
-- Etapa:     TBANK 1.3 (feature-TreasuryBanks, Etapa 1 BD)
-- Regla:     solo aditiva — crea tabla y función nuevas
-- Rollback:  0034_create_bank_accounts.rollback.sql
-- account_id es el puente contable: "Ecosystem".contable_accounts(id) (S1 verificado en la DB viva).
-- Parametrización: currency_policy {allowed_currencies, primary_currency}; overrides hereda de banks.defaults.
CREATE TABLE IF NOT EXISTS "Treasury".bank_accounts (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL,
    bank_id bigint NOT NULL,
    account_number text NOT NULL CHECK (btrim(account_number) <> ''),
    account_id bigint NOT NULL REFERENCES "Ecosystem".contable_accounts(id),
    currency_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
    overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, bank_id) REFERENCES "Treasury".banks (company_id, id),
    UNIQUE (company_id, id),
    UNIQUE (company_id, bank_id, account_number)
);
CREATE INDEX IF NOT EXISTS bank_accounts_account_idx ON "Treasury".bank_accounts (account_id);

CREATE OR REPLACE FUNCTION "Treasury".validate_bank_account_ledger()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    acc_company bigint;
BEGIN
    SELECT company_id INTO acc_company FROM "Ecosystem".contable_accounts WHERE id = NEW.account_id;
    IF acc_company IS DISTINCT FROM NEW.company_id THEN
        RAISE EXCEPTION 'La cuenta contable % no pertenece a la empresa %', NEW.account_id, NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER bank_accounts_validate_ledger
    BEFORE INSERT OR UPDATE OF account_id, company_id ON "Treasury".bank_accounts
    FOR EACH ROW EXECUTE FUNCTION "Treasury".validate_bank_account_ledger();

INSERT INTO public.schema_migrations(filename) VALUES ('0034_create_bank_accounts.sql') ON CONFLICT DO NOTHING;
