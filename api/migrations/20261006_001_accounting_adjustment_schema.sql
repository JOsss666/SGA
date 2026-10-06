-- Migración aditiva para habilitar el documento de ajuste contable.
-- Cambios puramente aditivos y no destructivos: no modifica, renombra ni
-- elimina objetos ni datos existentes.
--
-- IMPORTANTE: en PostgreSQL `ALTER TYPE ... ADD VALUE` no puede ejecutarse
-- dentro de un bloque de transacción. Por eso los dos ALTER TYPE van sueltos
-- (autocommit) y SOLO la creación de la tabla va dentro de una transacción.
--
-- Los enums viven en el esquema `public` (verificado en producción), aunque
-- las tablas que los usan están en `Ecosystem`:
--   "Ecosystem".documents.document_type      -> public.document_types
--   "Ecosystem".transactions.doc_type         -> public.document_types
--   "Ecosystem".transaction_detail.type       -> public.transaction_detail_type

-- 1) Nuevo tipo de documento usado por documents.document_type y transactions.doc_type.
ALTER TYPE public.document_types ADD VALUE IF NOT EXISTS 'Accounting Adjustment';

-- 2) Nuevo tipo de renglón usado por transaction_detail.type.
ALTER TYPE public.transaction_detail_type ADD VALUE IF NOT EXISTS 'accountingAdjustment';

-- 3) Tabla para las plantillas recurrentes de comprobantes.
--    Las columnas y la restricción UNIQUE (company_id, name) se derivan de lo
--    que accountingAdjustmentController.js ya consulta e inserta (ON CONFLICT).
BEGIN;
CREATE TABLE IF NOT EXISTS "Ecosystem".accounting_adjustment_templates (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id  bigint       NOT NULL,
    name        varchar(120) NOT NULL,
    lines       jsonb        NOT NULL,
    description text         NOT NULL DEFAULT '',
    created_by  bigint,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    updated_at  timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT accounting_adjustment_templates_company_name_key UNIQUE (company_id, name)
);
COMMIT;
