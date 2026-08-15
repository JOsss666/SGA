-- Rollback: 0020_fix_duplicate_shift_balance_trigger
-- Fecha:     2026-08-15
-- Restaura el segundo trigger duplicado sobre shift_settlement_details.
-- ADVERTENCIA: re-aplicar esto vuelve a duplicar expectedBalance en cada INSERT.
-- La corrección de datos históricos NO se revierte (no tiene sentido re-doblar los
-- valores); si se re-aplica el trigger, los turnos futuros volverán a quedar al doble.

BEGIN;

CREATE TRIGGER trg_actualizar_balance_automatico
    AFTER INSERT ON "Facturation".shift_settlement_details
    FOR EACH ROW
    EXECUTE FUNCTION "Facturation".fn_update_cashbox_balance();

DELETE FROM public.schema_migrations
WHERE filename = '0020_fix_duplicate_shift_balance_trigger.sql';

COMMIT;
