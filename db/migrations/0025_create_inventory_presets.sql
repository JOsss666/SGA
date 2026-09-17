-- Migration: 0025_create_inventory_presets
-- Fecha:     2026-09-13
-- Motivo:    agrupaciones reutilizables de productos para órdenes de cliente.
-- Regla:     aditiva; no modifica productos ni documentos existentes.
-- Aplicación: con respaldo previo. El archivo incluye su transacción.
-- Rollback:  0025_create_inventory_presets.rollback.sql (solo sin datos).

BEGIN;

CREATE TABLE IF NOT EXISTS "Inventory".presets (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id bigint NOT NULL REFERENCES "Ecosystem".companies(company_id) ON DELETE RESTRICT,
    name text NOT NULL CHECK (btrim(name) <> ''),
    description text NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS inventory_presets_company
    ON "Inventory".presets (company_id, is_active);

CREATE TABLE IF NOT EXISTS "Inventory"."presetsProductRelations" (
    product_id bigint NOT NULL REFERENCES "Inventory"."products&services"(id) ON DELETE RESTRICT,
    preset_id bigint NOT NULL REFERENCES "Inventory".presets(id) ON DELETE CASCADE,
    units numeric(18,6) NOT NULL,
    PRIMARY KEY (preset_id, product_id),
    CONSTRAINT inventory_preset_units_positive CHECK (units > 0 AND units < 'Infinity'::numeric)
);

CREATE INDEX IF NOT EXISTS inventory_preset_relations_product
    ON "Inventory"."presetsProductRelations" (product_id);

-- La compañía se obtiene del preset sin añadir columnas a la relación.
CREATE OR REPLACE FUNCTION "Inventory".validate_preset_product_company()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    preset_company bigint;
    product_company bigint;
BEGIN
    SELECT company_id INTO preset_company
    FROM "Inventory".presets WHERE id = NEW.preset_id FOR SHARE;
    SELECT company_id INTO product_company
    FROM "Inventory"."products&services" WHERE id = NEW.product_id FOR SHARE;

    IF preset_company IS NULL OR product_company IS NULL THEN
        RAISE EXCEPTION 'El preset y el producto deben existir y pertenecer a una compañía.'
            USING ERRCODE = '23503';
    END IF;
    IF preset_company <> product_company THEN
        RAISE EXCEPTION 'El producto debe pertenecer a la misma compañía del preset.'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgrelid = '"Inventory"."presetsProductRelations"'::regclass
            AND tgname = 'validate_preset_product_company'
            AND NOT tgisinternal
    ) THEN
        CREATE TRIGGER validate_preset_product_company
        BEFORE INSERT OR UPDATE ON "Inventory"."presetsProductRelations"
        FOR EACH ROW EXECUTE FUNCTION "Inventory".validate_preset_product_company();
    END IF;
END;
$$;

COMMENT ON TABLE "Inventory".presets IS
    'Agrupaciones de productos por compañía; no representan movimientos de inventario.';
COMMENT ON TABLE "Inventory"."presetsProductRelations" IS
    'Productos y cantidades por una unidad de preset; un producto aparece una sola vez en cada preset.';
COMMENT ON COLUMN "Inventory"."presetsProductRelations".units IS
    'Cantidad positiva del producto en el preset, admite hasta seis decimales.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0025_create_inventory_presets.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
