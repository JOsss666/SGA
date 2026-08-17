-- Migration: 0017_create_integration_auth
-- Fecha:     2026-07-30
-- Motivo:    Autenticación máquina-a-máquina para integraciones empresariales.
-- Regla:     solo aditiva.
-- Seguridad: Los secretos se guardan como hashes scrypt; nunca en texto claro.
-- Rollback:  DROP SCHEMA "Integration" CASCADE;

CREATE SCHEMA IF NOT EXISTS "Integration";

CREATE TABLE IF NOT EXISTS "Integration".clients (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id          bigint NOT NULL
                            REFERENCES "Ecosystem".companies(company_id) ON DELETE CASCADE,
    service_user_id     bigint
                            REFERENCES "Ecosystem".users(user_id) ON DELETE RESTRICT,
    client_id           varchar(120) NOT NULL UNIQUE,
    name                varchar(200) NOT NULL,
    secret_hash         text NOT NULL,
    scopes              text[] NOT NULL DEFAULT ARRAY[]::text[],
    status              varchar(20) NOT NULL DEFAULT 'active',
    token_version       integer NOT NULL DEFAULT 1,
    access_token_ttl    integer NOT NULL DEFAULT 900,
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    last_used_at        timestamptz,
    secret_rotated_at   timestamptz NOT NULL DEFAULT now(),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    revoked_at          timestamptz,
    CONSTRAINT chk_integration_client_status
        CHECK (status IN ('active', 'suspended', 'revoked')),
    CONSTRAINT chk_integration_token_version
        CHECK (token_version > 0),
    CONSTRAINT chk_integration_token_ttl
        CHECK (access_token_ttl BETWEEN 60 AND 3600),
    CONSTRAINT chk_integration_client_id
        CHECK (client_id ~ '^[a-z0-9][a-z0-9._-]{2,119}$')
);

CREATE INDEX IF NOT EXISTS idx_integration_clients_company_status
    ON "Integration".clients (company_id, status);

CREATE TABLE IF NOT EXISTS "Integration".auth_events (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id       varchar(120),
    integration_id  bigint
                        REFERENCES "Integration".clients(id) ON DELETE SET NULL,
    company_id      bigint,
    event_type      varchar(40) NOT NULL,
    success         boolean NOT NULL,
    ip_address      inet,
    user_agent      text,
    details         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_auth_events_client_date
    ON "Integration".auth_events (client_id, created_at DESC);

COMMENT ON TABLE "Integration".clients IS
    'Clientes máquina-a-máquina autorizados para consumir la API de integraciones.';
COMMENT ON COLUMN "Integration".clients.secret_hash IS
    'Hash scrypt versionado. Nunca contiene el client_secret recuperable.';
COMMENT ON COLUMN "Integration".clients.token_version IS
    'Incrementar para invalidar inmediatamente todos los JWT emitidos al cliente.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0017_create_integration_auth.sql')
ON CONFLICT DO NOTHING;
