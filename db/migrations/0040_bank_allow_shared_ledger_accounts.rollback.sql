-- Restaura las funciones originales (0034 y 0036): la cuenta contable debe ser de la propia empresa.
-- Aviso: tras el rollback, las cuentas/detalles ya creados con cuentas del plan compartido (company_id = 0)
-- no se tocan (los triggers solo validan INSERT), pero no se podrán crear nuevos con ellas.
BEGIN;

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
        SELECT 1 FROM "Ecosystem".contable_accounts WHERE id = NEW.account_id AND company_id = NEW.company_id
    ) THEN
        RAISE EXCEPTION 'La cuenta contable % no pertenece a la empresa %', NEW.account_id, NEW.company_id;
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

DELETE FROM public.schema_migrations WHERE filename = '0040_bank_allow_shared_ledger_accounts.sql';

COMMIT;
