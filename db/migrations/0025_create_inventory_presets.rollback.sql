-- Retira únicamente una instalación sin presets ni relaciones.
-- Requiere respaldo previo; nunca usar CASCADE para forzar este rollback.
BEGIN;

LOCK TABLE "Inventory".presets, "Inventory"."presetsProductRelations" IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Inventory".presets)
        OR EXISTS (SELECT 1 FROM "Inventory"."presetsProductRelations") THEN
        RAISE EXCEPTION 'No se puede retirar la migración: existen presets o relaciones registrados.';
    END IF;
END;
$$;

DROP TABLE "Inventory"."presetsProductRelations";
DROP FUNCTION "Inventory".validate_preset_product_company();
DROP TABLE "Inventory".presets;

DELETE FROM public.schema_migrations
WHERE filename = '0025_create_inventory_presets.sql';

COMMIT;
