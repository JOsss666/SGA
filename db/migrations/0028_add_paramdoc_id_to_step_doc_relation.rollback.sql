-- Rollback: 0028_add_paramdoc_id_to_step_doc_relation
-- Solo ejecutar si ninguna fila depende de paramdoc_id (o se acepta perder ese vínculo).
-- Revierte la columna, su índice y el registro de aplicación.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DROP INDEX IF EXISTS "Process".step_doc_realtion_paramdoc_id_idx;

ALTER TABLE "Process".step_doc_realtion
    DROP COLUMN IF EXISTS paramdoc_id;

DELETE FROM public.schema_migrations
WHERE filename = '0028_add_paramdoc_id_to_step_doc_relation.sql';

COMMIT;
