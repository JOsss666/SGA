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

Después se debe aplicar `db/migrations/0017_create_integration_auth.sql`.

## Crear una credencial

La creación es una operación administrativa local; no existe un endpoint
público para realizarla:

```bash
npm run integration:create-client -- \
  --company 52 \
  --client-id zj-orders-production \
  --name "Pedidos WhatsApp Z&J" \
  --user 81 \
  --scopes catalogs:read,customer-orders:create,processes:read
```

La herramienta muestra el `client_secret` una única vez. Debe almacenarse
inmediatamente en el gestor de secretos del sistema consumidor.

## Obtener un token

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
  "expires_in": 900,
  "scope": "catalogs:read customer-orders:create processes:read"
}
```

Los endpoints protegidos deben incluir:

```http
Authorization: Bearer <jwt>
```

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
  '/third-parties',
  authenticateIntegration,
  requireScope('catalogs:read'),
  controller.getThirdParties
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
