-- Migration: 0033_create_banks
-- Fecha:     2026-10-27
-- Etapa:     TBANK 1.2 (feature-TreasuryBanks, Etapa 1 BD)
-- Regla:     solo aditiva — crea tabla y función nuevas
-- Rollback:  0033_create_banks.rollback.sql
-- El banco agrupa cuentas; NO apunta a una cuenta contable (el puente vive en bank_accounts).
CREATE TABLE IF NOT EXISTS "Treasury".banks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL REFERENCES "Ecosystem".companies(company_id),
    institution_id bigint NOT NULL REFERENCES "Treasury".bank_institutions(id),
    name text NOT NULL CHECK (btrim(name) <> ''),
    defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, id),
    UNIQUE (company_id, institution_id, name)
);
CREATE INDEX IF NOT EXISTS banks_institution_idx ON "Treasury".banks (institution_id);

CREATE OR REPLACE FUNCTION "Treasury".validate_bank_institution_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    inst_company bigint;
BEGIN
    SELECT company_id INTO inst_company FROM "Treasury".bank_institutions WHERE id = NEW.institution_id;
    IF inst_company IS NOT NULL AND inst_company <> NEW.company_id THEN
        RAISE EXCEPTION 'La institución bancaria % pertenece a otra empresa', NEW.institution_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER banks_validate_institution
    BEFORE INSERT OR UPDATE OF institution_id, company_id ON "Treasury".banks
    FOR EACH ROW EXECUTE FUNCTION "Treasury".validate_bank_institution_scope();

INSERT INTO public.schema_migrations(filename) VALUES ('0033_create_banks.sql') ON CONFLICT DO NOTHING;
