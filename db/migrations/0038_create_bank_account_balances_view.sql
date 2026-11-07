-- Migration: 0038_create_bank_account_balances_view
-- Fecha:     2026-10-27
-- Etapa:     TBANK 1.7 (feature-TreasuryBanks, Etapa 1 BD)
-- Regla:     solo aditiva — crea una vista (no materializada, sin triggers)
-- Rollback:  0038_create_bank_account_balances_view.rollback.sql
-- Saldo derivado por (cuenta, moneda). Los reverse netean solos al tener dirección opuesta.
CREATE OR REPLACE VIEW "Treasury".bank_account_balances AS
SELECT
    t.company_id,
    t.bank_account_id,
    d.currency,
    COALESCE(SUM(d.amount) FILTER (WHERE d.direction = 'in'), 0)  AS total_in,
    COALESCE(SUM(d.amount) FILTER (WHERE d.direction = 'out'), 0) AS total_out,
    COALESCE(SUM(CASE d.direction WHEN 'in' THEN d.amount ELSE -d.amount END), 0) AS balance,
    COUNT(*) AS detail_count,
    MAX(t.created_at) AS last_movement_at
FROM "Treasury".bank_transaction_details d
JOIN "Treasury".bank_transactions t
  ON t.company_id = d.company_id AND t.id = d.transaction_id
GROUP BY t.company_id, t.bank_account_id, d.currency;

INSERT INTO public.schema_migrations(filename) VALUES ('0038_create_bank_account_balances_view.sql') ON CONFLICT DO NOTHING;
