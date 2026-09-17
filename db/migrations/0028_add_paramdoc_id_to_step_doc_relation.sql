-- Migration: 0028_add_paramdoc_id_to_step_doc_relation
-- Fecha:     2026-09-15
-- Motivo:    permitir que un documento requerido de un paso apunte a una plantilla
--            de documento parametrizado (paramDoc) concreta, para auto-abrir el
--            formulario correcto al crear la instancia de proceso.
-- Regla:     aditiva; los documentos nativos existentes conservan paramdoc_id NULL
--            y su comportamiento por docType. No altera columnas ni tipos previos.
-- Rollback:  0028_add_paramdoc_id_to_step_doc_relation.rollback.sql (solo sin datos
--            que dependan de la columna).

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "Process".step_doc_realtion
    ADD COLUMN IF NOT EXISTS paramdoc_id bigint NULL
        REFERENCES "Custom"."externalDocParameters"(id);

CREATE INDEX IF NOT EXISTS step_doc_realtion_paramdoc_id_idx
    ON "Process".step_doc_realtion (paramdoc_id)
    WHERE paramdoc_id IS NOT NULL;

COMMENT ON COLUMN "Process".step_doc_realtion.paramdoc_id IS
    'Plantilla de documento parametrizado (Custom."externalDocParameters".id) asociada a este documento del paso. NULL para documentos nativos, que se resuelven por docType.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0028_add_paramdoc_id_to_step_doc_relation.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
