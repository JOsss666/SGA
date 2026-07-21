# Migraciones SQL versionadas — SGA

Primera infraestructura de migraciones del proyecto (creada en la Etapa 0 del refactor de terceros, 2026-07-08). Antes de esto, los cambios de esquema se aplicaban a mano sobre la DB viva sin registro en el repo.

## Convención

- Un archivo por migración: `NNNN_descripcion_corta.sql` (numeración secuencial de 4 dígitos: `0001_...`, `0002_...`).
- Cada archivo empieza con un encabezado:

```sql
-- Migration: NNNN_descripcion_corta
-- Fecha:     YYYY-MM-DD
-- Etapa:     (etapa de la hoja de trabajo a la que pertenece)
-- Regla:     solo aditiva — no borra, no renombra, no cambia tipos existentes
-- Rollback:  (instrucciones o archivo NNNN_descripcion_corta.rollback.sql)
```

- **Solo migraciones aditivas** durante el refactor de terceros (regla de oro): `CREATE TABLE/SCHEMA/VIEW/INDEX`, `INSERT` de catálogos, `ALTER TABLE ... ADD COLUMN` con default seguro. Nada de `DROP`, `RENAME` ni `ALTER TYPE` de columnas existentes.
- Escribir las migraciones idempotentes cuando sea posible (`CREATE TABLE IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`) para que re-ejecutar no rompa.
- Si una migración necesita rollback no trivial, crear el archivo hermano `NNNN_*.rollback.sql`.

## Registro de aplicación

La primera migración (`0001`) crea la tabla de control:

```sql
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id          serial PRIMARY KEY,
    filename    text NOT NULL UNIQUE,
    applied_at  timestamptz NOT NULL DEFAULT now(),
    applied_by  text NOT NULL DEFAULT current_user
);
```

Después de aplicar cada migración, registrar:

```sql
INSERT INTO public.schema_migrations (filename) VALUES ('NNNN_descripcion_corta.sql') ON CONFLICT DO NOTHING;
```

## Cómo aplicar

No hay runner automático; se aplican manualmente con `psql` contra la DB de Render:

```bash
source .env 2>/dev/null; export PGPASSWORD="$MYSQL_PASSWORD"
psql -h "$MYSQL_HOST" -U "$MYSQL_USER" -d "$MYSQL_DATABASE" -p "$MYSQL_PORT" \
  --single-transaction -f db/migrations/NNNN_descripcion_corta.sql
```

`--single-transaction` garantiza todo-o-nada por archivo. Verificar con `SELECT * FROM public.schema_migrations ORDER BY id;`.

## Reglas del proceso (refactor de terceros)

1. Backup antes de cualquier migración estructural (Render + `db/backups/`, gitignored).
2. Cada Etapa de la hoja de trabajo se revisa y aprueba por el usuario antes de aplicar la siguiente.
3. La app en producción no debe requerir deploy para que una migración sea segura (el modelo nuevo no lo consume nadie hasta las Etapas 5–6).
4. Documentar el estado baseline en `db/docs/` antes de tocar estructura.
