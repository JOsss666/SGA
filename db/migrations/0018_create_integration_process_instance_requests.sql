-- Migration: 0018_create_integration_process_instance_requests
-- Fecha:     2026-07-30
-- Motivo:    Relacionar referencias externas idempotentes con instancias de proceso.
-- Regla:     solo aditiva.
-- Rollback:  DROP TABLE "Integration".process_instance_requests;

CREATE TABLE IF NOT EXISTS "Integration".process_instance_requests (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    integration_id      bigint NOT NULL
                            REFERENCES "Integration".clients(id) ON DELETE RESTRICT,
    company_id          bigint NOT NULL
                            REFERENCES "Ecosystem".companies(company_id) ON DELETE RESTRICT,
    external_reference  varchar(160) NOT NULL,
    process_instance_id bigint NOT NULL
                            REFERENCES "Process".process_instance(id) ON DELETE RESTRICT,
    request_hash        varchar(64) NOT NULL,
    metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_integration_process_external_reference
        UNIQUE (integration_id, external_reference),
    CONSTRAINT chk_integration_process_external_reference
        CHECK (external_reference ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$'),
    CONSTRAINT chk_integration_process_request_hash
        CHECK (request_hash ~ '^[a-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_integration_process_requests_instance
    ON "Integration".process_instance_requests (company_id, process_instance_id);

COMMENT ON TABLE "Integration".process_instance_requests IS
    'Mapa idempotente entre referencias de sistemas externos e instancias de proceso SGA.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0018_create_integration_process_instance_requests.sql')
ON CONFLICT DO NOTHING;
