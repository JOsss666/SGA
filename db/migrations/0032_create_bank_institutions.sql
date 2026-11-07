-- Migration: 0032_create_bank_institutions
-- Fecha:     2026-10-27
-- Etapa:     TBANK 1.1 (feature-TreasuryBanks, Etapa 1 BD)
-- Regla:     solo aditiva — crea una tabla nueva; no toca tablas existentes
-- Rollback:  0032_create_bank_institutions.rollback.sql
-- Decisión D4: catálogo mixto (erp_global administrado por el ERP, company_private por empresa).
CREATE TABLE IF NOT EXISTS "Treasury".bank_institutions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scope text NOT NULL DEFAULT 'erp_global' CHECK (scope IN ('erp_global', 'company_private')),
    company_id bigint REFERENCES "Ecosystem".companies(company_id),
    code text NOT NULL CHECK (btrim(code) <> ''),
    name text NOT NULL CHECK (btrim(name) <> ''),
    country_code text,
    parametrization jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((scope = 'erp_global' AND company_id IS NULL)
        OR (scope = 'company_private' AND company_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS bank_institutions_global_code_idx
    ON "Treasury".bank_institutions (lower(code)) WHERE scope = 'erp_global';
CREATE UNIQUE INDEX IF NOT EXISTS bank_institutions_private_code_idx
    ON "Treasury".bank_institutions (company_id, lower(code)) WHERE scope = 'company_private';

INSERT INTO public.schema_migrations(filename) VALUES ('0032_create_bank_institutions.sql') ON CONFLICT DO NOTHING;
