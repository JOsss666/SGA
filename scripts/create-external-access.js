import 'dotenv/config';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';

/**
 * Registra (o actualiza) un acceso externo de tercero en
 * "Ecosystem"."externalThirdPatiesAccess".
 *
 * A diferencia del endpoint /externalAccess/create, este script llena TODOS los
 * campos NOT NULL del esquema vivo: id (secuencial), responsable y expires_at
 * (fecha futura; de lo contrario el acceso nace expirado y no puede iniciar sesión).
 *
 * Uso:
 *   node scripts/create-external-access.js \
 *     --company 7 --thirdparty 214 --responsable 86 \
 *     --mail correo@tercero.com --pass "ClaveSegura" \
 *     [--expires 2027-12-31] [--config ./config.json] [--copy-config-from 4] \
 *     [--enabled true]
 */

// Mismo hash que api/app.js: SHA-256 -> primeros 12 bytes -> hex (sin llave).
const encrypt = (data) =>
  crypto.createHash('sha256').update(data).digest().slice(0, 12).toString('hex');

const readArgs = (args) => {
  const values = {};
  for (let i = 0; i < args.length; i += 1) {
    if (!args[i].startsWith('--')) continue;
    values[args[i].slice(2)] = args[i + 1];
    i += 1;
  }
  return values;
};

const fail = (message) => {
  console.error('❌ ' + message);
  console.error(
    '\nUso: node scripts/create-external-access.js ' +
      '--company <id> --thirdparty <id> --responsable <userId> ' +
      '--mail <correo> --pass <clave> ' +
      '[--expires YYYY-MM-DD] [--config <ruta.json>] [--copy-config-from <accessId>] [--enabled true|false]'
  );
  process.exit(1);
};

const args = readArgs(process.argv.slice(2));
const companyId = Number(args.company);
const thirdPartyId = Number(args.thirdparty);
const responsable = Number(args.responsable);
const mail = typeof args.mail === 'string' ? args.mail.trim().toLowerCase() : '';
const pass = typeof args.pass === 'string' ? args.pass : '';
const enabled = args.enabled === undefined ? true : args.enabled === 'true';

if (!Number.isInteger(companyId) || companyId <= 0) fail('--company inválido');
if (!Number.isInteger(thirdPartyId) || thirdPartyId <= 0) fail('--thirdparty inválido');
if (!Number.isInteger(responsable) || responsable <= 0) fail('--responsable inválido');
if (!mail || !pass.trim()) fail('--mail y --pass son obligatorios');

// expires_at: por defecto hoy + 1 año. NUNCA dejar el default de la tabla (= ahora).
let expiresAt;
if (args.expires) {
  expiresAt = new Date(`${args.expires}T23:59:59Z`);
  if (Number.isNaN(expiresAt.getTime())) fail('--expires debe ser YYYY-MM-DD');
} else {
  expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
}

const pool = new pg.Pool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

const run = async () => {
  // 1) El tercero debe pertenecer a la compañía.
  const tp = await pool.query(
    `SELECT id, names FROM "Ecosystem".thirdparties WHERE id = $1 AND company_id = $2 LIMIT 1`,
    [thirdPartyId, companyId]
  );
  if (tp.rows.length === 0) fail(`El tercero ${thirdPartyId} no pertenece a la compañía ${companyId}`);

  // 2) config: --config <archivo>, o --copy-config-from <accessId>, o {}.
  let config = {};
  if (args.config) {
    config = JSON.parse(readFileSync(args.config, 'utf8'));
  } else if (args['copy-config-from']) {
    const src = await pool.query(
      `SELECT config FROM "Ecosystem"."externalThirdPatiesAccess" WHERE id = $1`,
      [Number(args['copy-config-from'])]
    );
    if (src.rows.length === 0) fail(`No existe el acceso ${args['copy-config-from']} para copiar config`);
    config = src.rows[0].config || {};
  }

  // 3) Upsert por (company_id, thirdParty_id), llenando todos los NOT NULL.
  //    id es GENERATED ALWAYS AS IDENTITY: NO se inserta, lo genera la DB.
  const res = await pool.query(
    `INSERT INTO "Ecosystem"."externalThirdPatiesAccess"
        (company_id, "thirdParty_id", responsable, access_mail, access_password, enabled, expires_at, config)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     ON CONFLICT (company_id, "thirdParty_id") DO UPDATE SET
        responsable = EXCLUDED.responsable,
        access_mail = EXCLUDED.access_mail,
        access_password = EXCLUDED.access_password,
        enabled = EXCLUDED.enabled,
        expires_at = EXCLUDED.expires_at,
        config = EXCLUDED.config
     RETURNING id, company_id, "thirdParty_id", "accesKey"::text AS "accesKey", access_mail, enabled, expires_at`,
    [companyId, thirdPartyId, responsable, mail, encrypt(pass), enabled, expiresAt.toISOString(), JSON.stringify(config)]
  );

  const company = await pool.query(
    `SELECT company_key FROM "Ecosystem".companies WHERE company_id = $1`,
    [companyId]
  );

  const row = res.rows[0];
  console.log('✅ Acceso externo registrado/actualizado:');
  console.log('   tercero      :', tp.rows[0].names, `(id ${thirdPartyId})`);
  console.log('   access id    :', row.id);
  console.log('   mail         :', row.access_mail);
  console.log('   enabled      :', row.enabled);
  console.log('   expires_at   :', row.expires_at);
  console.log('   accesKey     :', row.accesKey);
  console.log('   company_key  :', company.rows[0]?.company_key);
};

run()
  .catch((e) => { console.error('❌ Error:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());
