-- Migration: 0031_create_third_party_product_associations
-- Fecha:     2026-10-03
-- Regla:     aditiva, idempotente y transaccional
-- Motivo:    separar la asociación tercero-producto de sus impuestos y
--            retenciones, para conservar productos sin relaciones fiscales.
-- Rollback:  desplegar la versión anterior de la aplicación y dejar esta tabla
--            sin uso. No eliminarla automáticamente: conserva referencias y
--            asociaciones que no tienen equivalente en la tabla fiscal previa.

BEGIN;

CREATE TABLE IF NOT EXISTS "Fiscal".third_party_products (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id            bigint      NOT NULL REFERENCES "Ecosystem".companies(company_id),
    third_party_id        bigint      NOT NULL REFERENCES "Ecosystem".thirdparties(id) ON DELETE CASCADE,
    product_id            bigint      NOT NULL REFERENCES "Inventory"."products&services"(id) ON DELETE CASCADE,
    third_party_reference text,
    is_active             boolean     NOT NULL DEFAULT true,
    created_by            varchar(200),
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_third_party_product UNIQUE (company_id, third_party_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_third_party_products_active
    ON "Fiscal".third_party_products (company_id, third_party_id, is_active, product_id);

COMMENT ON TABLE "Fiscal".third_party_products IS
    'Productos asociados a terceros; independiente de que tengan impuestos o retenciones configurados.';

COMMENT ON COLUMN "Fiscal".third_party_products.third_party_reference IS
    'Nombre, código o referencia con que el tercero identifica el producto o servicio.';

-- Copia asociaciones ya representadas en la tabla de impuestos/retenciones.
-- La operación solo agrega filas y es reejecutable sin duplicarlas.
INSERT INTO "Fiscal".third_party_products
    (company_id, third_party_id, product_id, third_party_reference, is_active)
SELECT
    company_id,
    third_party_id,
    product_id,
    MAX(third_party_reference),
    BOOL_OR(is_active)
FROM "Fiscal".third_party_product_tax_relations
GROUP BY company_id, third_party_id, product_id
ON CONFLICT ON CONSTRAINT uq_third_party_product DO NOTHING;

INSERT INTO public.schema_migrations (filename)
VALUES ('0031_create_third_party_product_associations.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
