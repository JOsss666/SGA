-- Migration: 0015_create_facturation_provider_credentials
-- Fecha:     2026-07-19
-- Motivo:    Soportar credenciales de facturacion electronica por empresa.
--            Reemplaza el uso de credenciales Factus globales en .env y caches
--            globales en archivos JSON por datos parametrizados por company_id.
-- Seguridad: Los secretos deben guardarse cifrados por la aplicacion usando
--            APP_ENCRYPTION_KEY; esta migracion NO guarda secretos en claro.
-- Rollback:  DROP TABLE "Facturation".electronic_provider_numbering_ranges;
--            DROP TABLE "Facturation".electronic_provider_tokens;
--            DROP TABLE "Facturation".electronic_provider_credentials;

CREATE SCHEMA IF NOT EXISTS "Facturation";

DO $$
BEGIN
    CREATE TYPE "Facturation".electronic_provider AS ENUM (
        'factus'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "Facturation".electronic_provider_environment AS ENUM (
        'sandbox',
        'production'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "Facturation".provider_config_status AS ENUM (
        'active',
        'inactive',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Facturation".electronic_provider_credentials (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id              bigint NOT NULL REFERENCES "Ecosystem".companies(company_id) ON DELETE CASCADE,
    provider                "Facturation".electronic_provider NOT NULL DEFAULT 'factus',
    environment             "Facturation".electronic_provider_environment NOT NULL DEFAULT 'production',
    api_url                 text NOT NULL,
    client_id               text NOT NULL,
    client_secret_encrypted text NOT NULL,
    username                text NOT NULL,
    password_encrypted      text NOT NULL,
    encryption_version      smallint NOT NULL DEFAULT 1,
    status                  "Facturation".provider_config_status NOT NULL DEFAULT 'active',
    metadata                jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by              varchar(200),
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_electronic_provider_credentials
        UNIQUE (company_id, provider, environment),
    CONSTRAINT chk_electronic_provider_api_url
        CHECK (api_url ~ '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_ep_credentials_company_status
    ON "Facturation".electronic_provider_credentials (company_id, provider, environment, status);

COMMENT ON TABLE "Facturation".electronic_provider_credentials IS
    'Credenciales por empresa para proveedores de facturacion electronica. client_secret y password se guardan cifrados por la aplicacion.';

COMMENT ON COLUMN "Facturation".electronic_provider_credentials.client_secret_encrypted IS
    'Client secret cifrado con APP_ENCRYPTION_KEY; nunca guardar el secreto en claro.';

COMMENT ON COLUMN "Facturation".electronic_provider_credentials.password_encrypted IS
    'Password cifrado con APP_ENCRYPTION_KEY; nunca guardar el password en claro.';

CREATE TABLE IF NOT EXISTS "Facturation".electronic_provider_tokens (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    credential_id           bigint NOT NULL REFERENCES "Facturation".electronic_provider_credentials(id) ON DELETE CASCADE,
    company_id              bigint NOT NULL REFERENCES "Ecosystem".companies(company_id) ON DELETE CASCADE,
    provider                "Facturation".electronic_provider NOT NULL DEFAULT 'factus',
    environment             "Facturation".electronic_provider_environment NOT NULL,
    token_type              varchar(40) NOT NULL DEFAULT 'Bearer',
    access_token_encrypted  text NOT NULL,
    refresh_token_encrypted text,
    expires_at              timestamptz NOT NULL,
    scope                   jsonb NOT NULL DEFAULT '[]'::jsonb,
    raw_payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_electronic_provider_token
        UNIQUE (credential_id),
    CONSTRAINT chk_electronic_provider_token_company
        CHECK (company_id > 0)
);

CREATE INDEX IF NOT EXISTS idx_ep_tokens_lookup
    ON "Facturation".electronic_provider_tokens (company_id, provider, environment, expires_at);

COMMENT ON TABLE "Facturation".electronic_provider_tokens IS
    'Cache de tokens por credencial/proveedor/ambiente. Reemplaza factus_token.json global.';

CREATE TABLE IF NOT EXISTS "Facturation".electronic_provider_numbering_ranges (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    credential_id       bigint NOT NULL REFERENCES "Facturation".electronic_provider_credentials(id) ON DELETE CASCADE,
    company_id          bigint NOT NULL REFERENCES "Ecosystem".companies(company_id) ON DELETE CASCADE,
    provider            "Facturation".electronic_provider NOT NULL DEFAULT 'factus',
    environment         "Facturation".electronic_provider_environment NOT NULL,
    provider_range_id   bigint NOT NULL,
    document_name       varchar(200) NOT NULL,
    document_code       varchar(60),
    prefix              varchar(30),
    current_number      bigint,
    from_number         bigint,
    to_number           bigint,
    valid_from          date,
    valid_until         date,
    is_active           boolean NOT NULL DEFAULT true,
    expires_at          timestamptz,
    raw_payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_electronic_provider_range
        UNIQUE (credential_id, provider_range_id),
    CONSTRAINT chk_electronic_provider_range_dates
        CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from)
);

CREATE INDEX IF NOT EXISTS idx_ep_ranges_lookup
    ON "Facturation".electronic_provider_numbering_ranges
        (company_id, provider, environment, document_name, is_active);

CREATE INDEX IF NOT EXISTS idx_ep_ranges_expiration
    ON "Facturation".electronic_provider_numbering_ranges (expires_at);

COMMENT ON TABLE "Facturation".electronic_provider_numbering_ranges IS
    'Cache/parametrizacion de rangos de numeracion por empresa y proveedor. Reemplaza numbering_ranges.json global.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0015_create_facturation_provider_credentials.sql')
ON CONFLICT (filename) DO NOTHING;
