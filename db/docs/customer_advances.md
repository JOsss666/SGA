# Anticipos de clientes

## Activación

1. Verificar un respaldo antes de aplicar `db/migrations/0029_customer_advances.sql` mediante `psql --single-transaction`. La migración es aditiva e idempotente; no migra ni modifica saldos históricos. Se aplicó a la base conectada de SGA el 2026-09-26, tras verificar un respaldo completo y aprobar las 18 pruebas locales. Se verificaron tablas, columnas, claves e índices; los conteos de registros de negocio existentes se conservaron.
2. Desplegar backend y formularios. La migración debe preceder al despliegue porque el código consulta las tablas nuevas.
3. En Administración, crear o editar el concepto del recibo: `for_balance=true`, `for_wallet=false`, `for_cashExit=false`, con la cuenta donde se registran los anticipos recibidos.
4. Configurar un medio para utilizar anticipos: `for_balance=true`, `for_wallet=false`, con la misma cuenta y moneda que los anticipos a aplicar. Esta marca se ofrece en el formulario de creación de medios de Administración.
5. Al recibir dinero, seleccionar el concepto anterior y los medios reales de recaudo (efectivo, transferencia, etc.). No marcar estos medios como saldo a favor. No combinar creación de anticipo con abonos de cartera en el mismo recibo.
6. Al facturar o pagar cartera por recibo, seleccionar el medio de saldo a favor. La interfaz consulta anticipos del tercero, muestra recibos disponibles y remanente, permite actualizar la consulta y valida la suma de todos los medios asociados a la misma cuenta y moneda.

## Estructura y comportamiento

La inspección de metadatos encontró `Ecosystem.thirdPartyComercialInfo.favor_balance`, pero no tablas de anticipos/aplicaciones ni triggers que lo administren. Ese acumulado histórico no se toma como disponibilidad ni se sobrescribe. Se agregan `Treasury.customer_advances` y `Treasury.advance_applications`, vinculadas a compañías, terceros, documentos, conceptos y contabilidad existentes.

El disponible se calcula como total recibido menos aplicaciones. Cada aplicación conserva recibo de origen, documento destino, detalle contable e importe. Se consume primero el anticipo más antiguo por ID, solo de la misma compañía, tercero, cuenta y moneda. No se convierten monedas.

El servidor consulta las marcas reales del concepto y de los medios; no confía en las banderas enviadas por la interfaz. Los borradores no pueden crear ni consumir anticipos. Las aplicaciones no producen movimientos de caja. Los pagos mixtos producen caja únicamente por la parte recibida realmente.

La transacción existente engloba documento, cartera, contabilidad y anticipo/aplicación. Los bloqueos de filas evitan sobreconsumo concurrente. `request_id` estable por formulario permite repetir una solicitud sin duplicar sus efectos. Los clientes externos deben reutilizar el mismo ID para reintentar y cambiarlo únicamente al iniciar una operación distinta. Repetir la clave con contenido distinto produce error.

`POST /treasury/getThirdPartyAdvances` recibe `company_id` y `thirdParty_id` y devuelve `{status: 'OK', advances: [...]}`. Cada fila expone `id`, `document_id`, `ownSerial`, `account_id`, `currency`, `total`, `used_amount`, `available_amount`, `created_at`, `created_at_local`, `business_date`, `business_time_zone`. La fecha local usa la zona IANA de `company_settings` a través del servicio existente.

La contabilización separada por `/createTransaction` rechaza anticipos: debe utilizarse el endpoint atómico del documento. Las claves foráneas conservan los documentos vinculados y la eliminación de facturas con aplicaciones queda bloqueada. No se ha añadido un flujo de devolución/anulación compensatoria ni se aplican anticipos de clientes a compras/proveedores. Estas operaciones requieren su propio documento y reglas antes de habilitarlas; no deben resolverse borrando movimientos.

## Verificación

`node --test api/test/services/customerAdvanceService.test.js` ejecuta la prueba unitaria monetaria. Para las pruebas de integración, crear una base PostgreSQL **local, vacía**, cuyo nombre comience con `sga_advance_test_`, y ejecutar:

```sh
SGA_ADVANCE_TEST_DATABASE_URL=postgresql://127.0.0.1:55439/sga_advance_test_example node --test api/test/services/customerAdvanceService.test.js
```

La suite rechaza hosts remotos y otros nombres de base. Crea una estructura mínima, aplica la migración y prueba recibos, pagos parciales/mixtos, agotamiento, insuficiencia, atomicidad, concurrencia, reintentos, aislamiento, cartera, configuración, fechas y repetición de la migración. No carga la conexión de producción ni el modelo de IA del arranque global.

Rollback seguro: revertir el despliegue de código conservando las tablas, columnas y movimientos; no borrar los datos creados por esta funcionalidad.
