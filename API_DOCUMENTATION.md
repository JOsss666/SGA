# API_DOCUMENTATION

Documentación técnica generada a partir de `api/routes/index.routes.js` y los controladores en `api/controllers`.

> Nota: varios controladores leen el cuerpo manualmente con `req.on("data")` y responden con `Content-Type: text/plain` aunque el contenido sea JSON serializado. Los tipos y obligatoriedad se infieren del código existente; cuando el controlador usa filtros condicionales, el campo queda marcado como "Según operación".

## Base URL y Convenciones

- Base local sugerida: `http://localhost:3000`.
- La mayoría de endpoints usa `POST` con `Content-Type: application/json`.
- `uploadFiles` usa `multipart/form-data`; `upload-chunk` usa `multipart/form-data` con campo de archivo `chunk`.
- No se observaron parámetros de ruta tipo `/:id` en `index.routes.js`; los identificadores viajan en `body` o `query`.
- La ruta `/electronicFacturationController.getDocumentFullInfo` está documentada tal como aparece en `index.routes.js`, aunque su formato no sigue el prefijo REST usado por las demás rutas de facturación electrónica.

## SGA General

### POST /uploadFiles - Upload Files

**Nombre y propósito:** Recibe archivos o fragmentos y los almacena/relaciona con la compañía.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/uploadFiles` | `controller.uploadFile` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `controller.uploadFile` en `api/controllers/index.controller.js:44`. Tablas/vistas: `Ecosystem.attached`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo; requiere archivo multipart/form-data.

**Ejemplo de uso**

```js
const form = new FormData();
form.append("info", JSON.stringify({ company_id: 1, user_id: 1 }));
form.append("files", fileInput.files[0]);
const response = await fetch(`${BASE_URL}/uploadFiles`, { method: "POST", body: form });
const data = await response.json();
```

Respuesta esperada:

```json
{
  "urls": [{ "id": 1, "url": "https://..." }]
}
```

### POST /upload-chunk - Upload chunk

**Nombre y propósito:** Recibe archivos o fragmentos y los almacena/relaciona con la compañía.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/upload-chunk` | `controller.uploadChunk` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `chunkIndex` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `fileId` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.uploadChunk` en `api/controllers/index.controller.js:8`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: requiere archivo multipart/form-data.

**Ejemplo de uso**

```js
const form = new FormData();
form.append("fileId", "upload-001");
form.append("chunkIndex", "0");
form.append("chunk", chunkBlob);
const response = await fetch(`${BASE_URL}/upload-chunk`, { method: "POST", body: form });
const data = await response.json();
```

Respuesta esperada:

```json
{
  "message": "Chunk recibido"
}
```

### POST /merge-chunks - Merge chunks

**Nombre y propósito:** Une fragmentos previamente cargados en un archivo final.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/merge-chunks` | `controller.mergeChunks` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `fileId` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `fileName` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.mergeChunks` en `api/controllers/index.controller.js:18`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/merge-chunks`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "fileId": 1,
    "fileName": "example_fileName"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "message": "Archivo ensamblado correctamente",
  "path": "/ruta/final/archivo.ext"
}
```

### POST /processAiRequest - Process Ai Request

**Nombre y propósito:** Envía una solicitud al asistente IA con contexto de usuario y adjuntos.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/processAiRequest` | `controller.processAiRequest` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `attached` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `text` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `userInfo` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.processAiRequest` en `api/controllers/index.controller.js:2141`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/processAiRequest`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "attached": [],
    "text": "example_text",
    "userInfo": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getAttachedFiles - Get Attached Files

**Nombre y propósito:** Consulta getAttachedFiles y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getAttachedFiles` | `controller.getAttachedFiles` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedDocs` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `controller.getAttachedFiles` en `api/controllers/index.controller.js:87`. Tablas/vistas: `Ecosystem.attached`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getAttachedFiles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedDocs": [],
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /logIn - Log In

**Nombre y propósito:** Autentica usuario por correo y contraseña y devuelve datos de sesión/acceso.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/logIn` | `controller.logIn` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `mail` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `pass` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.logIn` en `api/controllers/index.controller.js:596`. Tablas/vistas: `Ecosystem.companies`, `Ecosystem.users`, `Ecosystem.users_access`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/logIn`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "mail": "example_mail",
    "pass": "example_pass"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "user": { "id": 1 },
  "company": { "id": 1 },
  "access": {}
}
```

### POST /logOut - Log Out

**Nombre y propósito:** Cierra la sesión lógica del usuario actualizando su acceso.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/logOut` | `controller.logOut` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `controller.logOut` en `api/controllers/index.controller.js:645`. Tablas/vistas: `Ecosystem.users_access`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/logOut`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /signUp - Sign Up

**Nombre y propósito:** Ejecuta la operación signUp expuesta por el controlador.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/signUp` | `controller.signUp` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `accessCerticloud` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `accessContability` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `accessCtools` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `accessFacturation` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `accessInventory` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `accessProcess` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `accessTreasury` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `mail` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `pass` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `userRol` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.signUp` en `api/controllers/index.controller.js:668`. Tablas/vistas: `Ecosystem.users`, `Ecosystem.users_access`, `Ecosystem.users_config`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/signUp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "accessCerticloud": 1000,
    "accessContability": 1000,
    "accessCtools": 1000,
    "accessFacturation": 1000,
    "accessInventory": 1000,
    "accessProcess": 1000,
    "accessTreasury": 1000,
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /deleteUser - Delete User

**Nombre y propósito:** Elimina o anula registros asociados a deleteUser.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/deleteUser` | `controller.deleteUser` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `controller.deleteUser` en `api/controllers/index.controller.js:739`. Tablas/vistas: `Ecosystem.users`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/deleteUser`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getRoles - Get Roles

**Nombre y propósito:** Consulta getRoles y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getRoles` | `controller.getRoles` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `controller.getRoles` en `api/controllers/index.controller.js:574`. Tablas/vistas: `Ecosystem.roles`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getRoles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getDocuments - Get Documents

**Nombre y propósito:** Consulta getDocuments y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getDocuments` | `controller.getDocuments` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedTypes` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |

**Lógica del controlador**

Controlador `controller.getDocuments` en `api/controllers/index.controller.js:1833`. Tablas/vistas: `Ecosystem.documents`, `Process.process_instance`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getDocuments`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedTypes": [],
    "company_id": 1,
    "id": 1,
    "instance_id": 1,
    "thirdParty_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getCompanyInfo - Get Company Info

**Nombre y propósito:** Consulta getCompanyInfo y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getCompanyInfo` | `controller.getCompanyInfo` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

No requiere body.

**Lógica del controlador**

Controlador `controller.getCompanyInfo` en `api/controllers/index.controller.js:273`. Tablas/vistas: `Ecosystem.account_plans`, `Ecosystem.companies`, `Ecosystem.company_settings`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getCompanyInfo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({})
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getUserInfo - Get User Info

**Nombre y propósito:** Consulta getUserInfo y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getUserInfo` | `controller.getUserInfo` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

No requiere body.

**Lógica del controlador**

Controlador `controller.getUserInfo` en `api/controllers/index.controller.js:172`. Tablas/vistas: `Ecosystem.roles`, `Ecosystem.users`, `Ecosystem.users_access`, `Ecosystem.users_config`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getUserInfo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({})
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getUsers - Get Users

**Nombre y propósito:** Consulta getUsers y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getUsers` | `controller.getUsers` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |

**Lógica del controlador**

Controlador `controller.getUsers` en `api/controllers/index.controller.js:217`. Tablas/vistas: `Ecosystem.roles`, `Ecosystem.users`, `Ecosystem.users_access`, `Ecosystem.users_config`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getUsers`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "status": "example_status"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getSuppliers - Get Suppliers

**Nombre y propósito:** Consulta getSuppliers y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getSuppliers` | `controller.getThirdParties` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `comercialInfo` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `limit` | Int/String | Según operación | Límite de registros devueltos. |

**Lógica del controlador**

Controlador `controller.getThirdParties` en `api/controllers/index.controller.js:1905`. Tablas/vistas: `Ecosystem.mv_thirdparty_account_balances`, `Ecosystem.thirdParties`, `Ecosystem.thirdPartyComercialInfo`, `Ecosystem.thirdparties`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getSuppliers`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "comercialInfo": 1000,
    "company_id": 1,
    "id": 1,
    "limit": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getThirdParties - Get Third Parties

**Nombre y propósito:** Consulta getThirdParties y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getThirdParties` | `controller.getThirdParties` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `comercialInfo` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `limit` | Int/String | Según operación | Límite de registros devueltos. |

**Lógica del controlador**

Controlador `controller.getThirdParties` en `api/controllers/index.controller.js:1905`. Tablas/vistas: `Ecosystem.mv_thirdparty_account_balances`, `Ecosystem.thirdParties`, `Ecosystem.thirdPartyComercialInfo`, `Ecosystem.thirdparties`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getThirdParties`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "comercialInfo": 1000,
    "company_id": 1,
    "id": 1,
    "limit": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /updateThirdPartyGeneralInfo - Update Third Party General Info

**Nombre y propósito:** Actualiza el estado o datos asociados a updateThirdPartyGeneralInfo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/updateThirdPartyGeneralInfo` | `controller.updateThirdPartyGeneralInfo` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `address` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `city` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `country` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `first_name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `first_surname` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `indentification_number` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `indentification_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `mail` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `phone` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `second_name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `second_surname` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |

**Lógica del controlador**

Controlador `controller.updateThirdPartyGeneralInfo` en `api/controllers/index.controller.js:2369`. Tablas/vistas: `Ecosystem.thirdparties`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/updateThirdPartyGeneralInfo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "address": "example_address",
    "city": "example_city",
    "country": "example_country",
    "first_name": "example_first_name",
    "first_surname": "example_first_surname",
    "id": 1,
    "indentification_number": 1000,
    "indentification_type": "example_indentification_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /updateThirdPartyComercialInfo - Update Third Party Comercial Info

**Nombre y propósito:** Actualiza el estado o datos asociados a updateThirdPartyComercialInfo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/updateThirdPartyComercialInfo` | `controller.updateThirdPartyComercialInfo` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `comercial_state` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `credit` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `credit_term` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `credit_value` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `interest_rate` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.updateThirdPartyComercialInfo` en `api/controllers/index.controller.js:2425`. Tablas/vistas: `Ecosystem.thirdPartyComercialInfo`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/updateThirdPartyComercialInfo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "comercial_state": 1000,
    "credit": 1000,
    "credit_term": 1000,
    "credit_value": 1000,
    "id": 1,
    "interest_rate": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createThirdParty - Create Third Party

**Nombre y propósito:** Crea o registra createThirdParty usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createThirdParty` | `controller.createThirdParty` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `IVA_responsability` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `address` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `attachedRut` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `city` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `comercial_state` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `country` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `credit` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `credit_term` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `credit_value` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `economic_activity` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `first_name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `first_surname` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `indentification_number` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `indentification_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `interest_rate` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `mail` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `phone` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `regime` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `retention_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `second_name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `second_surname` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |

**Lógica del controlador**

Controlador `controller.createThirdParty` en `api/controllers/index.controller.js:2013`. Tablas/vistas: `Ecosystem.thirdPartyComercialInfo`, `Ecosystem.thirdPartyTaxInfo`, `Ecosystem.thirdparties`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createThirdParty`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "IVA_responsability": 1000,
    "address": "example_address",
    "attachedRut": [],
    "city": "example_city",
    "comercial_state": 1000,
    "company_id": 1,
    "country": "example_country",
    "credit": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getThirdPartyDetails - Get Third Party Details

**Nombre y propósito:** Consulta getThirdPartyDetails y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getThirdPartyDetails` | `controller.getThirdPartyDetails` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `controller.getThirdPartyDetails` en `api/controllers/index.controller.js:1981`. Tablas/vistas: `Ecosystem.thirdParties`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getThirdPartyDetails`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getStores - Get Stores

**Nombre y propósito:** Consulta getStores y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getStores` | `controller.getStores` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedStores` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `controller.getStores` en `api/controllers/index.controller.js:531`. Tablas/vistas: `Ecosystem.stores`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getStores`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedStores": [],
    "company_id": 1,
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createAccountPlan - Create Account Plan

**Nombre y propósito:** Crea o registra createAccountPlan usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createAccountPlan` | `controller.createAccountsPlan` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `typePLan` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.createAccountsPlan` en `api/controllers/index.controller.js:312`. Tablas/vistas: `Ecosystem.account_plans`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createAccountPlan`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "name": "example_name",
    "typePLan": "example_typePLan"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createCostCenter - Create Cost Center

**Nombre y propósito:** Crea o registra createCostCenter usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createCostCenter` | `controller.createCostCenter` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `code` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `parent_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `path` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.createCostCenter` en `api/controllers/index.controller.js:343`. Tablas/vistas: `Ecosystem.costCenters`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createCostCenter`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "code": 1,
    "company_id": 1,
    "description": "example_description",
    "name": "example_name",
    "parent_id": 1,
    "path": "example_path"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getCostCenters - Get Cost Centers

**Nombre y propósito:** Consulta getCostCenters y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getCostCenters` | `controller.getCostCenters` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedCostCenters` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `controller.getCostCenters` en `api/controllers/index.controller.js:372`. Tablas/vistas: `Ecosystem.costCenters`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getCostCenters`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedCostCenters": 1000,
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createStore - Create Store

**Nombre y propósito:** Crea o registra createStore usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createStore` | `controller.createStore` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `address` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `city` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `zone` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.createStore` en `api/controllers/index.controller.js:480`. Tablas/vistas: `Ecosystem.stores`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createStore`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "address": "example_address",
    "city": "example_city",
    "company_id": 1,
    "name": "example_name",
    "zone": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /deleteStore - Delete Store

**Nombre y propósito:** Elimina o anula registros asociados a deleteStore.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/deleteStore` | `controller.deleteStore` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `controller.deleteStore` en `api/controllers/index.controller.js:508`. Tablas/vistas: `Ecosystem.stores`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/deleteStore`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createBussines - Create Bussines

**Nombre y propósito:** Crea o registra createBussines usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createBussines` | `controller.createBussines` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `photo` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.createBussines` en `api/controllers/index.controller.js:412`. Tablas/vistas: `Ecosystem.bussines`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createBussines`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "description": "example_description",
    "name": "example_name",
    "photo": "example_photo"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getBussines - Get Bussines

**Nombre y propósito:** Consulta getBussines y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getBussines` | `controller.getBussines` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedBussines` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `controller.getBussines` en `api/controllers/index.controller.js:440`. Tablas/vistas: `Ecosystem.bussines`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getBussines`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedBussines": [],
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getAccountsPlan - Get Accounts Plan

**Nombre y propósito:** Consulta getAccountsPlan y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getAccountsPlan` | `controller.getAccountsPlan` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `accountPlanId` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `accountPlanType` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `controller.getAccountsPlan` en `api/controllers/index.controller.js:803`. Tablas/vistas: `Ecosystem.account_plans`, `Ecosystem.contable_accounts`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getAccountsPlan`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "accountPlanId": 1,
    "accountPlanType": "example_accountPlanType",
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getAccounts - Get Accounts

**Nombre y propósito:** Consulta getAccounts y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getAccounts` | `controller.getAccounts` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `controller.getAccounts` en `api/controllers/index.controller.js:845`. Tablas/vistas: `Ecosystem.contable_accounts`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getAccounts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /insertNewAccount - Insert New Account

**Nombre y propósito:** Ejecuta la operación insertNewAccount expuesta por el controlador.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/insertNewAccount` | `controller.insertNewAccount` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `accountPlanId` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `code` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |
| `typePlanAccount` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.insertNewAccount` en `api/controllers/index.controller.js:763`. Tablas/vistas: `Ecosystem.contable_accounts`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/insertNewAccount`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "accountPlanId": 1,
    "code": 1,
    "company_id": 1,
    "name": "example_name",
    "type": "example_type",
    "typePlanAccount": "example_typePlanAccount"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createTax - Create Tax

**Nombre y propósito:** Crea o registra createTax usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createTax` | `controller.createTax` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `account_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `base` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `code` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `isRetention` | Boolean | Según operación | Campo leído por el controlador desde la solicitud. |
| `parent_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `path` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `rate` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.createTax` en `api/controllers/index.controller.js:884`. Tablas/vistas: `Ecosystem.taxes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createTax`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "account_id": 1,
    "base": 1000,
    "code": 1,
    "company_id": 1,
    "isRetention": true,
    "parent_id": 1,
    "path": "example_path",
    "rate": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /deleteTax - Delete Tax

**Nombre y propósito:** Elimina o anula registros asociados a deleteTax.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/deleteTax` | `controller.deleteTax` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `taxes` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.deleteTax` en `api/controllers/index.controller.js:1037`. Tablas/vistas: `Ecosystem.taxes`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/deleteTax`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "taxes": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getTaxes - Get Taxes

**Nombre y propósito:** Consulta getTaxes y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getTaxes` | `controller.getTaxes` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `limit` | Int/String | Según operación | Límite de registros devueltos. |

**Lógica del controlador**

Controlador `controller.getTaxes` en `api/controllers/index.controller.js:924`. Tablas/vistas: `Ecosystem.contable_accounts`, `Ecosystem.taxes`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getTaxes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1,
    "limit": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getConceptTaxes - Get Concept Taxes

**Nombre y propósito:** Consulta getConceptTaxes y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getConceptTaxes` | `controller.getConceptTaxes` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `concept_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.getConceptTaxes` en `api/controllers/index.controller.js:997`. Tablas/vistas: `Ecosystem.concept_taxes`, `Ecosystem.contable_accounts`, `Ecosystem.taxes`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getConceptTaxes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "concept_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createTaxCategory - Create Tax Category

**Nombre y propósito:** Crea o registra createTaxCategory usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createTaxCategory` | `controller.createTaxCategory` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `code` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `parent_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `path` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.createTaxCategory` en `api/controllers/index.controller.js:1063`. Tablas/vistas: `Ecosystem.teaxesCategories`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createTaxCategory`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "code": 1,
    "company_id": 1,
    "name": "example_name",
    "parent_id": 1,
    "path": "example_path"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getTaxCategories - Get Tax Categories

**Nombre y propósito:** Consulta getTaxCategories y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getTaxCategories` | `controller.getTaxCategory` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `controller.getTaxCategory` en `api/controllers/index.controller.js:1091`. Tablas/vistas: `Ecosystem.teaxesCategories`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getTaxCategories`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createConcept - Create Concept

**Nombre y propósito:** Crea o registra createConcept usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createConcept` | `controller.createConcept` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `account_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `selectedTaxes` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.createConcept` en `api/controllers/index.controller.js:1122`. Tablas/vistas: `Ecosystem.concept_taxes`, `Ecosystem.concepts`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createConcept`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "account_id": 1,
    "company_id": 1,
    "name": "example_name",
    "selectedTaxes": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /deleteConcept - Delete Concept

**Nombre y propósito:** Elimina o anula registros asociados a deleteConcept.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/deleteConcept` | `controller.deleteConcept` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `concepts` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.deleteConcept` en `api/controllers/index.controller.js:1252`. Tablas/vistas: `Ecosystem.concepts`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/deleteConcept`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "concepts": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getConcepts - Get Concepts

**Nombre y propósito:** Consulta getConcepts y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getConcepts` | `controller.getConcepts` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedConcepts` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |

**Lógica del controlador**

Controlador `controller.getConcepts` en `api/controllers/index.controller.js:1193`. Tablas/vistas: `Ecosystem.concepts`, `Ecosystem.contable_accounts`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getConcepts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedConcepts": [],
    "company_id": 1,
    "id": 1,
    "status": "example_status"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getDocParams - Get Doc Params

**Nombre y propósito:** Consulta getDocParams y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getDocParams` | `controller.getDocParams` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `docType` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.getDocParams` en `api/controllers/index.controller.js:1372`. Tablas/vistas: `Ecosystem.docs_params`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getDocParams`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "docType": "example_docType"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createPaymentMethod - Create Payment Method

**Nombre y propósito:** Crea o registra createPaymentMethod usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createPaymentMethod` | `controller.createPaymentMethod` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `account_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `code` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `currency` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |

**Lógica del controlador**

Controlador `controller.createPaymentMethod` en `api/controllers/index.controller.js:1282`. Tablas/vistas: `Ecosystem.payment_methods`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createPaymentMethod`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "account_id": 1,
    "code": 1,
    "company_id": 1,
    "currency": "example_currency",
    "name": "example_name",
    "status": "example_status",
    "type": "example_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getPaymentMethods - Get Payment Methods

**Nombre y propósito:** Consulta getPaymentMethods y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getPaymentMethods` | `controller.getPaymentMethods` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedPaymentMethods` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `for_wallet` | Boolean | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.getPaymentMethods` en `api/controllers/index.controller.js:1318`. Tablas/vistas: `Ecosystem.payment_methods`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getPaymentMethods`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedPaymentMethods": [],
    "company_id": 1,
    "for_wallet": true
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /createTransaction - Create Transaction

**Nombre y propósito:** Crea o registra createTransaction usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/createTransaction` | `controller.createTransaction` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `bussines_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `concept_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `costCenter_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `docType` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_date` | String(Date/ISO) | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_id` | Int/String | Según operación | Identificador del documento relacionado. |
| `doc_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `subTotal` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |
| `total` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `transactionDetails` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `controller.createTransaction` en `api/controllers/index.controller.js:1408`. Tablas/vistas: `Ecosystem.documents`, `Ecosystem.mv_thirdparty_account_balances`, `Ecosystem.transaction_detail`, `Ecosystem.transactions`, `Facturation.mv_shift_payment_summaries`, `Facturation.shift_settlement_details`, `Treasury.accounts_receivable`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/createTransaction`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "bussines_id": 1,
    "company_id": 1,
    "concept_id": 1,
    "costCenter_id": 1,
    "docType": "example_docType",
    "doc_date": "2026-04-18",
    "doc_id": 1,
    "doc_type": "example_doc_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /updateTransactionState - Update Transaction State

**Nombre y propósito:** Actualiza el estado o datos asociados a updateTransactionState.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/updateTransactionState` | `controller.updateTransactionState` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `transaction_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.updateTransactionState` en `api/controllers/index.controller.js:1791`. Tablas/vistas: `Ecosystem.transaction_detail`, `Ecosystem.transactions`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/updateTransactionState`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "status": "example_status",
    "transaction_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getTransactions - Get Transactions

**Nombre y propósito:** Consulta getTransactions y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getTransactions` | `controller.getTransactions` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `controller.getTransactions` en `api/controllers/index.controller.js:1597`. Tablas/vistas: `Ecosystem.bussines`, `Ecosystem.concepts`, `Ecosystem.costCenters`, `Ecosystem.stores`, `Ecosystem.thirdparties`, `Ecosystem.transactions`, `Ecosystem.users`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getTransactions`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getTransactionDetails - Get Transaction Details

**Nombre y propósito:** Consulta getTransactionDetails y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getTransactionDetails` | `controller.getTransactionDetails` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `account_code` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `account_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `transaction_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.getTransactionDetails` en `api/controllers/index.controller.js:1685`. Tablas/vistas: `Ecosystem.contable_accounts`, `Ecosystem.documents`, `Ecosystem.payment_methods`, `Ecosystem.thirdparties`, `Ecosystem.transaction_detail`, `Ecosystem.transactions`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getTransactionDetails`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "account_code": 1000,
    "account_id": 1,
    "company_id": 1,
    "end_date": "2026-04-18",
    "start_date": "2026-04-18",
    "status": "example_status",
    "transaction_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getTransactionsData - Get Transactions Data

**Nombre y propósito:** Consulta getTransactionsData y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getTransactionsData` | `controller.getTransactionsData` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `period` | String | Según operación | Campo leído por el controlador desde la solicitud. |

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `doc_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `controller.getTransactionsData` en `api/controllers/index.controller.js:2275`. Tablas/vistas: `Ecosystem.transactions`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getTransactionsData`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "doc_type": "example_doc_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getDocAnalyticDocNumber - Get Doc Analytic Doc Number

**Nombre y propósito:** Consulta getDocAnalyticDocNumber y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getDocAnalyticDocNumber` | `controller.getDocAnalyticDocNumber` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `period` | String | Según operación | Campo leído por el controlador desde la solicitud. |

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `dateEnd` | String(Date/ISO) | Según operación | Campo leído por el controlador desde la solicitud. |
| `dateStart` | String(Date/ISO) | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `filterField` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `filterValue` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `limit` | Int/String | Según operación | Límite de registros devueltos. |
| `orderBy` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `orderDirection` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `period` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |

**Lógica del controlador**

Controlador `controller.getDocAnalyticDocNumber` en `api/controllers/index.controller.js:2163`. Tablas/vistas: `Ecosystem.documents`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getDocAnalyticDocNumber`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "dateEnd": "2026-04-18",
    "dateStart": "2026-04-18",
    "doc_type": "example_doc_type",
    "filterField": "example_filterField",
    "filterValue": 1000,
    "limit": 1,
    "orderBy": "example_orderBy",
    "orderDirection": "example_orderDirection"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getDocAnalyticDocNumberTable - Get Doc Analytic Doc Number Table

**Nombre y propósito:** Consulta getDocAnalyticDocNumberTable y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getDocAnalyticDocNumberTable` | `controller.getDocAnalyticDocNumberTable` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `period` | String | Según operación | Campo leído por el controlador desde la solicitud. |

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `doc_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |

**Lógica del controlador**

Controlador `controller.getDocAnalyticDocNumberTable` en `api/controllers/index.controller.js:2317`. Tablas/vistas: `Ecosystem.documents`, `Ecosystem.transaction_detail`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getDocAnalyticDocNumberTable`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "doc_type": "example_doc_type",
    "type": "example_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Inventario

### POST /getCellars - Get Cellars

**Nombre y propósito:** Consulta getCellars y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getCellars` | `inventoryController.getCellars` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.getCellars` en `api/controllers/inventoryController.js:401`. Tablas/vistas: `Inventory.cellars`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getCellars`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getCategories - Get Categories

**Nombre y propósito:** Consulta getCategories y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getCategories` | `inventoryController.getCategories` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `inventoryController.getCategories` en `api/controllers/inventoryController.js:1226`. Tablas/vistas: `Inventory.categories`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getCategories`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/createCategory - Create Category

**Nombre y propósito:** Crea o registra createCategory usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/createCategory` | `inventoryController.createCatetory` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `parent_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `path` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `photo` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `slug` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |

**Lógica del controlador**

Controlador `inventoryController.createCatetory` en `api/controllers/inventoryController.js:23`. Tablas/vistas: `Inventory.categories`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/createCategory`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "description": "example_description",
    "name": "example_name",
    "parent_id": 1,
    "path": "example_path",
    "photo": "example_photo",
    "slug": "example_slug",
    "status": "example_status"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getSubCategories - Get Sub Categories

**Nombre y propósito:** Consulta getSubCategories y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getSubCategories` | `inventoryController.getSubCategories` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

No requiere body.

**Lógica del controlador**

Controlador `inventoryController.getSubCategories` en `api/controllers/inventoryController.js:4`. Tablas/vistas: `Inventory.categories`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getSubCategories`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({})
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/createSubCategory - Create Sub Category

**Nombre y propósito:** Crea o registra createSubCategory usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/createSubCategory` | `inventoryController.createCatetory` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `parent_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `path` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `photo` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `slug` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |

**Lógica del controlador**

Controlador `inventoryController.createCatetory` en `api/controllers/inventoryController.js:23`. Tablas/vistas: `Inventory.categories`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/createSubCategory`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "description": "example_description",
    "name": "example_name",
    "parent_id": 1,
    "path": "example_path",
    "photo": "example_photo",
    "slug": "example_slug",
    "status": "example_status"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getProducts - Get Products

**Nombre y propósito:** Consulta getProducts y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getProducts` | `inventoryController.getProducts` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `category_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |

**Lógica del controlador**

Controlador `inventoryController.getProducts` en `api/controllers/inventoryController.js:55`. Tablas/vistas: `Ecosystem.concepts`, `Ecosystem.contable_accounts`, `Ecosystem.taxes`, `Inventory.categories`, `Inventory.product_categories`, `Inventory.products&services`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getProducts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "category_id": 1,
    "company_id": 1,
    "type": "example_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getComercialProducts - Get Comercial Products

**Nombre y propósito:** Consulta getComercialProducts y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getComercialProducts` | `inventoryController.getComercialProducts` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `list_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.getComercialProducts` en `api/controllers/inventoryController.js:139`. Tablas/vistas: `Ecosystem.concepts`, `Ecosystem.contable_accounts`, `Ecosystem.taxes`, `Inventory.categories`, `Inventory.priceList_items`, `Inventory.product_categories`, `Inventory.products&services`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getComercialProducts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1,
    "list_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/createProduct - Create Product

**Nombre y propósito:** Crea o registra createProduct usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/createProduct` | `inventoryController.createProduct` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `category_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `code` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `photo` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `purchaseConcept` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `sellConcept` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `stock` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `tax_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `taxed` | Boolean | Según operación | Campo leído por el controlador desde la solicitud. |
| `type_product` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `units` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.createProduct` en `api/controllers/inventoryController.js:234`. Tablas/vistas: `Inventory.product_categories`, `Inventory.products&services`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/createProduct`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "category_id": 1,
    "code": 1,
    "company_id": 1,
    "description": "example_description",
    "name": "example_name",
    "photo": "example_photo",
    "purchaseConcept": 1000,
    "sellConcept": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getPricesListItems - Get Prices List Items

**Nombre y propósito:** Consulta getPricesListItems y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getPricesListItems` | `inventoryController.getPricesListItems` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `list_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.getPricesListItems` en `api/controllers/inventoryController.js:307`. Tablas/vistas: `Inventory.priceList_items`, `Inventory.products&services`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getPricesListItems`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1,
    "list_id": 1,
    "product_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/createCellar - Create Cellar

**Nombre y propósito:** Crea o registra createCellar usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/createCellar` | `inventoryController.createCellar` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `address` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.createCellar` en `api/controllers/inventoryController.js:373`. Tablas/vistas: `Inventory.cellars`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/createCellar`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "address": "example_address",
    "company_id": 1,
    "name": "example_name",
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getCellars - Get Cellars

**Nombre y propósito:** Consulta getCellars y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getCellars` | `inventoryController.getCellars` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.getCellars` en `api/controllers/inventoryController.js:401`. Tablas/vistas: `Inventory.cellars`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getCellars`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/createPriceList - Create Price List

**Nombre y propósito:** Crea o registra createPriceList usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/createPriceList` | `inventoryController.createPriceList` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `list_description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `list_name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.createPriceList` en `api/controllers/inventoryController.js:440`. Tablas/vistas: `Inventory.pricesList`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/createPriceList`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "list_description": "example_list_description",
    "list_name": "example_list_name",
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getPricesList - Get Prices List

**Nombre y propósito:** Consulta getPricesList y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getPricesList` | `inventoryController.getPricesList` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `limit` | Int/String | Según operación | Límite de registros devueltos. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.getPricesList` en `api/controllers/inventoryController.js:459`. Tablas/vistas: `Ecosystem.stores`, `Inventory.prices_lists`, `Inventory.store_pricesLists`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getPricesList`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1,
    "limit": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/deletePriceList - Delete Price List

**Nombre y propósito:** Elimina o anula registros asociados a deletePriceList.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/deletePriceList` | `inventoryController.deletePriceList` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `lists` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.deletePriceList` en `api/controllers/inventoryController.js:526`. Tablas/vistas: `Inventory.pricesList`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/deletePriceList`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "lists": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/updateProductList - Update Product List

**Nombre y propósito:** Actualiza el estado o datos asociados a updateProductList.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/updateProductList` | `inventoryController.updateProductList` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `list_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `price_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `stock_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `unit_value` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.updateProductList` en `api/controllers/inventoryController.js:552`. Tablas/vistas: `Inventory.prices`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/updateProductList`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "list_id": 1,
    "price_id": 1,
    "product_id": 1,
    "stock_id": 1,
    "store_id": 1,
    "unit_value": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getStocks - Get Stocks

**Nombre y propósito:** Consulta getStocks y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getStocks` | `inventoryController.getStocks` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `cellar_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `minStock` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.getStocks` en `api/controllers/inventoryController.js:992`. Tablas/vistas: `Ecosystem.concepts`, `Inventory.products&services`, `Inventory.stocks`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getStocks`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "cellar_id": 1,
    "company_id": 1,
    "minStock": 1000,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getPriceStock - Get Price Stock

**Nombre y propósito:** Consulta getPriceStock y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getPriceStock` | `inventoryController.getPriceStock` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `list_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.getPriceStock` en `api/controllers/inventoryController.js:583`. Tablas/vistas: `Inventory.stocks`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getPriceStock`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "list_id": 1,
    "product_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/newEntry - New Entry

**Nombre y propósito:** Crea o registra newEntry usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/newEntry` | `inventoryController.newEntry` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `cellar_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `cost` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `entry_status` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `list_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `section_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `supplier_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `units` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `inventoryController.newEntry` en `api/controllers/inventoryController.js:602`. Tablas/vistas: `Inventory.entries`, `Inventory.pricesproducts&services`, `Inventory.stocks`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/newEntry`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "cellar_id": 1,
    "company_id": 1,
    "cost": 1000,
    "entry_status": "example_entry_status",
    "list_id": 1,
    "product_id": 1,
    "section_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/newDeparture - New Departure

**Nombre y propósito:** Crea o registra newDeparture usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/newDeparture` | `inventoryController.newDeparture` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `cellar_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `departure_status` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `departure_value` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `list_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `section_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `stock_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `units` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `inventoryController.newDeparture` en `api/controllers/inventoryController.js:678`. Tablas/vistas: `Inventory.departures`, `Inventory.pricesproducts&services`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/newDeparture`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "cellar_id": 1,
    "company_id": 1,
    "departure_status": "example_departure_status",
    "departure_value": 1000,
    "list_id": 1,
    "product_id": 1,
    "section_id": 1,
    "stock_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/newMovement - New Movement

**Nombre y propósito:** Crea o registra newMovement usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/newMovement` | `inventoryController.newMovement2` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `movement_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.newMovement2` en `api/controllers/inventoryController.js:883`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/newMovement`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "movement_type": "example_movement_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getMovements - Get Movements

**Nombre y propósito:** Consulta getMovements y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getMovements` | `inventoryController.getMovements` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `cellar_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `cellar_name` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `limit` | Int/String | Según operación | Límite de registros devueltos. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.getMovements` en `api/controllers/inventoryController.js:929`. Tablas/vistas: `Inventory.inventoryMovements`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getMovements`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "cellar_id": 1,
    "cellar_name": "example_cellar_name",
    "company_id": 1,
    "limit": 1,
    "product_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/deleteMovement - Delete Movement

**Nombre y propósito:** Elimina o anula registros asociados a deleteMovement.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/deleteMovement` | `inventoryController.deleteMovement` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `movements` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.deleteMovement` en `api/controllers/inventoryController.js:967`. Tablas/vistas: `Inventory.inventoryMovements`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/deleteMovement`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "movements": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getDepartures - Get Departures

**Nombre y propósito:** Consulta getDepartures y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getDepartures` | `inventoryController.getDepartures` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `cellar_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.getDepartures` en `api/controllers/inventoryController.js:1075`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getDepartures`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "cellar_id": 1,
    "company_id": 1,
    "product_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getRotation - Get Rotation

**Nombre y propósito:** Consulta getRotation y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getRotation` | `inventoryController.getRotation` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `cellar_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `finalDate` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `initialDate` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `product_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |

**Lógica del controlador**

Controlador `inventoryController.getRotation` en `api/controllers/inventoryController.js:1138`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getRotation`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "cellar_id": 1,
    "company_id": 1,
    "finalDate": "2026-04-18",
    "initialDate": "2026-04-18",
    "product_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/getKardex - Get Kardex

**Nombre y propósito:** Consulta getKardex y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/getKardex` | `inventoryController.getKardex` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |

**Lógica del controlador**

Controlador `inventoryController.getKardex` en `api/controllers/inventoryController.js:1244`. Tablas/vistas: `Ecosystem.thirdparties`, `Inventory.inventoryMovements`, `Inventory.products&services`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/getKardex`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "end_date": "2026-04-18",
    "start_date": "2026-04-18"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /getServiceMovements - Get Service Movements

**Nombre y propósito:** Consulta getServiceMovements y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/getServiceMovements` | `inventoryController.getServicesMovements` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `doc_id` | Int/String | Según operación | Identificador del documento relacionado. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |

**Lógica del controlador**

Controlador `inventoryController.getServicesMovements` en `api/controllers/inventoryController.js:1317`. Tablas/vistas: `Ecosystem.concepts`, `Inventory.products&services`, `Inventory.services_movement`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/getServiceMovements`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "doc_id": 1,
    "instance_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/updatePricesList - Update Prices List

**Nombre y propósito:** Actualiza el estado o datos asociados a updatePricesList.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/updatePricesList` | `inventoryController.updatePricesList` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `items` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `list_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.updatePricesList` en `api/controllers/inventoryController.js:1379`. Tablas/vistas: `Inventory.priceList_items`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/updatePricesList`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "items": [],
    "list_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /inventory/deleteItemPricesList - Delete Item Prices List

**Nombre y propósito:** Elimina o anula registros asociados a deleteItemPricesList.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/inventory/deleteItemPricesList` | `inventoryController.deleteItemPricesList` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `items` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `inventoryController.deleteItemPricesList` en `api/controllers/inventoryController.js:1458`. Tablas/vistas: `Inventory.priceList_items`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/inventory/deleteItemPricesList`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "items": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Procesos

### POST /process/getProcessInstances - Get Process Instances

**Nombre y propósito:** Consulta getProcessInstances y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getProcessInstances` | `processController.getProcessInstances` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedInstances` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `allowedTypes` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `process_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |

**Lógica del controlador**

Controlador `processController.getProcessInstances` en `api/controllers/processController.js:741`. Tablas/vistas: `Ecosystem.thirdparties`, `Ecosystem.users`, `Process.process_instance`, `Process.process_steps`, `Process.processes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getProcessInstances`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedInstances": [],
    "allowedTypes": [],
    "company_id": 1,
    "end_date": "2026-04-18",
    "id": 1,
    "process_id": 1,
    "start_date": "2026-04-18",
    "status": "example_status"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getProcessState - Get Process State

**Nombre y propósito:** Consulta getProcessState y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getProcessState` | `processController.getProcessState` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `processController.getProcessState` en `api/controllers/processController.js:906`. Tablas/vistas: `Ecosystem.thirdparties`, `Process.process_instance`, `Process.process_steps`, `Process.processes`, `Process.step_doc_realtion`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getProcessState`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getAviableProceses - Get Aviable Proceses

**Nombre y propósito:** Consulta getAviableProceses y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getAviableProceses` | `processController.getAviableProcess` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `alloweProcesses` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `processController.getAviableProcess` en `api/controllers/processController.js:644`. Tablas/vistas: `Process.process_steps`, `Process.processes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getAviableProceses`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "alloweProcesses": 1000,
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/createProcessInstace - Create Process Instace

**Nombre y propósito:** Crea o registra createProcessInstace usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/createProcessInstace` | `processController.createProcessInstace` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `delivery_date` | String(Date/ISO) | Según operación | Campo leído por el controlador desde la solicitud. |
| `parent_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `parent_step` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `process_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `step_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `processController.createProcessInstace` en `api/controllers/processController.js:697`. Tablas/vistas: `Process.process_instance`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/createProcessInstace`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "delivery_date": "2026-04-18",
    "parent_id": 1,
    "parent_step": 1000,
    "process_id": 1,
    "start_date": "2026-04-18",
    "status": "example_status",
    "step_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/updateProcessInstanceStatus - Update Process Instance Status

**Nombre y propósito:** Actualiza el estado o datos asociados a updateProcessInstanceStatus.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/updateProcessInstanceStatus` | `processController.updateProcessInstanceStatus` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `delivery_date` | String(Date/ISO) | Según operación | Campo leído por el controlador desde la solicitud. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `processController.updateProcessInstanceStatus` en `api/controllers/processController.js:851`. Tablas/vistas: `Process.process_instance`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/updateProcessInstanceStatus`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "delivery_date": "2026-04-18",
    "id": 1,
    "start_date": "2026-04-18",
    "status": "example_status",
    "thirdParty_id": 1,
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/nextProcessStep - Next Process Step

**Nombre y propósito:** Ejecuta la operación nextProcessStep expuesta por el controlador.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/nextProcessStep` | `processController.nextProcessStep` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `next_step` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `previous_step` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |
| `user_roll` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `processController.nextProcessStep` en `api/controllers/processController.js:1116`. Tablas/vistas: `Process.process_historial`, `Process.process_instance`, `Process.process_steps`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/nextProcessStep`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "description": "example_description",
    "instance_id": 1,
    "next_step": 1000,
    "previous_step": 1000,
    "user_id": 1,
    "user_roll": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/createOP - Create OP

**Nombre y propósito:** Crea o registra createOP usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/createOP` | `processController.createOp` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |

**Lógica del controlador**

Controlador `processController.createOp` en `api/controllers/processController.js:94`. Tablas/vistas: `Ecosystem.process_details`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/createOP`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getOp - Get Op

**Nombre y propósito:** Consulta getOp y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getOp` | `processController.getOp` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `limint` | Int/String | Según operación | Límite de registros devueltos; el nombre aparece así en el controlador. |

**Lógica del controlador**

Controlador `processController.getOp` en `api/controllers/processController.js:127`. Tablas/vistas: `Ecosystem.documents`, `Ecosystem.process_details`, `Ecosystem.thirdParties`, `Ecosystem.users`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getOp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1,
    "limint": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getDocuments - Get Documents

**Nombre y propósito:** Consulta getDocuments y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getDocuments` | `processController.getDocuments` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `finalDate` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `initialDate` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `limint` | Int/String | Según operación | Límite de registros devueltos; el nombre aparece así en el controlador. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `processController.getDocuments` en `api/controllers/processController.js:200`. Tablas/vistas: `Ecosystem.documents`, `Ecosystem.documents_group`, `Ecosystem.process_details`, `Ecosystem.stores`, `Ecosystem.thirdParties`, `Ecosystem.users`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getDocuments`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "finalDate": "2026-04-18",
    "id": 1,
    "initialDate": "2026-04-18",
    "limint": 1,
    "status": "example_status",
    "type": "example_type",
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getAttachedDocuments - Get Attached Documents

**Nombre y propósito:** Consulta getAttachedDocuments y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getAttachedDocuments` | `processController.getAttachedDocuments` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedTypes` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |

**Lógica del controlador**

Controlador `processController.getAttachedDocuments` en `api/controllers/processController.js:28`. Tablas/vistas: `Ecosystem.docs_instances`, `Ecosystem.documents`, `Process.process_instance`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getAttachedDocuments`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedTypes": [],
    "company_id": 1,
    "id": 1,
    "instance_id": 1,
    "thirdParty_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getOpAttached - Get Op Attached

**Nombre y propósito:** Consulta getOpAttached y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getOpAttached` | `processController.getOpAttached` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `processController.getOpAttached` en `api/controllers/processController.js:306`. Tablas/vistas: `Ecosystem.documents`, `Ecosystem.documents_group`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getOpAttached`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/createOC - Create OC

**Nombre y propósito:** Crea o registra createOC usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/createOC` | `processController.createOc` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `budgetCost` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `budgetIncome` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `delivery_date` | String(Date/ISO) | Según operación | Campo leído por el controlador desde la solicitud. |
| `op_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `processController.createOc` en `api/controllers/processController.js:337`. Tablas/vistas: `Ecosystem.documents_group`, `Ecosystem.process_details`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/createOC`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "budgetCost": 1000,
    "budgetIncome": 1000,
    "company_id": 1,
    "delivery_date": "2026-04-18",
    "op_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/createDC - Create DC

**Nombre y propósito:** Crea o registra createDC usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/createDC` | `processController.createDC` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `op_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `total` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `processController.createDC` en `api/controllers/processController.js:404`. Tablas/vistas: `Ecosystem.documents_group`, `Ecosystem.process_details`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/createDC`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "op_id": 1,
    "total": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/createFV - Create FV

**Nombre y propósito:** Crea o registra createFV usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/createFV` | `processController.createFV` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `op_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `total` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `processController.createFV` en `api/controllers/processController.js:454`. Tablas/vistas: `Ecosystem.documents_group`, `Ecosystem.process_details`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/createFV`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "op_id": 1,
    "total": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/searchDocument - Search Document

**Nombre y propósito:** Ejecuta la operación searchDocument expuesta por el controlador.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/searchDocument` | `processController.searchDocument` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `finalDate` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `initialDate` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `searchVal` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `types` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `processController.searchDocument` en `api/controllers/processController.js:504`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/searchDocument`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "finalDate": "2026-04-18",
    "initialDate": "2026-04-18",
    "searchVal": "example_searchVal",
    "store_id": 1,
    "types": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getEficincyUsers - Get Eficincy Users

**Nombre y propósito:** Consulta getEficincyUsers y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getEficincyUsers` | `processController.getEficincyUsers` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `processController.getEficincyUsers` en `api/controllers/processController.js:1217`. Tablas/vistas: `Process.process_historial`, `Process.process_instance`, `Process.process_steps`, `Process.processes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getEficincyUsers`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /process/getInstanceHistorial - Get Instance Historial

**Nombre y propósito:** Consulta getInstanceHistorial y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/process/getInstanceHistorial` | `processController.getInstanceHistorial` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `limint` | Int/String | Según operación | Límite de registros devueltos; el nombre aparece así en el controlador. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |

**Lógica del controlador**

Controlador `processController.getInstanceHistorial` en `api/controllers/processController.js:983`. Tablas/vistas: `Ecosystem.users`, `Process.process_historial`, `Process.process_instance`, `Process.process_steps`, `Process.processes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/process/getInstanceHistorial`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "end_date": "2026-04-18",
    "limint": 1,
    "start_date": "2026-04-18"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Contabilidad

### POST /contability/contabiltyController - Contabilty Controller

**Nombre y propósito:** Consulta contabiltyController y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/contability/contabiltyController` | `contabiltyController.getBalance` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allAccounts` | Boolean | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `typePlanAccount` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `contabiltyController.getBalance` en `api/controllers/contabilityController.js:7`. Tablas/vistas: `Ecosystem.contable_accounts`, `Ecosystem.transaction_detail`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/contability/contabiltyController`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allAccounts": true,
    "company_id": 1,
    "end_date": "2026-04-18",
    "start_date": "2026-04-18",
    "typePlanAccount": "example_typePlanAccount"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Tesorería

### POST /treasury/getTreasury - Get Treasury

**Nombre y propósito:** Consulta getTreasury y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/treasury/getTreasury` | `controller.getAccounts` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `controller.getAccounts` en `api/controllers/index.controller.js:845`. Tablas/vistas: `Ecosystem.contable_accounts`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/treasury/getTreasury`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /treasury/getThirdPartyPortfolio - Get Third Party Portfolio

**Nombre y propósito:** Consulta getThirdPartyPortfolio y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/treasury/getThirdPartyPortfolio` | `treasuryController.getThirdPartyPortfolio` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |

**Lógica del controlador**

Controlador `treasuryController.getThirdPartyPortfolio` en `api/controllers/TreasuryController.js:5`. Tablas/vistas: `Ecosystem.documents`, `Ecosystem.stores`, `Process.process_instance`, `Process.processes`, `Treasury.accounts_receivable`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/treasury/getThirdPartyPortfolio`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "end_date": "2026-04-18",
    "id": 1,
    "start_date": "2026-04-18",
    "store_id": 1,
    "thirdParty_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Facturación

### POST /facturation/newCashRecipt - New Cash Recipt

**Nombre y propósito:** Crea o registra newCashRecipt usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/newCashRecipt` | `facturationController.newCashRecipt` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `attached` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `created_by` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `payedBills` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `step_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `subTotal` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |
| `total` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `facturationController.newCashRecipt` en `api/controllers/facturationController.js:93`. Tablas/vistas: `Ecosystem.documents`, `Treasury.accounts_receivable`, `Treasury.portfolio_payments`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/newCashRecipt`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "attached": [],
    "company_id": 1,
    "created_by": 1000,
    "description": "example_description",
    "doc_type": "example_doc_type",
    "instance_id": 1,
    "payedBills": [],
    "status": "example_status"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/newSellInvoice - New Sell Invoice

**Nombre y propósito:** Crea o registra newSellInvoice usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/newSellInvoice` | `facturationController.newSellInvoice` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `attached` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `created_by` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `instances` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `payedBills` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `step_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `subTotal` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |
| `total` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `facturationController.newSellInvoice` en `api/controllers/facturationController.js:181`. Tablas/vistas: `Ecosystem.docs_instances`, `Ecosystem.documents`, `Treasury.accounts_receivable`, `Treasury.portfolio_payments`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/newSellInvoice`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "attached": [],
    "company_id": 1,
    "created_by": 1000,
    "description": "example_description",
    "doc_type": "example_doc_type",
    "instance_id": 1,
    "instances": [],
    "payedBills": []
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/newNote - New Note

**Nombre y propósito:** Crea o registra newNote usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/newNote` | `facturationController.newNote` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `attached` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `created_by` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `step_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `subTotal` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |
| `total` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |

**Lógica del controlador**

Controlador `facturationController.newNote` en `api/controllers/facturationController.js:292`. Tablas/vistas: `Ecosystem.documents`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/newNote`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "attached": [],
    "company_id": 1,
    "created_by": 1000,
    "description": "example_description",
    "instance_id": 1,
    "status": "example_status",
    "step_id": 1,
    "store_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/newClientOrder - New Client Order

**Nombre y propósito:** Crea o registra newClientOrder usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/newClientOrder` | `facturationController.newClientOrder` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `attached` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `created_by` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_type` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `productsServices` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `status` | String | Según operación | Estado usado como filtro o valor de actualización. |
| `step_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `subTotal` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |
| `total` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `facturationController.newClientOrder` en `api/controllers/facturationController.js:6`. Tablas/vistas: `Ecosystem.documents`, `Inventory.services_movement`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/newClientOrder`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "attached": [],
    "company_id": 1,
    "created_by": 1000,
    "description": "example_description",
    "doc_type": "example_doc_type",
    "instance_id": 1,
    "productsServices": [],
    "status": "example_status"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/getCashBoxes - Get Cash Boxes

**Nombre y propósito:** Consulta getCashBoxes y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/getCashBoxes` | `facturationController.getCashBoxes` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `allowedCashBoxes` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `store_id` | Int/String | Según operación | Identificador de sede/tienda. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `facturationController.getCashBoxes` en `api/controllers/facturationController.js:340`. Tablas/vistas: `Facturation.register_shifts`, `Treasury.cash_boxes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/getCashBoxes`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "allowedCashBoxes": [],
    "company_id": 1,
    "id": 1,
    "store_id": 1,
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/getRegisterShift - Get Register Shift

**Nombre y propósito:** Consulta getRegisterShift y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/getRegisterShift` | `facturationController.getRegisterShift` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `limit` | Int/String | Según operación | Límite de registros devueltos. |

**Lógica del controlador**

Controlador `facturationController.getRegisterShift` en `api/controllers/facturationController.js:407`. Tablas/vistas: `Ecosystem.users`, `Facturation.register_shifts`, `Treasury.cash_boxes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/getRegisterShift`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1,
    "limit": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/openCashRegister - Open Cash Register

**Nombre y propósito:** Crea o registra openCashRegister usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/openCashRegister` | `facturationController.openCashRegister` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `cashBox_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `opening_time` | String(Date/ISO) | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `facturationController.openCashRegister` en `api/controllers/facturationController.js:473`. Tablas/vistas: `Facturation.register_shifts`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/openCashRegister`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "cashBox_id": 1,
    "company_id": 1,
    "opening_time": "2026-04-18",
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/closeCashRegister - Close Cash Register

**Nombre y propósito:** Crea o registra closeCashRegister usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/closeCashRegister` | `facturationController.closeCashRegister` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `facturationController.closeCashRegister` en `api/controllers/facturationController.js:539`. Tablas/vistas: `Facturation.register_shifts`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/closeCashRegister`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/getCashRegisterReport - Get Cash Register Report

**Nombre y propósito:** Consulta getCashRegisterReport y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/getCashRegisterReport` | `facturationController.getCashRegisterReport` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `shift_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `facturationController.getCashRegisterReport` en `api/controllers/facturationController.js:574`. Tablas/vistas: `Ecosystem.payment_methods`, `Facturation.mv_shift_payment_summaries`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/getCashRegisterReport`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "shift_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/getTransactionsOfCashRecord - Get Transactions Of Cash Record

**Nombre y propósito:** Consulta getTransactionsOfCashRecord y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/getTransactionsOfCashRecord` | `facturationController.getTransactionsOfCashRecord` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `doc_id` | Int/String | Según operación | Identificador del documento relacionado. |
| `paymentMethod_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `shift_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `facturationController.getTransactionsOfCashRecord` en `api/controllers/facturationController.js:609`. Tablas/vistas: `Ecosystem.concepts`, `Ecosystem.contable_accounts`, `Ecosystem.documents`, `Ecosystem.payment_methods`, `Ecosystem.thirdparties`, `Ecosystem.transaction_detail`, `Ecosystem.transactions`, `Facturation.shift_settlement_details`, `Process.process_instance`, `Process.processes`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/getTransactionsOfCashRecord`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "doc_id": 1,
    "paymentMethod_id": 1,
    "shift_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/getBriefcaseBills - Get Briefcase Bills

**Nombre y propósito:** Consulta getBriefcaseBills y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/getBriefcaseBills` | `facturationController.getBriefcaseBills` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `thirdParty_id` | Int/String | Según operación | Identificador del tercero relacionado. |

**Lógica del controlador**

Controlador `facturationController.getBriefcaseBills` en `api/controllers/facturationController.js:717`. Tablas/vistas: `Process.process_instance`, `Process.processes`, `Treasury.accounts_receivable`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/getBriefcaseBills`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "thirdParty_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /facturation/updatePaymentDocument - Update Payment Document

**Nombre y propósito:** Actualiza el estado o datos asociados a updatePaymentDocument.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/facturation/updatePaymentDocument` | `facturationController.updatePaymentDocument` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `paid_amount` | Number | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `facturationController.updatePaymentDocument` en `api/controllers/facturationController.js:760`. Tablas/vistas: `Ecosystem.documents`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/facturation/updatePaymentDocument`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "id": 1,
    "paid_amount": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Activos

### POST /assets/getAssets - Get Assets

**Nombre y propósito:** Consulta getAssets y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/assets/getAssets` | `assetsController.getAssets` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |

**Lógica del controlador**

Controlador `assetsController.getAssets` en `api/controllers/assetsController.js:5`. Tablas/vistas: `AssetManagement.assets`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/assets/getAssets`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Analítica

### POST /analytics/getProcessInstanceUsersAvtivity - Get Process Instance Users Avtivity

**Nombre y propósito:** Consulta getProcessInstanceUsersAvtivity y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/analytics/getProcessInstanceUsersAvtivity` | `AnalyticController.getProcessInstanceUsersAvtivity` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |
| `userStatus` | String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `AnalyticController.getProcessInstanceUsersAvtivity` en `api/controllers/AnalyticsController.js:5`. Tablas/vistas: `Ecosystem.users`, `Process.process_historial`, `Process.process_instance`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/analytics/getProcessInstanceUsersAvtivity`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "end_date": "2026-04-18",
    "start_date": "2026-04-18",
    "userStatus": "example_userStatus"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /analytics/getProcessStepsCycleTime - Get Process Steps Cycle Time

**Nombre y propósito:** Consulta getProcessStepsCycleTime y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/analytics/getProcessStepsCycleTime` | `AnalyticController.getProcessStepsCycleTime` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `process_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |

**Lógica del controlador**

Controlador `AnalyticController.getProcessStepsCycleTime` en `api/controllers/AnalyticsController.js:75`. Tablas/vistas: `Process.process_historial`, `Process.process_instance`, `Process.process_steps`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/analytics/getProcessStepsCycleTime`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "end_date": "2026-04-18",
    "process_id": 1,
    "start_date": "2026-04-18"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Módulo Custom ZJ852

### POST /zj852/getlastClickControl - Getlast Click Control

**Nombre y propósito:** Consulta getlastClickControl y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/zj852/getlastClickControl` | `zjController.getlastClickControl` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `asset_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `zjController.getlastClickControl` en `api/controllers/custom-controllers/zjController.js:6`. Tablas/vistas: `AssetManagement.assets`, `Custom.z&j_clickControl`, `Custom.z&j_required_asset_control`, `Ecosystem.users`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/zj852/getlastClickControl`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "asset_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /zj852/getHistorialClicksControl - Get Historial Clicks Control

**Nombre y propósito:** Consulta getHistorialClicksControl y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/zj852/getHistorialClicksControl` | `zjController.getHistorialClicksControl` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `asset_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `zjController.getHistorialClicksControl` en `api/controllers/custom-controllers/zjController.js:64`. Tablas/vistas: `AssetManagement.assets`, `Custom.z&j_clickControl`, `Ecosystem.users`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/zj852/getHistorialClicksControl`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "asset_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /zj852/openClickControl - Open Click Control

**Nombre y propósito:** Crea o registra openClickControl usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/zj852/openClickControl` | `zjController.openClickControl` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `asset_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `attached` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `initialClicks` | Number | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `zjController.openClickControl` en `api/controllers/custom-controllers/zjController.js:114`. Tablas/vistas: `Custom.z&j_clickControl`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/zj852/openClickControl`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "asset_id": 1,
    "attached": [],
    "company_id": 1,
    "description": "example_description",
    "initialClicks": 1000,
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /zj852/registerServiceMachine - Register Service Machine

**Nombre y propósito:** Crea o registra registerServiceMachine usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/zj852/registerServiceMachine` | `zjController.registerServiceMachine` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `description` | String | Según operación | Campo leído por el controlador desde la solicitud. |
| `instance_id` | Int/String | Según operación | Identificador de instancia de proceso. |
| `services` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `zjController.registerServiceMachine` en `api/controllers/custom-controllers/zjController.js:150`. Tablas/vistas: `Custom.z&j_serviceExecutionControl`, `Ecosystem.documents`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/zj852/registerServiceMachine`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "description": "example_description",
    "instance_id": 1,
    "services": [],
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /zj852/getServiceMovements - Get Service Movements

**Nombre y propósito:** Consulta getServiceMovements y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/zj852/getServiceMovements` | `zjController.getServiceMovements` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `end_date` | String(Date/ISO) | Según operación | Fecha final del rango. |
| `start_date` | String(Date/ISO) | Según operación | Fecha inicial del rango. |

**Lógica del controlador**

Controlador `zjController.getServiceMovements` en `api/controllers/custom-controllers/zjController.js:217`. Tablas/vistas: `AssetManagement.assets`, `Custom.z&j_clicksEquivalence`, `Custom.z&j_serviceExecutionControl`, `Ecosystem.thirdparties`, `Inventory.products&services`, `Inventory.services_movement`, `Process.process_instance`, `Process.processes`. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/zj852/getServiceMovements`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "end_date": "2026-04-18",
    "start_date": "2026-04-18"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

## Facturación Electrónica

### GET /electronicFacturation/getNumberingRanges - Get Numbering Ranges

**Nombre y propósito:** Consulta getNumberingRanges y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `GET` | `/electronicFacturation/getNumberingRanges` | `electronicFacturationController.getNumberingRanges` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

No requiere body.

**Lógica del controlador**

Controlador `electronicFacturationController.getNumberingRanges` en `api/controllers/electronicFacturationController.js:136`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: funciona como wrapper de servicio externo y no siempre escribe en `res` directamente.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/electronicFacturation/getNumberingRanges`, {
  method: "GET"
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### GET /electronicFacturation/showActualToken - Show Actual Token

**Nombre y propósito:** Consulta showActualToken y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `GET` | `/electronicFacturation/showActualToken` | `electronicFacturationController.showActualToken` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

No requiere body.

**Lógica del controlador**

Controlador `electronicFacturationController.showActualToken` en `api/controllers/electronicFacturationController.js:189`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: funciona como wrapper de servicio externo y no siempre escribe en `res` directamente.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/electronicFacturation/showActualToken`, {
  method: "GET"
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /electronicFacturation/invoice - Invoice

**Nombre y propósito:** Crea o registra invoice usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/electronicFacturation/invoice` | `electronicFacturationController.newInvoice` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_info` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `customer` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_id` | Int/String | Según operación | Identificador del documento relacionado. |
| `items` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `electronicFacturationController.newInvoice` en `api/controllers/electronicFacturationController.js:198`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/electronicFacturation/invoice`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_info": 1000,
    "customer": 1000,
    "doc_id": 1,
    "items": [],
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### GET /electronicFacturation/taxes - Taxes

**Nombre y propósito:** Consulta taxes y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `GET` | `/electronicFacturation/taxes` | `electronicFacturationController.getTaxes` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

No requiere body.

**Lógica del controlador**

Controlador `electronicFacturationController.getTaxes` en `api/controllers/electronicFacturationController.js:168`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: funciona como wrapper de servicio externo y no siempre escribe en `res` directamente.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/electronicFacturation/taxes`, {
  method: "GET"
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /electronicFacturation/getDocuments - Get Documents

**Nombre y propósito:** Consulta getDocuments y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/electronicFacturation/getDocuments` | `electronicFacturationController.getDocuments` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `company_id` | Int/String | Según operación | Identificador de compañía para aislar datos multiempresa. |
| `id` | Int/String | Según operación | Identificador del registro a consultar o actualizar. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |

**Lógica del controlador**

Controlador `electronicFacturationController.getDocuments` en `api/controllers/electronicFacturationController.js:402`. Tablas/vistas: `Ecosystem.documents`, `ElectronicFacturation.documents`. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/electronicFacturation/getDocuments`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "company_id": 1,
    "id": 1,
    "type": "example_type"
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /electronicFacturation/note - Note

**Nombre y propósito:** Crea o registra note usando los datos enviados en el cuerpo.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/electronicFacturation/note` | `electronicFacturationController.newNote` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `bill_id` | Int/String | Según operación | Campo leído por el controlador desde la solicitud. |
| `company_info` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `customer` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `doc_id` | Int/String | Según operación | Identificador del documento relacionado. |
| `items` | Array/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `type` | String | Según operación | Tipo de entidad/documento/movimiento. |
| `user_id` | Int/String | Según operación | Identificador del usuario que ejecuta la operación. |

**Lógica del controlador**

Controlador `electronicFacturationController.newNote` en `api/controllers/electronicFacturationController.js:328`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: aplica filtros condicionales cuando el campo existe; responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/electronicFacturation/note`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "bill_id": 1,
    "company_info": 1000,
    "customer": 1000,
    "doc_id": 1,
    "items": [],
    "type": "example_type",
    "user_id": 1
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```

### POST /electronicFacturationController.getDocumentFullInfo - Electronic Facturation Controller.get Document Full Info

**Nombre y propósito:** Consulta electronicFacturationController.getDocumentFullInfo y devuelve registros filtrados para la compañía o contexto recibido.

**Detalles técnicos**

| Método | URL | Controlador |
|---|---|---|
| `POST` | `/electronicFacturationController.getDocumentFullInfo` | `electronicFacturationController.getDocumentFullInfo` |

**Requisitos de funcionamiento**

Parámetros de URL: no aplica.

Query params: no aplica.

Body:

| Campo | Tipo inferido | Requerido | Descripción |
|---|---:|:---:|---|
| `bill_number` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |
| `bill_numer` | String/Number/Object | Según operación | Campo leído por el controlador desde la solicitud. |

**Lógica del controlador**

Controlador `electronicFacturationController.getDocumentFullInfo` en `api/controllers/electronicFacturationController.js:455`. No se evidencian tablas locales; usa filesystem, servicio externo o lógica auxiliar. Validaciones/condiciones: responde errores HTTP en fallos o datos inválidos; espera JSON parseable en el cuerpo.

**Ejemplo de uso**

```js
const response = await fetch(`${BASE_URL}/electronicFacturationController.getDocumentFullInfo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    "bill_number": 1000,
    "bill_numer": 1000
  })
});
const data = await response.json();
```

Respuesta esperada:

```json
{
  "ok": true,
  "data": []
}
```
