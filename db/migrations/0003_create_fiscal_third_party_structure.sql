-- Migration: 0003_create_fiscal_third_party_structure
-- Fecha:     2026-07-08
-- Etapa:     1 — estructura flexible del tercero (sin uso por la app todavía)
-- Regla:     solo aditiva. FKs hacia "Ecosystem" usan ON DELETE CASCADE en
--            third_party_id para NO romper el endpoint deleteThirdParty actual.
-- Rollback:  DROP TABLE en orden inverso (blocks, documents, roles, relations)

-- ── Relación tercero ↔ compañía (ancla del modelo nuevo) ─────────────────
CREATE TABLE IF NOT EXISTS "Fiscal".third_party_company_relations (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    third_party_id bigint      NOT NULL REFERENCES "Ecosystem".thirdparties(id) ON DELETE CASCADE,
    company_id     bigint      NOT NULL REFERENCES "Ecosystem".companies(company_id),
    status         varchar(20) NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','disabled','blocked','reported','pending','cancelled')),
    started_at     timestamptz NOT NULL DEFAULT now(),
    ended_at       timestamptz,
    notes          text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_tp_company_relation UNIQUE (third_party_id, company_id)
);
CREATE INDEX IF NOT EXISTS idx_tpcr_company ON "Fiscal".third_party_company_relations (company_id);

-- ── Roles del tercero en la relación (client, supplier, …; 'both' → 2 filas) ──
CREATE TABLE IF NOT EXISTS "Fiscal".third_party_roles (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    relation_id bigint      NOT NULL REFERENCES "Fiscal".third_party_company_relations(id) ON DELETE CASCADE,
    role        varchar(30) NOT NULL
                CHECK (role IN ('client','supplier','employee','contractor','partner','other')),
    active      boolean     NOT NULL DEFAULT true,
    started_at  timestamptz NOT NULL DEFAULT now(),
    ended_at    timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_tp_role UNIQUE (relation_id, role)
);

-- ── Documentos soporte del tercero (RUT, cámara de comercio, …) ──────────
CREATE TABLE IF NOT EXISTS "Fiscal".third_party_documents (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    relation_id      bigint        NOT NULL REFERENCES "Fiscal".third_party_company_relations(id) ON DELETE CASCADE,
    document_type_id bigint        NOT NULL REFERENCES "Fiscal".document_types(id),
    file_url         varchar(2000) NOT NULL,
    issued_at        date,
    expires_at       date,
    status           varchar(20)   NOT NULL DEFAULT 'valid'
                     CHECK (status IN ('valid','expired','pending','rejected')),
    notes            text,
    uploaded_by      varchar(200),
    created_at       timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tpd_relation ON "Fiscal".third_party_documents (relation_id);
CREATE INDEX IF NOT EXISTS idx_tpd_expires ON "Fiscal".third_party_documents (expires_at) WHERE expires_at IS NOT NULL;

-- ── Bloqueos del tercero (manuales o automáticos) ────────────────────────
CREATE TABLE IF NOT EXISTS "Fiscal".third_party_blocks (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    relation_id bigint      NOT NULL REFERENCES "Fiscal".third_party_company_relations(id) ON DELETE CASCADE,
    block_type  varchar(30) NOT NULL DEFAULT 'manual'
                CHECK (block_type IN ('manual','document_expired','fiscal','commercial','other')),
    reason      text        NOT NULL,
    blocked_by  varchar(200),
    starts_at   timestamptz NOT NULL DEFAULT now(),
    ends_at     timestamptz,
    released_at timestamptz,
    released_by varchar(200),
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tpb_relation_active ON "Fiscal".third_party_blocks (relation_id) WHERE released_at IS NULL;

INSERT INTO public.schema_migrations (filename)
VALUES ('0003_create_fiscal_third_party_structure.sql')
ON CONFLICT (filename) DO NOTHING;
