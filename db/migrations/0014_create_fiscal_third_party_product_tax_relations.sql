-- Migration: 0014_create_fiscal_third_party_product_tax_relations
-- Fecha:     2026-07-09
-- Motivo:    Relacionar compañía + tercero + producto/servicio + contexto
--            de operación con impuestos/retenciones efectivamente aplicables.
--            Esta tabla es más específica que product_tax_relations, que solo
--            guarda opciones default/candidatas del producto.
-- Rollback:  DROP TABLE "Fiscal".third_party_product_tax_relations;
--            DROP TYPE "Fiscal".third_party_product_tax_role;
--            DROP TYPE "Fiscal".third_party_product_tax_operation;

DO $$
BEGIN
    CREATE TYPE "Fiscal".third_party_product_tax_operation AS ENUM (
        'purchase',
        'sell'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "Fiscal".third_party_product_tax_role AS ENUM (
        'tax',
        'withholding'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Fiscal".third_party_product_tax_relations (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id     bigint      NOT NULL REFERENCES "Ecosystem".companies(company_id),
    third_party_id bigint      NOT NULL REFERENCES "Ecosystem".thirdparties(id) ON DELETE CASCADE,
    product_id     bigint      NOT NULL REFERENCES "Inventory"."products&services"(id) ON DELETE CASCADE,
    tax_id         bigint      NOT NULL REFERENCES "Ecosystem".taxes(id),
    operation_type "Fiscal".third_party_product_tax_operation NOT NULL,
    tax_role       "Fiscal".third_party_product_tax_role NOT NULL,
    is_active      boolean     NOT NULL DEFAULT true,
    priority       integer     NOT NULL DEFAULT 0,
    valid_from     date,
    valid_until    date,
    notes          text,
    created_by     varchar(200),
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_third_party_product_tax_relation
        UNIQUE (company_id, third_party_id, product_id, tax_id, operation_type, tax_role),
    CONSTRAINT chk_tpptr_dates
        CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);

CREATE INDEX IF NOT EXISTS idx_tpptr_company_third_party
    ON "Fiscal".third_party_product_tax_relations (company_id, third_party_id);

CREATE INDEX IF NOT EXISTS idx_tpptr_company_product
    ON "Fiscal".third_party_product_tax_relations (company_id, product_id);

CREATE INDEX IF NOT EXISTS idx_tpptr_lookup_active
    ON "Fiscal".third_party_product_tax_relations
        (company_id, third_party_id, product_id, operation_type, tax_role)
    WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_tpptr_tax_active
    ON "Fiscal".third_party_product_tax_relations (tax_id, operation_type, tax_role)
    WHERE is_active;

COMMENT ON TABLE "Fiscal".third_party_product_tax_relations IS
    'Impuestos y retenciones aplicables por tercero, producto/servicio y contexto de compra/venta.';

COMMENT ON COLUMN "Fiscal".third_party_product_tax_relations.operation_type IS
    'Contexto de operación del documento: purchase o sell.';

COMMENT ON COLUMN "Fiscal".third_party_product_tax_relations.tax_role IS
    'Rol de la relación: tax para impuesto normal, withholding para retención.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0014_create_fiscal_third_party_product_tax_relations.sql')
ON CONFLICT (filename) DO NOTHING;
