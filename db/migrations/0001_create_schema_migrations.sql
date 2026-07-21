-- Migration: 0001_create_schema_migrations
-- Fecha:     2026-07-08
-- Etapa:     1 (hoja de trabajo refactor terceros) — infraestructura de control
-- Regla:     solo aditiva — no borra, no renombra, no cambia tipos existentes
-- Rollback:  DROP TABLE public.schema_migrations;

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id          serial PRIMARY KEY,
    filename    text NOT NULL UNIQUE,
    applied_at  timestamptz NOT NULL DEFAULT now(),
    applied_by  text NOT NULL DEFAULT current_user
);

INSERT INTO public.schema_migrations (filename)
VALUES ('0001_create_schema_migrations.sql')
ON CONFLICT (filename) DO NOTHING;
