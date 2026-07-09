-- Migration: 0013_create_fiscal_product_tax_relations
-- Fecha:     2026-07-09
-- Motivo:    Relacionar productos/servicios con impuestos y retenciones
--            candidatas para compra y venta, sin fijar la decisión final
--            de retención (depende de tercero + compañía + producto).
-- Rollback:  DROP TABLE "Fiscal".product_tax_relations;
--            DROP TYPE "Fiscal".product_tax_relation_type;

DO $$
BEGIN
    CREATE TYPE "Fiscal".product_tax_relation_type AS ENUM (
        'purchase_tax',
        'purchase_withholding',
        'sell_tax',
        'sell_withholding'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Fiscal".product_tax_relations (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id  bigint      NOT NULL REFERENCES "Ecosystem".companies(company_id),
    product_id  bigint      NOT NULL REFERENCES "Inventory"."products&services"(id) ON DELETE CASCADE,
    tax_id      bigint      NOT NULL REFERENCES "Ecosystem".taxes(id),
    type        "Fiscal".product_tax_relation_type NOT NULL,
    is_active   boolean     NOT NULL DEFAULT true,
    priority    integer     NOT NULL DEFAULT 0,
    valid_from  date,
    valid_until date,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_tax_relation UNIQUE (company_id, product_id, tax_id, type),
    CONSTRAINT chk_product_tax_relation_dates CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);

CREATE INDEX IF NOT EXISTS idx_ptr_company_product
    ON "Fiscal".product_tax_relations (company_id, product_id);

CREATE INDEX IF NOT EXISTS idx_ptr_tax_type_active
    ON "Fiscal".product_tax_relations (tax_id, type)
    WHERE is_active;

CREATE INDEX IF NOT EXISTS idx_ptr_product_type_active
    ON "Fiscal".product_tax_relations (company_id, product_id, type)
    WHERE is_active;

COMMENT ON TABLE "Fiscal".product_tax_relations IS
    'Impuestos y retenciones candidatas asociadas a productos/servicios por contexto de compra/venta.';

COMMENT ON COLUMN "Fiscal".product_tax_relations.type IS
    'Rol de la relación: purchase_tax, purchase_withholding, sell_tax o sell_withholding.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0013_create_fiscal_product_tax_relations.sql')
ON CONFLICT (filename) DO NOTHING;
