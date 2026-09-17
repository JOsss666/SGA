-- Migration: 0027_add_external_access_credentials
-- Motivo: credenciales independientes por acceso externo de tercero.
-- Regla: aditiva; los accesos existentes continúan vigentes y se configuran
--         explícitamente antes de iniciar sesión.
-- Rollback: antes de COMMIT, ROLLBACK. Después, desactivar el consumo de las
--           credenciales desde la aplicación; no eliminar claves ya emitidas.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "Ecosystem"."externalThirdPatiesAccess"
    ADD COLUMN IF NOT EXISTS access_mail character varying(254),
    ADD COLUMN IF NOT EXISTS access_password character varying(64),
    ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS external_third_parties_access_company_third_party_uidx
    ON "Ecosystem"."externalThirdPatiesAccess" (company_id, "thirdParty_id");

CREATE UNIQUE INDEX IF NOT EXISTS external_third_parties_access_login_uidx
    ON "Ecosystem"."externalThirdPatiesAccess" (LOWER(access_mail), access_password)
    WHERE access_mail IS NOT NULL AND access_password IS NOT NULL;

COMMENT ON COLUMN "Ecosystem"."externalThirdPatiesAccess".access_mail IS
    'Correo normalizado utilizado por este acceso externo; puede repetirse con otra contraseña.';
COMMENT ON COLUMN "Ecosystem"."externalThirdPatiesAccess".access_password IS
    'Hash de la contraseña asignada a este acceso externo. Nunca se almacena la contraseña en texto plano.';
COMMENT ON COLUMN "Ecosystem"."externalThirdPatiesAccess".enabled IS
    'Control administrativo para habilitar o deshabilitar el acceso externo.';

INSERT INTO public.schema_migrations (filename)
VALUES ('0027_add_external_access_credentials.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
