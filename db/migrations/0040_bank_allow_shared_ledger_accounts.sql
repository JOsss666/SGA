-- Migration: 0040_bank_allow_shared_ledger_accounts
-- Fecha:     2026-11-20
-- Etapa:     TBANK (feature-TreasuryBanks) — plan contable compartido
-- Regla:     no crea ni borra tablas ni datos; solo REEMPLAZA el cuerpo de dos funciones de trigger
--            para ampliar una validación (no cambia columnas, índices ni triggers)
-- Rollback:  0040_bank_allow_shared_ledger_accounts.rollback.sql (restaura las funciones originales de 0034 y 0036)
-- La cuenta contable de una cuenta bancaria o de un detalle puede ser de la propia empresa
-- (company_id = NEW.company_id) o del plan contable compartido (company_id = 0).
-- Sigue exigiendo que la cuenta exista.
BEGIN;

CREATE OR REPLACE FUNCTION "Treasury".validate_bank_account_ledger()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    acc_company bigint;
BEGIN
    SELECT company_id INTO acc_company FROM "Ecosystem".contable_accounts WHERE id = NEW.account_id;
    IF acc_company IS NULL OR acc_company NOT IN (0, NEW.company_id) THEN
        RAISE EXCEPTION 'La cuenta contable % no pertenece a la empresa % ni al plan contable compartido', NEW.account_id, NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "Treasury".validate_bank_detail()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    op text;
    orig "Treasury".bank_transaction_details%ROWTYPE;
BEGIN
    SELECT operation INTO op FROM "Treasury".bank_transactions
    WHERE company_id = NEW.company_id AND id = NEW.transaction_id;
    IF (op = 'reverse') <> (NEW.reverses_detail_id IS NOT NULL) THEN
        RAISE EXCEPTION 'reverses_detail_id es obligatorio si y solo si la operación es reverse';
    END IF;
    IF NEW.account_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM "Ecosystem".contable_accounts
        WHERE id = NEW.account_id AND company_id IN (0, NEW.company_id)
    ) THEN
        RAISE EXCEPTION 'La cuenta contable % no pertenece a la empresa % ni al plan contable compartido', NEW.account_id, NEW.company_id;
    END IF;
    IF NEW.reverses_detail_id IS NOT NULL THEN
        SELECT * INTO orig FROM "Treasury".bank_transaction_details
        WHERE company_id = NEW.company_id AND id = NEW.reverses_detail_id;
        IF orig.currency <> NEW.currency OR orig.amount <> NEW.amount OR orig.direction = NEW.direction THEN
            RAISE EXCEPTION 'El reverse debe tener misma moneda y monto, y dirección opuesta al detalle %', orig.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

INSERT INTO public.schema_migrations(filename) VALUES ('0040_bank_allow_shared_ledger_accounts.sql') ON CONFLICT DO NOTHING;

COMMIT;
