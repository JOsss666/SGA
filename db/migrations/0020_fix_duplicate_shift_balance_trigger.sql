-- Migration: 0020_fix_duplicate_shift_balance_trigger
-- Fecha:     2026-08-15
-- Etapa:     (bug fix — informe de cierre de caja, fuera del refactor de terceros)
-- Regla:     NO aditiva — elimina un trigger redundante y corrige datos históricos.
--            Justificación: sobre "Facturation".shift_settlement_details existían DOS
--            triggers AFTER INSERT idénticos (fn_update_shift_balance y
--            fn_update_cashbox_balance), ambos ejecutando el mismo
--            "expectedBalance += (DB? +total : -total)". Por eso cada movimiento se
--            contaba dos veces y register_shifts."expectedBalance" quedaba al doble.
-- Rollback:  db/migrations/0020_fix_duplicate_shift_balance_trigger.rollback.sql

BEGIN;

-- 1. Eliminar el trigger duplicado. Se conserva trg_after_insert_settlement_detail
--    (fn_update_shift_balance, correctamente nombrada) y se elimina el redundante
--    trg_actualizar_balance_automatico (fn_update_cashbox_balance, mal nombrada:
--    a pesar del nombre NO toca ninguna cash box, solo duplicaba el update del turno).
DROP TRIGGER IF EXISTS trg_actualizar_balance_automatico
    ON "Facturation".shift_settlement_details;

-- Nota: la función "Facturation".fn_update_cashbox_balance() se deja intacta (sin DROP)
-- por si se decide reutilizarla luego para actualizar el saldo real de la caja física.
-- Al no tener trigger asociado, ya no se ejecuta.

-- 2. Corrección de datos históricos: recalcular expectedBalance desde el origen
--    (initialBalance + neto real de movimientos), idempotente y self-healing.
--    Se recalcula desde source en vez de dividir entre 2 para evitar arrastrar el
--    error de redondeo del tipo real/float4 acumulado por el doble conteo.
UPDATE "Facturation".register_shifts rs
SET "expectedBalance" = rs."initialBalance" + COALESCE((
        SELECT SUM(CASE WHEN td.nature = 'DB' THEN td.total ELSE -td.total END)
        FROM "Facturation".shift_settlement_details ssd
        JOIN "Ecosystem".transaction_detail td
          ON ssd."transactionDetail_id" = td.id
        WHERE ssd.shift_id = rs.id
    ), 0);

INSERT INTO public.schema_migrations (filename)
VALUES ('0020_fix_duplicate_shift_balance_trigger.sql')
ON CONFLICT DO NOTHING;

COMMIT;
