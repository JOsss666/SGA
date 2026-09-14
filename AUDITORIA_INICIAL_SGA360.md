# Auditoria inicial SGA 360

Fecha de evaluacion: 2026-05-05  
Actualizacion incorporada: revision previa de Inventarios y dump real PostgreSQL adjuntos por Gerencia.  
Alcance: revision de estructura actual del proyecto, backend `api`, frontends por modulo, documentacion SQL, dump de base de datos, control de acceso, trazabilidad, contabilidad, fiscalidad, reportes y arquitectura general.  
Resultado: ROJO para produccion. AMARILLO solo para continuar desarrollo correctivo controlado.

## 1. Resumen del cambio

No se evalua un cambio puntual, sino el estado base actual del proyecto SGA 360 para definir que debe ajustar Desarrollo antes de seguir adicionando funcionalidades.

El proyecto ya contiene una base funcional importante: backend Node/Express, PostgreSQL en ejecucion de codigo, varios frontends React/Vite por modulo, modulos de administracion, inventario, procesos, facturacion, tesoreria, contabilidad, reportes, facturacion electronica y modulos personalizados. Tambien existe una intencion clara de separar informacion por `company_id` y de manejar roles/configuraciones por usuario.

Sin embargo, la columna vertebral ERP aun no esta suficientemente cerrada para un producto multicompañia, multipais, contable, fiscal y comercializable. Los riesgos mas relevantes son autenticacion debil, autorizacion en frontend, ausencia de `tenant_id`, falta de middleware de permisos por endpoint, trazabilidad incompleta, mezcla de SQL MySQL/PostgreSQL, operaciones contables sin transaccion atomica, eliminaciones fisicas, reglas fiscales colombianas quemadas y reportes no normalizados en todos los modulos.

La revision previa de Inventarios confirma una linea tecnica correcta para ese modulo: `stock_ledger` como verdad historica append-only, `stocks` como proyeccion operativa controlada, documentos obligatorios para todo movimiento, idempotencia, concurrencia y DDL antes de backend. Esa linea se incorpora como criterio oficial, pero permanece en AMARILLO hasta cerrar FKs corporativas, saneamiento legacy, auditoria automatica, seguridad de escritura y validaciones contables.

El archivo `Sin titulo.txt` corresponde a un `pg_dump` real de PostgreSQL 18.3. Esto corrige parte del diagnostico anterior: la base real no depende solo de la documentacion MySQL antigua, sino que ya existen schemas PostgreSQL como `Ecosystem`, `Inventory`, `Facturation`, `Treasury`, `Process`, `ElectronicFacturation`, `AssetManagement`, `Custom`, `Notifications` y `Services`. La documentacion SQL MySQL queda como referencia historica/legacy y no debe usarse como fuente final de DDL.

## 2. Modulos afectados

- Backend general: `api/server.js`, `api/app.js`, `api/routes/index.routes.js`, `api/controllers/*`.
- Ecosistema/base maestra: usuarios, compañias, tiendas, terceros, impuestos, conceptos, documentos, transacciones.
- Inventario: productos, servicios, bodegas/cellars, existencias, movimientos, kardex, listas de precios.
- Procesos: instancias, documentos relacionados, OP/OC/DC/FV/CI, flujos y estados.
- Facturacion: documentos comerciales, caja POS, cartera, facturacion electronica.
- Tesoreria: cuentas por cobrar, recaudos, cartera.
- Contabilidad: plan de cuentas, movimientos, balances.
- Reportes/exportaciones: XLSX, CSV, PDF y capturas.
- Frontends: `SGA-management`, `Inventory/SGA-inventory`, `Process/SGA-process`, `Facturation/Facturation`, `Treasury/SGA - Treasuty`.
- Modulos personalizados: `costume-modules` y `api/controllers/custom-controllers`.
- Base de datos real PostgreSQL: schemas `Ecosystem`, `Inventory`, `Facturation`, `Treasury`, `Process`, `ElectronicFacturation`, `AssetManagement`, `Custom`, `Notifications`, `Services`.

## 3. Evaluacion multicompañia

Hallazgos:

- Muchas consultas y tablas usan `company_id`, lo cual es positivo.
- No se encontro `tenant_id` como frontera superior multicompañia/multicliente. Para un ERP comercializable, `company_id` no reemplaza a `tenant_id`.
- No hay modelo consistente de `branch_id`; se usa `store_id`, pero no esta normalizado como sucursal fiscal/operativa.
- No hay `country_id` transversal; se usan campos libres como `country`.
- En el dump real existe aislamiento frecuente por `company_id`, con FKs hacia `"Ecosystem".companies(company_id)` en muchas tablas; aun asi no existe modelo corporativo confirmado de `tenant_id`, `country_id` ni `branch_id`.
- Los identificadores `company_key` y `user_key` viajan en URL y se usan para cargar compañia/usuario desde el frontend.
- El frontend envia `company_id`, `user_id`, `store_id` y permisos en el body; el backend no valida que esos datos pertenezcan a la sesion autenticada.
- Realtime permite unirse a salas por `companyId` recibido en `socket.handshake.query`, sin validacion de token.

Riesgo:

- Un cliente modificado podria consultar o afectar informacion de otra compañia enviando otro `company_id`.

Ajuste requerido:

- Introducir contexto obligatorio de seguridad en backend: `tenant_id`, `company_id`, `branch_id/store_id`, `country_id`, `user_id`, rol y permisos derivados del token/sesion, no del body.
- Agregar middleware `requireAuth`, `requireCompanyAccess`, `requirePermission`.
- Todo endpoint debe ignorar `company_id` del cliente cuando exista sesion y tomarlo del contexto autorizado.
- Normalizar `stores`/`branches`: definir si `store_id` es tienda, sucursal operativa o sucursal fiscal; si no lo es, crear `branches`.

## 4. Evaluacion de base de datos

Hallazgos:

- No se encontro carpeta formal de migraciones.
- La documentacion SQL esta escrita en sintaxis MySQL (`AUTO_INCREMENT`, `ENUM`, `USE`, `IFNULL`), mientras el backend usa PostgreSQL (`pg`, `$1`, schemas con comillas).
- Hay tablas documentadas con `company_id`, pero sin `tenant_id`.
- Varias tablas no contemplan auditoria completa: `created_by`, `updated_by`, `deleted_by`, `deleted_at`, `source_document_id`, `posting_period_id`, `ip`, `request_id`.
- Se encontraron relaciones con `ON DELETE CASCADE` en entidades sensibles como usuarios, terceros, conceptos, impuestos y detalles de transacciones.
- Existen eliminaciones fisicas en endpoints de usuarios, tiendas, impuestos, conceptos, transacciones, terceros, movimientos y listas de precio.
- Hay consultas con interpolacion directa de variables del cliente en SQL, especialmente en busquedas, reportes e inventario.
- Algunas consultas mezclan placeholders MySQL `?` con PostgreSQL `$1`.
- Hay campos monetarios definidos como `FLOAT`, no como `NUMERIC(p,s)`.

Riesgo:

- Integridad inconsistente, imposibilidad de auditar cambios, riesgo de inyeccion SQL, diferencias entre documentacion y base real, y errores contables por precision decimal.

Ajuste requerido:

- Crear migraciones versionadas para PostgreSQL.
- Usar el `pg_dump` real como fuente de verdad para nombres fisicos, PKs y FKs antes de generar DDL nueva.
- Definir un modelo base obligatorio para tablas transaccionales:
  `id`, `tenant_id`, `company_id`, `branch_id`, `country_id`, `period_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`, `status`, `source_document_id`.
- Reemplazar `FLOAT` por `NUMERIC(18,6)` o estandar financiero definido.
- Reemplazar eliminacion fisica por soft delete o anulacion/reversion segun aplique.
- Agregar llaves foraneas compuestas o validaciones que impidan cruzar registros entre compañias.
- Parametrizar todas las consultas. Cero interpolacion directa de valores del cliente.

## 5. Evaluacion contable

Hallazgos:

- Existe estructura de transacciones y `transaction_detail` con naturaleza `DB`/`CR`.
- El balance usa movimientos con `status = 'posted'`.
- No se evidencia validacion obligatoria de partida doble antes de registrar o contabilizar una transaccion.
- `createTransaction` inserta cabecera, detalle, cartera y movimientos de caja en operaciones separadas, sin `BEGIN/COMMIT/ROLLBACK`.
- No se evidencia bloqueo de periodo contable ni fiscal.
- No se evidencia documento fuente obligatorio validado contra tipo documental.
- `updateTransactionState` cambia estados de transaccion/detalle directamente, sin bitacora ni reversion contable.
- No se evidencia control que impida modificar documentos contabilizados.
- No se encontro modelo formal de comprobante contable, asiento, lote de contabilizacion, reversion o anulacion.

Riesgo:

- Se pueden grabar movimientos descuadrados, parciales o reversados de forma incorrecta si falla una insercion intermedia.

Ajuste requerido:

- Implementar servicio contable unico: `AccountingPostingService`.
- Toda contabilizacion debe validar `sum(DB) == sum(CR)` por `company_id`, moneda y documento.
- Registrar asiento en cabecera/detalle con periodo, documento fuente, tercero, centro de costo, unidad de negocio y usuario.
- Usar transacciones de base de datos para documento, detalle contable, caja, cartera e inventario.
- Prohibir `UPDATE/DELETE` directo sobre documentos contabilizados. Solo permitir reversion/anulacion con documento inverso.
- Crear tabla de periodos contables/fiscales con estados: abierto, en cierre, cerrado.

## 6. Evaluacion fiscal/multipais

Hallazgos:

- Hay tablas de impuestos y terceros con informacion fiscal basica.
- No existe `country_id` consistente en transacciones, impuestos, documentos, reglas fiscales ni reportes.
- En facturacion electronica hay valores colombianos quemados: Factus sandbox, `legal_organization_id`, `tribute_id`, `identification_document_id`, `municipality_id`, emails de prueba, rangos de numeracion y endpoints especificos.
- No se observa motor de localizacion fiscal desacoplado del core.
- Moneda existe en medios de pago, pero no como modelo transversal de documento/transaccion/asiento/tipo de cambio.

Riesgo:

- El core queda acoplado a Colombia/Factus y no es extensible a otros paises sin tocar logica critica.

Ajuste requerido:

- Crear modulo `Localization` o `FiscalRules` por pais.
- Parametrizar tipos de identificacion, impuestos, responsabilidades fiscales, codigos legales, monedas, formatos, rangos de numeracion y proveedores electronicos.
- Separar integracion Factus como adaptador de Colombia, no como core.
- Agregar `currency_id`, `exchange_rate`, `country_id` y `tax_regime_id` donde aplique.

## 7. Evaluacion de seguridad

Hallazgos:

- No hay middleware global de autenticacion antes de las rutas.
- Login compara password con hash SHA recortado, sin bcrypt/argon2, salt ni politicas de bloqueo.
- La sesion se representa con `user_session = true/false` en base de datos.
- `company_key` y `user_key` se incluyen en la URL de navegacion.
- Las llamadas frontend no envian `Authorization` ni cookie segura.
- Los permisos se aplican principalmente en frontend mediante `userConfig.access`.
- Existen rutas sensibles sin proteccion: crear/eliminar usuarios, impuestos, conceptos, transacciones, documentos, facturacion electronica, activos y modulos personalizados.
- Existen credenciales SMTP por defecto en codigo.
- `rejectUnauthorized: false` en conexion SSL debilita la validacion TLS.
- Socket.io permite suscripcion por `companyId` sin autenticar.
- Uploads no evidencian validacion de tipo/tamaño por politica de negocio ni antivirus.
- Hay endpoints GET que exponen token o informacion fiscal operativa.

Riesgo:

- Acceso no autorizado, suplantacion de compañia, filtracion de datos, modificacion de datos contables y compromiso de secretos.

Ajuste requerido:

- Implementar JWT/cookie segura con expiracion, refresh token, rotacion y logout real.
- Migrar passwords a `argon2id` o `bcrypt` con salt.
- Agregar RBAC/ABAC en backend por modulo, accion, compañia, sucursal, centro de costo y segregacion de funciones.
- Eliminar secretos hardcodeados y rotarlos.
- Validar Socket.io con token firmado.
- Agregar rate limiting, Helmet, CORS por ambiente, validacion de payloads y logs de seguridad.

## 8. Evaluacion de auditoria

Hallazgos:

- Hay campos `created_at` y `updated_at` en varias tablas.
- Hay `created_by` en algunos documentos, pero no de forma transversal.
- No se evidencia tabla central de bitacora de eventos: quien, que, cuando, desde donde, antes/despues, motivo, ticket.
- No se evidencia trazabilidad de aprobaciones, anulaciones, reversos o cambios de estado.
- Existen eliminaciones fisicas que borran evidencia.
- No existe obligacion tecnica de ticket/justificacion en cambios de datos sensibles.

Riesgo:

- No seria defendible ante auditoria interna, fiscal o contable si se modifica o elimina informacion sensible.

Ajuste requerido:

- Crear `audit_log` central y/o por dominio.
- Todo cambio sensible debe registrar: `tenant_id`, `company_id`, `branch_id`, `user_id`, accion, entidad, entidad_id, estado anterior, estado nuevo, timestamp, ip, user_agent, request_id, ticket_id y justificacion.
- Para documentos contabilizados, registrar eventos de contabilizacion, anulacion, reversion y cierre.

## 9. Riesgos

Criticos:

- Mezcla de datos entre compañias por confiar en `company_id` enviado desde frontend.
- Acceso sin permisos reales en backend.
- Eliminacion fisica de registros con valor transaccional.
- Contabilidad descuadrada por falta de validacion y transaccion atomica.
- Core fiscal acoplado a Colombia/Factus.
- SQL injection por interpolacion directa.
- Diferencia entre documentacion SQL y motor real.
- Password/session model no apto para ERP comercializable.
- En Inventarios, ejecutar DDL nueva contra `"Inventory".stocks` sin saneamiento controlado puede colisionar con la tabla legacy real y afectar datos de prueba o datos historicos.
- Ejecutar rollback que incluya `DROP TABLE "Inventory".stocks` podria borrar legacy si no se separan objetos nuevos de objetos existentes.

Altos:

- Reportes descargables no garantizan metadatos obligatorios en todos los formatos/modulos.
- Falta de migraciones formales.
- Ausencia de pruebas automatizadas.
- Falta de versionado de API y contratos.
- Duplicacion de frontends y utilidades por modulo, lo que eleva costo de mantenimiento.
- DDL de Inventarios no debe avanzar a VERDE mientras `tenant_id`, `country_id`, `branch_id`, FKs corporativas y autorizacion formal de saneamiento legacy sigan pendientes.

## 10. Pruebas exigidas

Antes de aprobar nuevos desarrollos funcionales, Desarrollo debe crear una bateria minima:

- Seguridad:
  - Login exitoso/fallido, bloqueo/rate limit, expiracion de token.
  - Acceso cruzado entre compañias debe fallar.
  - Usuario sin permiso no puede crear, editar, eliminar, contabilizar ni exportar.
  - Socket.io no permite suscripcion a otra compañia.

- Multicompañia:
  - Todas las consultas filtran por contexto de sesion.
  - Terceros, impuestos, productos, documentos, cartera y asientos no cruzan compañias.

- Contabilidad:
  - No permite contabilizar si debitos y creditos no cuadran.
  - No permite modificar documento contabilizado sin reversion.
  - Reversion genera asiento inverso y conserva trazabilidad.
  - Periodo cerrado bloquea nuevos movimientos.

- Base de datos:
  - Migraciones reproducibles desde cero.
  - FKs, `NOT NULL`, `CHECK`, indices y constraints por compañia.
  - Rollback ante error parcial en facturacion/inventario/tesoreria/contabilidad.

- Fiscal/multipais:
  - Impuestos, identificaciones, moneda y proveedor electronico se resuelven por pais.
  - No hay codigos fiscales quemados en core.

- Reportes:
  - Todo XLSX, CSV, PDF o DOC debe incluir compañia, nombre del informe, periodo cubierto y fecha de generacion.
  - Validar que el reporte no muestre datos de otra compañia.

## 11. Decision

ROJO para produccion o para seguir agregando modulos transaccionales sin remediacion.

AMARILLO condicionado para una fase de estabilizacion tecnica, siempre que Desarrollo trabaje primero en la columna vertebral:

1. Seguridad y contexto multicompañia.
2. Modelo de datos/migraciones.
3. Auditoria y trazabilidad.
4. Servicio contable y reversos.
5. Localizacion fiscal multipais.
6. Estandar de reportes.

No se aprueba ningun desarrollo nuevo que cree tablas transaccionales sin `tenant_id` y `company_id`, modifique contabilidad sin partida doble, borre trazabilidad, permita acceso sin permisos o queme reglas fiscales de un pais en el core.

## 12. Instrucciones para Desarrollo

### Fase 1: seguridad y contexto obligatorio

- Crear middleware backend:
  - `requireAuth`
  - `resolveTenantContext`
  - `requireCompanyAccess`
  - `requirePermission`
  - `requireOpenPeriod`
- Reemplazar `company_key/user_key` en URL por sesion/token.
- Prohibir que endpoints confien en `company_id`, `user_id`, rol o permisos enviados desde frontend.
- Rotar secretos y eliminar credenciales por defecto del repositorio.

### Fase 2: base de datos ERP

- Crear migraciones PostgreSQL versionadas.
- Definir schemas core: `Identity`, `Core`, `Accounting`, `Fiscal`, `Inventory`, `Sales`, `Treasury`, `Process`, `Audit`.
- Agregar `tenant_id`, `company_id`, `branch_id`, `country_id`, auditoria y periodo donde aplique.
- Reemplazar `FLOAT` por `NUMERIC`.
- Crear indices compuestos por `tenant_id/company_id`.
- Antes de cualquier DDL nueva, consultar el dump real y confirmar nombres fisicos con `information_schema`/`pg_catalog`.
- No usar `CREATE TABLE IF NOT EXISTS` para objetos criticos si puede ocultar estructuras incompatibles.
- Separar objetos legacy, objetos nuevos, saneamiento y rollback.

### Fase 3: contabilidad y documentos

- Crear servicio unico de contabilizacion.
- Validar partida doble antes de guardar como `posted`.
- Crear modelo de reversion/anulacion.
- Bloquear modificacion directa de documentos contabilizados.
- Asegurar transacciones atomicas en facturacion, cartera, caja, inventario y contabilidad.

### Fase 4: auditoria

- Implementar `audit_log`.
- Registrar ticket y justificacion en operaciones sensibles.
- Capturar antes/despues en cambios de maestros, permisos, documentos, impuestos y asientos.

### Fase 5: fiscalidad multipais

- Sacar Factus/Colombia del core y convertirlo en adaptador.
- Parametrizar por pais: impuestos, identificacion, monedas, reportes legales, numeraciones y validaciones.

### Fase 6: reportes y experiencia operativa

- Centralizar utilidades de exportacion.
- Hacer obligatorio en todo descargable: compañia, nombre del informe, periodo cubierto y fecha de generacion.
- Definir contratos de API y versionarlos.
- Reducir duplicacion de frontends/utilidades mediante paquete compartido o libreria interna.

### Fase 7: Inventarios DDL controlado

- Mantener la decision de Inventarios en AMARILLO hasta cerrar DDL fisica.
- `stock_ledger` debe ser append-only y bloquear `UPDATE`/`DELETE`.
- `stocks` debe ser proyeccion operativa controlada, no fuente historica.
- Todo movimiento debe tener documento fuente.
- Todo documento economico `POSTED` debe tener enlace contable (`accounting_transaction_id`) o estado intermedio formal.
- El enlace contable debe validar misma `company_id` y, cuando existan, mismo `tenant_id`, periodo y estado contable permitido.
- Debe existir idempotencia para creacion, aprobacion, posteo, reversa y reservas.
- Debe existir proteccion real de escritura sobre proyeccion de stock mediante rol tecnico, funcion controlada o mecanismo equivalente.
- Debe existir auditoria automatica para creacion, cambio de estado, aprobacion, posteo, reversa, reservas, liberaciones y escrituras autorizadas.
- Si se sanea legacy, debe existir ticket o acta que confirme que `entries`, `departures`, `"inventoryMovements"` y `stocks` son datos de prueba o quedan autorizados para aislamiento.
- Ningun rollback puede borrar tablas legacy sin aprobacion explicita.

### Evidencia revisada

- Backend sin middleware global de auth antes de rutas: `api/server.js`, `api/routes/index.routes.js`.
- Login y user keys: `api/controllers/index.controller.js`.
- Eliminaciones fisicas: `api/controllers/index.controller.js`, `api/controllers/inventoryController.js`, `api/controllers/processController.js`.
- Operacion contable sin transaccion atomica: `api/controllers/index.controller.js`.
- SQL interpolado: `api/controllers/inventoryController.js`, `api/controllers/processController.js`, `api/controllers/custom-controllers/zjController.js`.
- Facturacion electronica con valores Colombia/Factus: `api/controllers/electronicFacturationController.js`.
- Exportaciones no uniformes: `*/src/utils/functions.js`.
- Documentacion SQL MySQL vs backend PostgreSQL: `Inventory/Documentation/*.sql`, `Process/Documentation/*.sql`, `api/app.js`.
- Dump real PostgreSQL: `/Users/camm/Downloads/Sin titulo.txt`.
- Revision previa de Inventarios: `/Users/camm/Downloads/SGA 360 ANALISIS INVENTARIO.docx`.

## 13. Anexo Inventarios y base real

### Base PostgreSQL real

El dump adjunto confirma una base PostgreSQL 18.3 con schemas reales:

- `Ecosystem`
- `Inventory`
- `Facturation`
- `Treasury`
- `Process`
- `ElectronicFacturation`
- `AssetManagement`
- `Custom`
- `Notifications`
- `Services`

Tablas relevantes confirmadas por evidencia:

- `"Ecosystem".companies(company_id)`
- `"Ecosystem".users(user_id)`
- `"Ecosystem".documents(id)`
- `"Ecosystem".transactions(id)`
- `"Ecosystem".transaction_detail(id)`
- `"Ecosystem".thirdparties(id)`
- `"Ecosystem"."costCenters"(id)`
- `"Ecosystem".bussines(id)`
- `"Inventory"."products&services"(id)`
- `"Inventory".cellars(id)`
- `"Inventory"."inventoryMovements"(id)`
- `"Inventory".stocks(id)`

Hallazgos relevantes del dump:

- Existen enums PostgreSQL como `document_types`, `transactions_status`, `account_nature`, `currencies`, `paymentmethod_options` y otros.
- Existen funciones de serial documental y notificacion: `generate_own_serial_seq`, `generate_transaction_serial`, `notify_db_event`, `update_timestamp`.
- Existen triggers de notificacion sobre `"Ecosystem".documents` y `"Process".process_instance`.
- Hay varias FKs con `NOT VALID`; deben validarse antes de considerar cierre estructural.
- Hay campos financieros ya en `numeric(18,6)`, pero tambien persisten `real` en transacciones/detalles/impuestos/productos que deben revisarse.
- `"Inventory".stocks` ya existe como tabla legacy con `company_id`, `store_id`, `cellar_id`, `product_id`, `stock`, `min_stock`, `max_stock`, `updated_at`, `avg_cost`.
- `"Inventory"."inventoryMovements"` existe como movimiento legacy, pero no equivale a ledger historico final.

### Dictamen especifico de Inventarios

Estado actual: AMARILLO para revision tecnica interna. ROJO para ejecucion productiva o DDL final sin autorizacion.

Se acepta como criterio conceptual:

- `stock_ledger` como libro historico append-only.
- `stocks` como proyeccion operativa, no fuente historica.
- Documento obligatorio para todo movimiento.
- Idempotencia obligatoria.
- Reversion por nuevo documento/movimiento, no por edicion del original.
- Preparacion para promedio ponderado inicial y futura evolucion FIFO/PEPS por compañia.

No se aprueba aun:

- DDL final ejecutable.
- Backend de posteo.
- Migracion definitiva.
- Saneamiento legacy sin ticket/acta.
- Escritura manual sobre `stocks`.
- FKs inventadas hacia `branches`, `countries`, `tenants` o nombres no confirmados.
- Documento economico `POSTED` sin enlace contable valido.

Condiciones para subir Inventarios a VERDE:

- Confirmar o diferir formalmente FKs corporativas: documentos, terceros, centros de costo, unidades de negocio, paises, sucursales, detalle contable y tenants.
- Resolver el conflicto con `"Inventory".stocks` legacy mediante saneamiento autorizado, tabla nueva (`stock_projection`) o esquema nuevo (`InventoryCore`).
- Proteger `stock_ledger` contra `UPDATE` y `DELETE`.
- Proteger `stocks`/proyeccion contra escrituras funcionales directas.
- Crear auditoria automatica del flujo documental y de proyeccion.
- Agregar pruebas SQL con errores esperados especificos.
- Validar consistencia interna de `tenant_id`, `company_id`, `country_id`, `branch_id` entre cabecera, lineas, ledger, reservas, costos y stock.
- Validar contabilidad: misma compañia, estado no cancelado, partida doble, periodo abierto y cobertura de lineas economicas cuando el modelo contable lo permita.
- Documentar que todo reporte de inventario exportable incluye compañia, nombre del informe, periodo cubierto y fecha de generacion.

### Matriz de FKs corporativas para Inventarios

| Columna nueva | Tabla esperada | Evidencia actual | Decision | Accion requerida |
| --- | --- | --- | --- | --- |
| `ecosystem_document_id` | `"Ecosystem".documents(id)` | Tabla y PK aparecen en dump | Confirmable | Validar tipo, `company_id` y agregar FK si aplica |
| `thirdparty_id` | `"Ecosystem".thirdparties(id)` | Dump confirma `thirdparties`, no `thirdParties` | Confirmable | Usar nombre fisico minuscula y validar `company_id` |
| `cost_center_id` | `"Ecosystem"."costCenters"(id)` | Dump confirma tabla | Confirmable | Validar alcance por `company_id` |
| `business_unit_id` | `"Ecosystem".bussines(id)` | Dump confirma tabla `bussines` | Confirmable con observacion | Confirmar si representa unidad de negocio o si se normalizara |
| `country_id` | Catalogo corporativo de paises | No confirmado en dump | Diferida | Proponer tabla maestra o deuda tecnica controlada |
| `branch_id` | Catalogo corporativo de sucursales | No confirmado; existe `stores` | Diferida | Definir si `stores` equivale a branch o crear `branches` |
| `transaction_detail_id` | `"Ecosystem".transaction_detail(id)` | Tabla y PK aparecen en dump | Confirmable | Validar relacion con `transactions` y campos DB/CR |
| `tenant_id` | Catalogo de tenants | No confirmado | Diferida critica | Decidir nullable temporal, tabla nueva o derivacion desde company |

## Prompt para CODEX

Actua como desarrollador senior PostgreSQL y arquitecto de datos del ERP SGA 360.

Contexto:
Auditoria incorporo la revision previa de Inventarios y el dump real PostgreSQL 18.3. La decision general sigue en ROJO para produccion y AMARILLO para estabilizacion tecnica. Para Inventarios, la linea conceptual es valida, pero no hay VERDE hasta cerrar DDL, saneamiento legacy, FKs corporativas, auditoria y seguridad.

Objetivo:
Actualizar la propuesta tecnica de Inventarios y la columna vertebral ERP usando el dump real como fuente de verdad, sin avanzar a backend ni frontend.

Debes entregar:

1. Matriz de confirmacion real desde `information_schema`/`pg_catalog` para:
   - `"Ecosystem".documents`
   - `"Ecosystem".thirdparties`
   - `"Ecosystem"."costCenters"`
   - `"Ecosystem".bussines`
   - `"Ecosystem".transaction_detail`
   - `"Inventory".stocks`
   - `"Inventory"."inventoryMovements"`
   - catalogo de paises, sucursales y tenants si existen.

2. DDL de Inventarios en estado AMARILLO, no productivo, que contemple:
   - `stock_ledger` append-only.
   - `stocks` como proyeccion controlada o estrategia alternativa si colisiona con legacy.
   - documentos y lineas obligatorias.
   - idempotencia.
   - auditoria automatica.
   - proteccion de escritura mediante rol/funcion tecnica.
   - validaciones internas de `tenant_id`, `company_id`, `country_id`, `branch_id`.
   - enlace contable obligatorio para documentos economicos `POSTED`.

3. Estrategia de legacy:
   - No borrar `"Inventory".stocks` ni `"Inventory"."inventoryMovements"` sin ticket/acta.
   - Si se sanea legacy, incluir `ticket_id`, responsable, fecha, alcance y rollback manual.
   - Separar rollback del core nuevo y reversión manual de legacy.

4. Pruebas SQL:
   - No `UPDATE`/`DELETE` en `stock_ledger`.
   - No escritura manual en proyeccion.
   - No `POSTED` sin lineas ni contabilidad.
   - No cruce de `company_id`.
   - Validacion de FKs confirmadas.
   - Rollback sin afectar legacy.
   - Reportes futuros deben incluir compañia, nombre del informe, periodo y fecha de generacion.

Restricciones:
- No inventar FKs.
- No usar documentacion MySQL antigua como fuente final.
- No pasar a backend de posteo.
- No declarar VERDE mientras existan FKs corporativas diferidas o saneamiento legacy sin autorizacion.
