-- Migration: 0019_add_third_party_product_reference
-- Fecha:     2026-08-05
-- Regla:     aditiva e idempotente
-- Motivo:    guardar la referencia con la que un cliente/proveedor identifica un
--            producto y usarla al conciliar documentos con productos internos.
-- Rollback:  ALTER TABLE "Fiscal".third_party_product_tax_relations
--            DROP COLUMN third_party_reference;

ALTER TABLE "Fiscal".third_party_product_tax_relations
    ADD COLUMN IF NOT EXISTS third_party_reference text;

COMMENT ON COLUMN "Fiscal".third_party_product_tax_relations.third_party_reference IS
    'Nombre, código o referencia usada por el tercero para identificar el producto/servicio.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0019_add_third_party_product_reference.sql')
ON CONFLICT (filename) DO NOTHING;
