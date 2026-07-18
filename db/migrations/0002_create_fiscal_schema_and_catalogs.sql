-- Migration: 0002_create_fiscal_schema_and_catalogs
-- Fecha:     2026-07-08
-- Etapa:     1 — catálogos globales del modelo nuevo (sin uso por la app todavía)
-- Regla:     solo aditiva — el schema "Fiscal" es nuevo; no toca "Ecosystem"
-- Nota:      "Fiscal".taxes y "Fiscal".document_types NO colisionan con
--            "Ecosystem".taxes (tabla) ni con el enum document_types: son conceptos distintos.
-- Rollback:  DROP SCHEMA "Fiscal" CASCADE; (solo mientras nada lo consuma)

CREATE SCHEMA IF NOT EXISTS "Fiscal";

-- ── Países ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Fiscal".countries (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    iso_code_2  char(2)      NOT NULL UNIQUE,
    iso_code_3  char(3)      NOT NULL UNIQUE,
    name        varchar(200) NOT NULL,
    active      boolean      NOT NULL DEFAULT true,
    created_at  timestamptz  NOT NULL DEFAULT now()
);

-- ── Jurisdicciones (país → departamento → municipio) ─────────────────────
CREATE TABLE IF NOT EXISTS "Fiscal".jurisdictions (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    country_id    bigint       NOT NULL REFERENCES "Fiscal".countries(id),
    parent_id     bigint       REFERENCES "Fiscal".jurisdictions(id),
    level         varchar(30)  NOT NULL CHECK (level IN ('country','department','municipality','district')),
    code          varchar(30)  NOT NULL,           -- código oficial (DANE en Colombia)
    external_code varchar(30),                     -- código en sistemas externos (Factus municipality_id)
    name          varchar(200) NOT NULL,
    active        boolean      NOT NULL DEFAULT true,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_jurisdiction UNIQUE (country_id, level, code)
);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_external_code ON "Fiscal".jurisdictions (external_code);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_parent ON "Fiscal".jurisdictions (parent_id);

-- ── Autoridades fiscales (DIAN, secretarías de hacienda municipales…) ────
CREATE TABLE IF NOT EXISTS "Fiscal".tax_authorities (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    country_id      bigint       NOT NULL REFERENCES "Fiscal".countries(id),
    jurisdiction_id bigint       REFERENCES "Fiscal".jurisdictions(id), -- NULL = autoridad nacional
    code            varchar(50)  NOT NULL,
    name            varchar(300) NOT NULL,
    active          boolean      NOT NULL DEFAULT true,
    created_at      timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_tax_authority UNIQUE (country_id, code)
);

-- ── Impuestos base (RENTA, IVA, ICA…) — catálogo, NO "Ecosystem".taxes ───
CREATE TABLE IF NOT EXISTS "Fiscal".taxes (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tax_authority_id bigint       NOT NULL REFERENCES "Fiscal".tax_authorities(id),
    code             varchar(50)  NOT NULL,
    name             varchar(300) NOT NULL,
    scope            varchar(30)  NOT NULL DEFAULT 'national' CHECK (scope IN ('national','departmental','municipal')),
    description      text,
    active           boolean      NOT NULL DEFAULT true,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_fiscal_tax UNIQUE (tax_authority_id, code)
);

-- ── Tipos de clasificación fiscal (régimen, responsabilidad IVA, …) ──────
CREATE TABLE IF NOT EXISTS "Fiscal".tax_classification_types (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    country_id  bigint       NOT NULL REFERENCES "Fiscal".countries(id),
    code        varchar(60)  NOT NULL,
    name        varchar(300) NOT NULL,
    applies_to  varchar(20)  NOT NULL DEFAULT 'both' CHECK (applies_to IN ('third_party','company','both')),
    description text,
    active      boolean      NOT NULL DEFAULT true,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_classification_type UNIQUE (country_id, code)
);

-- ── Valores posibles de cada clasificación (datos, no columnas) ───────────
CREATE TABLE IF NOT EXISTS "Fiscal".tax_classification_values (
    id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    classification_type_id bigint       NOT NULL REFERENCES "Fiscal".tax_classification_types(id) ON DELETE CASCADE,
    code                   varchar(60)  NOT NULL,
    name                   varchar(300) NOT NULL,
    external_code          varchar(30),           -- código DIAN/Factus (p.ej. 18/21/22 responsabilidad IVA)
    is_default             boolean      NOT NULL DEFAULT false,
    description            text,
    active                 boolean      NOT NULL DEFAULT true,
    created_at             timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_classification_value UNIQUE (classification_type_id, code)
);

-- ── Tipos de documento soporte del tercero (RUT, cámara de comercio…) ────
--    Distinto del enum document_types de "Ecosystem" (documentos contables).
CREATE TABLE IF NOT EXISTS "Fiscal".document_types (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    country_id          bigint       REFERENCES "Fiscal".countries(id), -- NULL = global
    code                varchar(60)  NOT NULL UNIQUE,
    name                varchar(300) NOT NULL,
    requires_expiration boolean      NOT NULL DEFAULT false,
    description         text,
    active              boolean      NOT NULL DEFAULT true,
    created_at          timestamptz  NOT NULL DEFAULT now()
);

INSERT INTO public.schema_migrations (filename)
VALUES ('0002_create_fiscal_schema_and_catalogs.sql')
ON CONFLICT (filename) DO NOTHING;
