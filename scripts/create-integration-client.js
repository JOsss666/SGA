import 'dotenv/config';
import pg from 'pg';
import clientSecretService from '../api/services/clientSecretService.js';

const readArgs = (args) => {
    const values = {};
    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];
        if (!argument.startsWith('--')) continue;
        values[argument.slice(2)] = args[index + 1];
        index += 1;
    }
    return values;
};

const fail = (message) => {
    console.error(message);
    console.error(
        'Uso: npm run integration:create-client -- ' +
        '--company <id> --client-id <id> --name <nombre> ' +
        '--user <user_id> --scopes <scope1,scope2>'
    );
    process.exitCode = 1;
};

const args = readArgs(process.argv.slice(2));
const companyId = Number(args.company);
const serviceUserId = args.user ? Number(args.user) : null;
const scopes = String(args.scopes || '')
    .split(',')
    .map(scope => scope.trim())
    .filter(Boolean);
const clientId = String(args['client-id'] || '').trim().toLowerCase();
const name = String(args.name || '').trim();
const ttl = args.ttl ? Number(args.ttl) : 10800;

if (!Number.isInteger(companyId) || companyId <= 0) {
    fail('--company debe ser un entero positivo.');
} else if (serviceUserId !== null && (!Number.isInteger(serviceUserId) || serviceUserId <= 0)) {
    fail('--user debe ser un entero positivo.');
} else if (!/^[a-z0-9][a-z0-9._-]{2,119}$/.test(clientId)) {
    fail('--client-id debe usar minúsculas, números, punto, guion o guion bajo.');
} else if (!name) {
    fail('--name es requerido.');
} else if (scopes.length === 0) {
    fail('--scopes debe incluir al menos un permiso.');
} else if (!Number.isInteger(ttl) || ttl < 60 || ttl > 10800) {
    fail('--ttl debe estar entre 60 y 10800 segundos.');
} else {
    const requiredDbValues = [
        process.env.MYSQL_HOST,
        process.env.MYSQL_USER,
        process.env.MYSQL_PASSWORD,
        process.env.MYSQL_DATABASE,
        process.env.MYSQL_PORT
    ];

    if (requiredDbValues.some(value => !value)) {
        fail('Falta configuración de PostgreSQL en el entorno.');
    } else {
        const secret = clientSecretService.generate();
        const secretHash = await clientSecretService.hash(secret);
        const client = new pg.Client({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            port: Number(process.env.MYSQL_PORT),
            ssl: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            const result = await client.query(`
                INSERT INTO "Integration".clients(
                    company_id, service_user_id, client_id, name,
                    secret_hash, scopes, access_token_ttl
                )
                VALUES ($1, $2, $3, $4, $5, $6::text[], $7)
                RETURNING id, company_id, service_user_id, client_id, name, scopes, status;
            `, [companyId, serviceUserId, clientId, name, secretHash, scopes, ttl]);

            console.log(JSON.stringify({
                ...result.rows[0],
                client_secret: secret,
                warning: 'Guarde client_secret ahora: no puede recuperarse de la base de datos.'
            }, null, 2));
        } catch (error) {
            console.error('No fue posible crear el cliente de integración:', error.message);
            process.exitCode = 1;
        } finally {
            await client.end();
        }
    }
}
