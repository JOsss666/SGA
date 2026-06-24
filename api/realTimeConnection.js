import { Client } from 'pg';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { allowedOrigins } from './server.js';

// Datos Conexion MYSQL
const PG_HOST  = process.env.MYSQL_HOST;
const PG_USER = process.env.MYSQL_USER;
const PG_PASSWORD = process.env.MYSQL_PASSWORD;
const PG_DATABASE = process.env.MYSQL_DATABASE;
const PG_PORT = process.env.MYSQL_PORT;

export const setupRealtime = (server) => {
    // 1. Configurar Socket.io
    
    const io = new Server(server, {
        cors: { 
            origin: allowedOrigins, // Usa la lista completa
            methods: ["GET", "POST"],
            credentials: true // Esto debe coincidir con tu cliente y Express
        }
    });

    // 2. Manejar conexiones y salas (Rooms)
    io.on('connection', (socket) => {
        const { companyId } = socket.handshake.query;
        if (companyId) {
            socket.join(`company_${companyId}`);
            console.log(`Usuario unido a sala: company_${companyId}`);
        }
    });

    // 3. Configurar Cliente de Postgres para escuchar NOTIFY
    setupPostgresListener(io);
};

const setupPostgresListener = (io) => {
    let reconnectTimer = null;
    let shouldReconnect = true;
    let pgClient = null;
    let reconnectDelayMs = 5000;

    const scheduleReconnect = () => {
        if (!shouldReconnect || reconnectTimer) return;

        console.warn(`Conexión LISTEN de PostgreSQL cerrada. Reintentando en ${reconnectDelayMs / 1000} segundos...`);
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, reconnectDelayMs);

        reconnectDelayMs = Math.min(reconnectDelayMs * 2, 60000);
    };

    const destroyClient = async (client) => {
        if (!client) return;
        await client.end().catch(() => {});
    };

    const connect = async () => {
        const client = new Client({
            host: PG_HOST,
            user: PG_USER,
            password: PG_PASSWORD,
            database: PG_DATABASE,
            port: PG_PORT,
            keepAlive: true,
            connectionTimeoutMillis: 10000,
            ssl: {
                rejectUnauthorized: false
            }
        });

        pgClient = client;

        client.on('notification', (msg) => {
            try {
                const payload = JSON.parse(msg.payload);
                console.log(`---> ${JSON.stringify(payload)}`)
                // Enviamos el mensaje SOLO a la empresa dueña del cambio
                console.log('Enviando actualización al cliente')
                io.to(`company_${payload.company_id}`).emit('db_change', payload);
            } catch (err) {
                console.error('Payload inválido recibido desde PostgreSQL:', err);
            }
        });

        client.on('error', async (err) => {
            console.error('Error en conexión LISTEN de PostgreSQL:', err.message);
            if (pgClient === client) {
                pgClient = null;
            }

            await destroyClient(client);
            scheduleReconnect();
        });

        client.on('end', () => {
            if (pgClient === client) {
                pgClient = null;
            }
            scheduleReconnect();
        });

        try {
            await client.connect();
            await client.query('LISTEN sga_db_channel'); // El mismo nombre que en el Trigger
            reconnectDelayMs = 5000;
            console.log('Escuchando cambios de PostgreSQL en sga_db_channel');
        } catch (err) {
            console.error('No se pudo conectar al canal LISTEN de PostgreSQL:', err.message);
            if (pgClient === client) {
                pgClient = null;
            }
            await destroyClient(client);
            scheduleReconnect();
        }
    };

    const closeListener = async () => {
        shouldReconnect = false;

        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        if (pgClient) {
            await destroyClient(pgClient);
        }
    };

    process.once('SIGTERM', closeListener);
    process.once('SIGINT', closeListener);

    connect();
};
