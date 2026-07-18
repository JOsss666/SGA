-- Migration: 0005_create_fiscal_audit_events
-- Fecha:     2026-07-08
-- Etapa:     1 — auditoría del modelo nuevo
-- Regla:     solo aditiva. Sin FKs duras: la auditoría nunca debe bloquear
--            una operación de negocio ni impedir borrados legacy.
-- Rollback:  DROP TABLE "Fiscal".audit_events;

CREATE TABLE IF NOT EXISTS "Fiscal".audit_events (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id    bigint,
    event_type    varchar(100) NOT NULL,  -- p.ej. 'third_party.created', 'tax_classification.changed', 'third_party.blocked', 'retention_override.created'
    entity_schema varchar(60),
    entity_table  varchar(100),
    entity_id     bigint,
    payload       jsonb,                  -- snapshot de datos relevantes del evento
    performed_by  varchar(200),
    performed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON "Fiscal".audit_events (entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON "Fiscal".audit_events (company_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_type    ON "Fiscal".audit_events (event_type, performed_at DESC);

INSERT INTO public.schema_migrations (filename)
VALUES ('0005_create_fiscal_audit_events.sql')
ON CONFLICT (filename) DO NOTHING;
