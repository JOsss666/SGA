# Envío de documentos parametrizados

El portal envía `POST /externalAccess/registerParamDoc`:

```json
{
  "company_key": "clave-de-compania",
  "access_key": "clave-de-acceso",
  "payload": {
    "schemaVersion": 1,
    "paramdoc_id": 5,
    "paramDoc_id": 5,
    "destiny": "createCaralNexo360Order",
    "values": {
      "thirdParty_id": 212,
      "clientId": 212,
      "store": "TI-001",
      "description": "Aviso diligenciado",
      "items": [{ "id": 1, "units": 2 }],
      "artworkFiles": []
    }
  }
}
```

Los IDs anteriores son ilustrativos. `values` incluye todos los valores capturados
por el formulario (ciudad, dimensiones, archivos, etc.), sin copiar su definición
de componentes. `payload` se guarda completo en `documents.specialConfig`.
Las credenciales del sobre de autenticación no se almacenan en esa columna.

El formulario fija `payload.values.thirdParty_id = userInfo.user_id` después de
los valores capturados. El backend verifica que corresponda al tercero del acceso
y lo usa como `thirdParty_id` del documento principal. `clientId` conserva su
función de cliente de la orden secundaria; puede ser otro cliente autorizado.
Los envíos anteriores sin `thirdParty_id` usan el tercero del acceso validado.

La compañía y la plantilla permitida se resuelven con el acceso externo vigente.
`destiny` debe coincidir con el configurado en la plantilla de la base de datos y
existir en la lista de acciones del backend. No se ejecutan rutas dinámicas.

La plantilla de `Custom.externalDocParameters` necesita configurar `execution`:

```json
{
  "destiny": "createCaralNexo360Order",
  "execution": {
    "store_id": 23,
    "created_by": 83,
    "allowedClientIds": [212],
    "componentValues": { "10": 5, "11": 2 }
  }
}
```

Estos IDs también son ejemplos; deben sustituirse por los autorizados de la
compañía. `created_by` corresponde a un usuario interno activo, no al ID del
tercero del portal. `store_id` identifica la tienda interna; `values.store` sigue
siendo el texto comercial capturado. Sin `allowedClientIds`, solo se admite al
tercero dueño del acceso. Los clientes se validan además contra la compañía.

`componentValues` mantiene el contrato actual de NEXO: valor por unidad de cada
producto descompuesto, no precio por preset. No hay reparto automático del precio
del preset. Si falta un precio, falla la orden secundaria; la parametrización permanece guardada.

Se crea y confirma primero `JSON Parametrization` (totales cero, documento de
datos), junto con su vínculo al proceso. Después se abre una segunda transacción:
la acción recibe `{payload, context, doc_id}`, avanza a la siguiente etapa,
crea allí la `Client Order` y agrega
`documents_group(main_doc_id, doc_id)` con la parametrización como principal.
El avance, su historial, la orden, sus movimientos, su vínculo y la agrupación se confirman
juntos. Si falla esta segunda transacción, el principal y su vínculo permanecen y la
instancia regresa a su etapa original.
La respuesta de error incluye `data.doc_id`, `secondary_doc_id: null` y
`secondary_status: "ERROR"`, y el mensaje informa que el principal quedó guardado.

La respuesta contiene `data.doc_id` del principal, `data.secondary_doc_id` de la
orden y sus detalles. El formulario solo se limpia después de confirmar éxito.
`data.paramDoc_id` identifica la plantilla autorizada y se devuelve como texto
para preservar IDs bigint. El formulario también envía `payload.paramDoc_id`,
que queda guardado en `specialConfig` junto al alias compatible `paramdoc_id`.
Si se envían ambos, deben coincidir. Los envíos anteriores siguen siendo válidos.
Cada envío crea un principal nuevo; no existe deduplicación ni un endpoint para
reintentar solo la secundaria. Ante éxito parcial, no reenviar todo el formulario
para intentar completar el principal ya guardado.

Para asociar el envío a una orden de producción, el sobre admite `instance_id`
y `step_instance` (también se acepta `step_id`, como envía el formulario actual).
Ambos nombres de etapa deben coincidir si se proporcionan juntos. Una etapa sin
instancia se rechaza. Si se omite la etapa, se usa la vigente de la instancia.

El backend verifica que la instancia esté activa, sea de la compañía autenticada
y corresponda al cliente autorizado de la orden. Bloquea su lectura durante la
transacción para impedir que cambie la etapa mientras se vinculan los documentos.
Si la etapa enviada ya cambió, devuelve HTTP 409. Se verifica nuevamente antes
de crear la orden: si cambió entre registros, se conserva el principal y no se
crea la secundaria en otra etapa.

La parametrización conserva la etapa original. La orden se registra en la
siguiente etapa (según `process_steps.order`) de la misma instancia, tanto en
`documents` como en `docs_instances`. El avance exige el rol del responsable
interno y conserva las validaciones de delegación y cierre del proceso. La respuesta incluye `data.instance_id` y `data.step_instance`.
La relación de principal/secundario en `documents_group` se conserva. La etapa de la orden se devuelve en `data.secondary.step_instance`;
`data.step_instance` sigue indicando la etapa del documento principal.
Sin instancia, el flujo independiente sigue funcionando sin avance.
El contexto se obtiene del sobre validado; `payload.values` no puede sustituirlo.

En Nexo360, al crear la orden con instancia también se crea un subproceso activo.
Se reutiliza `Process.orders_delegation_config` de la compañía y del proceso padre:
`child_process_id` debe identificar un proceso activo y `child_initial_step_id`
debe ser su primera etapa según `process_steps.order` (desempate por ID).
Si falta esta configuración o no es válida, se revierte la transacción secundaria.
El subproceso usa el cliente de la orden y el responsable interno del contexto;
`parent_id` apunta a la instancia principal y `parent_step` a su etapa «Orden».
Se registra su historial mediante `createProcessInstance` y se vincula la misma
Client Order a su primera etapa mediante `docs_instances`, sin duplicar el
documento ni sus movimientos. El vínculo a «Orden» del principal se conserva.
La respuesta incluye `data.secondary.subprocess` con `instance_id`, `process_id`
y `step_instance`; sin instancia principal devuelve `null`.
El subproceso y su vínculo comparten la transacción del avance y de la orden:
cualquier fallo revierte todos esos cambios, conservando la parametrización.
La asignación posterior a proveedores mantiene su flujo existente de delegaciones
y crea sus propias instancias bajo la etapa «En producción».

No se incluyen migraciones: se verificó que `specialConfig` ya es `jsonb` y que
existe el valor de enum `JSON Parametrization`. No se modificó la configuración
de producción. La regla de precios y los IDs reales requieren configuración.
