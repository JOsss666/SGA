# Autenticación de integraciones empresariales

Esta API usa autenticación máquina-a-máquina. Cada sistema externo recibe un
`client_id` público y un `client_secret` que se muestra una sola vez. El secreto
se guarda como hash scrypt y se intercambia por un JWT temporal.

## Configuración

Configurar en el entorno del backend:

```dotenv
INTEGRATION_JWT_SECRET=<secreto aleatorio de al menos 32 bytes>
INTEGRATION_JWT_ISSUER=sga360
INTEGRATION_JWT_AUDIENCE=sga360-integrations
```

El secreto de firma puede generarse con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Se deben aplicar las migraciones de integración, incluida
`db/migrations/0022_extend_integration_token_ttl.sql`, para habilitar la
vigencia máxima de 3 horas.

## Crear una credencial

La creación es una operación administrativa local; no existe un endpoint
público para realizarla:

```bash
npm run integration:create-client -- \
  --company 52 \
  --client-id zj-orders-production \
  --name "Pedidos WhatsApp Z&J" \
  --user 81 \
  --scopes third-parties:read,services:read,customer-orders:create,processes:read,processes:create \
  --ttl 10800
```

La herramienta muestra el `client_secret` una única vez. Debe almacenarse
inmediatamente en el gestor de secretos del sistema consumidor.

## Obtener un token

```bash
curl --request POST \
  'http://localhost:3000/api/integrations/v1/auth/token' \
  --header 'Content-Type: application/json' \
  --data '{
    "client_id": "zj-orders-production",
    "client_secret": "<secreto entregado una sola vez>"
  }'
```

Petición HTTP equivalente:

```http
POST /api/integrations/v1/auth/token
Content-Type: application/json

{
  "client_id": "zj-orders-production",
  "client_secret": "<secreto entregado una sola vez>"
}
```

Respuesta:

```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 10800,
  "scope": "third-parties:read services:read customer-orders:create processes:read processes:create"
}
```

Los endpoints protegidos deben incluir:

```http
Authorization: Bearer <jwt>
```

El token tiene una vigencia de 10.800 segundos (3 horas).

## Buscar terceros

El endpoint `GET /api/integrations/v1/third-parties/search` requiere el scope
`third-parties:read` y al menos uno de estos filtros:

- `names`: nombre parcial.
- `lastNames`: apellido parcial.
- `corporative_name`: razón social parcial; internamente corresponde a
  `names` para personas jurídicas.
- `email`: correo exacto, sin distinguir mayúsculas.
- `nit`: identificación exacta; ignora puntos, guiones y otros separadores.

También admite `type`, `page` y `limit`. Cuando se envían varios filtros, deben
cumplirse todos. Por defecto solamente consulta terceros activos de tipo
`client` y `both` pertenecientes a la compañía contenida en el JWT.

Ejemplo por razón social:

```bash
curl --get \
  'http://localhost:3000/api/integrations/v1/third-parties/search' \
  --header 'Authorization: Bearer <jwt>' \
  --data-urlencode 'corporative_name=Z&J'
```

Ejemplo por NIT:

```bash
curl --get \
  'http://localhost:3000/api/integrations/v1/third-parties/search' \
  --header 'Authorization: Bearer <jwt>' \
  --data-urlencode 'nit=900.123.456-7'
```

La respuesta contiene `data` y `pagination`. Si no hay coincidencias, `data`
es un arreglo vacío; la ausencia total de filtros responde con HTTP `400` y el
código `MISSING_THIRD_PARTY_SEARCH_FILTER`.

## Contexto confiable

El middleware agrega a la petición:

```js
req.integration = {
  integrationId,
  clientId,
  companyId,
  serviceUserId,
  scopes
};
```

Los controladores de integración deben tomar `companyId` y `serviceUserId`
exclusivamente de este objeto. Nunca deben aceptar esos valores desde el body,
query string o parámetros de URL.

## Proteger una ruta

```js
router.get(
  '/third-parties/search',
  authenticateIntegration,
  requireScope('third-parties:read'),
  controller.searchThirdParties
);
```

## Operaciones administrativas

- Suspender: cambiar `status` a `suspended`.
- Revocar: cambiar `status` a `revoked` y establecer `revoked_at`.
- Invalidar JWT emitidos: incrementar `token_version`.
- Rotar secreto: reemplazar `secret_hash`, incrementar `token_version` y
  actualizar `secret_rotated_at`.

El `client_secret` nunca debe registrarse en logs ni enviarse por correo sin un
canal seguro. La API de token tiene límite básico por dirección IP y responde
siempre con el mismo error para cliente inexistente, suspendido o secreto
incorrecto.

## Documentación OpenAPI y Scalar

Con el backend en ejecución, la documentación interactiva está disponible en:

```text
http://localhost:3000/api/integrations/v1/docs
```

El contrato OpenAPI en formato JSON está disponible en:

```text
http://localhost:3000/api/integrations/v1/openapi.json
```

Scalar permite consultar los modelos, revisar ejemplos y ejecutar peticiones.
Para probar una operación protegida:

1. Ejecutar `POST /auth/token` con el `client_id` y el `client_secret`.
2. Copiar únicamente el valor `access_token` de la respuesta.
3. Abrir la opción de autenticación Bearer en Scalar y pegar el token.
4. Ejecutar primero `GET /handshake` para verificar la conexión.
5. Continuar con los catálogos y las operaciones permitidas por los scopes de
   la credencial.

La fuente versionada del contrato es
`docs/openapi/zj-integration.openapi.json`. Cualquier cambio en rutas, cuerpos,
respuestas o códigos de error debe reflejarse allí y requiere reiniciar el
backend para volver a cargar el archivo.

La documentación nunca debe contener un `client_secret` real. Cada empresa
debe recibir sus credenciales por un canal seguro.
