---
name: sga-data-safety
description: Protege la estructura y los datos de SGA mediante cambios aditivos, compatibles y controlados. Usar siempre que se consulten o modifiquen bases de datos, SQL, migraciones, modelos, repositorios, servicios, controladores o endpoints con acceso a datos, especialmente cuando exista conexión con producción.
---

# Seguridad de datos de SGA

Aplicar el principio de mínimo impacto: reutilizar la infraestructura existente y preservar datos, contratos y módulos no relacionados.

## Antes de actuar

1. Identificar el esquema, tablas, relaciones, restricciones, servicios, repositorios, controladores y endpoints involucrados.
2. Inspeccionar primero con operaciones de solo lectura. No asumir nombres, tipos, zonas horarias ni cardinalidades.
3. Delimitar la compañía, ambiente y registros objetivo. Tratar toda conexión no identificada como producción hasta verificar lo contrario.
4. Preferir los servicios, repositorios, migraciones y patrones ya existentes en el proyecto.

## Reglas obligatorias

- Hacer consultas y cambios directos del agente de forma meramente aditiva y no destructiva.
- No ejecutar `DROP`, `TRUNCATE`, eliminaciones, sobrescrituras masivas, recreaciones ni cambios irreversibles sobre datos o estructuras existentes.
- No ejecutar `UPDATE` o `DELETE` directos sobre producción. Si una corrección excepcional los requiere, detenerse y solicitar autorización explícita con el alcance, respaldo y plan de reversión.
- Crear cambios de esquema mediante migraciones aditivas, idempotentes cuando sea viable, transaccionales y acompañadas de rollback seguro.
- No reescribir datos históricos. Para corregir comportamiento, preferir vistas, columnas nuevas, tablas auxiliares, transformaciones de lectura o backfills controlados y previamente autorizados.
- Mantener compatibilidad con consumidores actuales. No renombrar ni eliminar columnas, respuestas, rutas o parámetros usados por otros módulos.
- Extender endpoints o servicios existentes cuando corresponda; crear otros nuevos solo si evita romper contratos vigentes.
- Aplicar filtros precisos por compañía y claves de negocio. Evitar operaciones sin `WHERE` y validar el conjunto afectado con una consulta previa de solo lectura.
- Usar transacciones para escrituras relacionadas y fallar de forma atómica.
- No imprimir, copiar ni exponer credenciales, secretos o datos sensibles en código, logs o respuestas.

## Verificación

1. Revisar el diff y confirmar que el alcance no toca módulos o endpoints ajenos.
2. Probar primero en un entorno local o de prueba con datos representativos.
3. Verificar compatibilidad, conteos y restricciones antes y después del cambio.
4. Informar cualquier operación que no pueda verificarse de forma segura; no compensar la incertidumbre ejecutando cambios en producción.

La autorización general para implementar una funcionalidad no implica permiso para modificar o eliminar datos de producción.
