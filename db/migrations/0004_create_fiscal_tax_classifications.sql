-- Migration: 0004_create_fiscal_tax_classifications
-- Fecha:     2026-07-08
-- Etapa:     1 — estructura fiscal versionada (historia por INSERT, nunca UPDATE)
-- Regla:     solo aditiva
-- Rollback:  DROP TABLE en orden inverso (overrides, profiles, company_tc, third_party_tc)

-- ── Clasificación fiscal del tercero, VERSIONADA ──────────────────────────
--    El perfil vigente = última classification_date por (relation, type).
--    Cambios fiscales = INSERT nuevo, jamás UPDATE (auditabilidad).
CREATE TABLE IF NOT EXISTS "Fiscal".third_party_tax_classifications (
    id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    relation_id            bigint      NOT NULL REFERENCES "Fiscal".third_party_company_relations(id) ON DELETE CASCADE,
    classification_type_id bigint      NOT NULL REFERENCES "Fiscal".tax_classification_types(id),
    classification_value_id bigint     NOT NULL REFERENCES "Fiscal".tax_classification_values(id),
    classification_date    date        NOT NULL,   -- vigente-desde (fecha RUT o histórica)
    valid_until            date,                    -- NULL = vigente
    source                 varchar(30) NOT NULL DEFAULT 'manual'
                           CHECK (source IN ('migration','manual','rut','override','system')),
    document_id            bigint      REFERENCES "Fiscal".third_party_documents(id), -- soporte (RUT…)
    notes                  text,
    created_by             varchar(200),
    created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tptc_current
    ON "Fiscal".third_party_tax_classifications (relation_id, classification_type_id, classification_date DESC);

-- ── Clasificación fiscal de la COMPAÑÍA (también versionada) ─────────────
CREATE TABLE IF NOT EXISTS "Fiscal".company_tax_classifications (
    id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id             bigint      NOT NULL REFERENCES "Ecosystem".companies(company_id),
    classification_type_id bigint      NOT NULL REFERENCES "Fiscal".tax_classification_types(id),
    classification_value_id bigint     NOT NULL REFERENCES "Fiscal".tax_classification_values(id),
    classification_date    date        NOT NULL,
    valid_until            date,
    notes                  text,
    created_by             varchar(200),
    created_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ctc_current
    ON "Fiscal".company_tax_classifications (company_id, classification_type_id, classification_date DESC);

-- ── Perfil tributario de la compañía por jurisdicción (p.ej. ICA por municipio) ──
CREATE TABLE IF NOT EXISTS "Fiscal".company_jurisdiction_tax_profiles (
    id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id         bigint        NOT NULL REFERENCES "Ecosystem".companies(company_id),
    jurisdiction_id    bigint        NOT NULL REFERENCES "Fiscal".jurisdictions(id),
    tax_id             bigint        NOT NULL REFERENCES "Fiscal".taxes(id),
    is_subject         boolean       NOT NULL DEFAULT true,   -- ¿la compañía es sujeto del impuesto ahí?
    is_retention_agent boolean       NOT NULL DEFAULT false,  -- ¿actúa como agente retenedor ahí?
    rate               numeric(9,4),                          -- tarifa aplicable si corresponde (p.ej. ICA x1000)
    valid_from         date          NOT NULL,
    valid_until        date,
    notes              text,
    created_at         timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT uq_cjtp UNIQUE (company_id, jurisdiction_id, tax_id, valid_from)
);

-- ── Overrides de retención (exclusiones/tarifas especiales, auditables) ───
--    Se consumen en Etapa 8; el override aplica solo si la regla técnica
--    determinó primero que la retención procede.
CREATE TABLE IF NOT EXISTS "Fiscal".tax_retention_overrides (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id    bigint       NOT NULL REFERENCES "Ecosystem".companies(company_id),
    relation_id   bigint       REFERENCES "Fiscal".third_party_company_relations(id) ON DELETE CASCADE, -- NULL = todos los terceros
    tax_id        bigint       NOT NULL REFERENCES "Fiscal".taxes(id),
    override_type varchar(30)  NOT NULL CHECK (override_type IN ('exempt','custom_rate','force_apply')),
    custom_rate   numeric(9,4),          -- requerido si override_type = 'custom_rate'
    context       varchar(30)  NOT NULL DEFAULT 'all' CHECK (context IN ('purchase','sale','all')),
    reason        text         NOT NULL,
    authorized_by varchar(200) NOT NULL,
    valid_from    date         NOT NULL,
    valid_until   date,
    active        boolean      NOT NULL DEFAULT true,
    created_by    varchar(200),
    created_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chk_custom_rate CHECK (override_type <> 'custom_rate' OR custom_rate IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_tro_active
    ON "Fiscal".tax_retention_overrides (company_id, tax_id) WHERE active;

INSERT INTO public.schema_migrations (filename)
VALUES ('0004_create_fiscal_tax_classifications.sql')
ON CONFLICT (filename) DO NOTHING;
