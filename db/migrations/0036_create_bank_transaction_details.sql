-- Migration: 0036_create_bank_transaction_details
-- Fecha:     2026-10-27
-- Etapa:     TBANK 1.5 (feature-TreasuryBanks, Etapa 1 BD)
-- Regla:     solo aditiva — crea tabla y función nuevas
-- Rollback:  0036_create_bank_transaction_details.rollback.sql
-- La moneda vive en el detalle (saldo por moneda). Decisiones: D1 concept es texto abierto;
-- D2 account_id es contrapartida opcional (NULL = se resuelve con la cuenta bancaria).
-- Un reverse es un detalle nuevo de dirección opuesta, misma moneda y monto, que apunta a
-- reverses_detail_id; el índice único impide revertir dos veces el mismo detalle.
CREATE TABLE IF NOT EXISTS "Treasury".bank_transaction_details (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL,
    transaction_id bigint NOT NULL,
    currency text NOT NULL CHECK (btrim(currency) <> ''),
    amount numeric(18,6) NOT NULL CHECK (amount > 0),
    direction text NOT NULL CHECK (direction IN ('in', 'out')),
    concept text,
    account_id bigint REFERENCES "Ecosystem".contable_accounts(id),
    reverses_detail_id bigint,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id, transaction_id) REFERENCES "Treasury".bank_transactions (company_id, id),
    FOREIGN KEY (company_id, reverses_detail_id)
        REFERENCES "Treasury".bank_transaction_details (company_id, id),
    UNIQUE (company_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS bank_transaction_details_reverses_idx
    ON "Treasury".bank_transaction_details (reverses_detail_id) WHERE reverses_detail_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bank_transaction_details_transaction_idx
    ON "Treasury".bank_transaction_details (company_id, transaction_id);
CREATE INDEX IF NOT EXISTS bank_transaction_details_currency_idx
    ON "Treasury".bank_transaction_details (company_id, currency);

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

CREATE OR REPLACE TRIGGER bank_transaction_details_validate
    BEFORE INSERT ON "Treasury".bank_transaction_details
    FOR EACH ROW EXECUTE FUNCTION "Treasury".validate_bank_detail();
CREATE OR REPLACE TRIGGER bank_transaction_details_append_only
    BEFORE UPDATE OR DELETE ON "Treasury".bank_transaction_details
    FOR EACH ROW EXECUTE FUNCTION "Treasury".bank_forbid_mutation();

INSERT INTO public.schema_migrations(filename) VALUES ('0036_create_bank_transaction_details.sql') ON CONFLICT DO NOTHING;
