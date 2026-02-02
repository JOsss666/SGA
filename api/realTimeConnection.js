import { Client } from 'pg';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Datos Conexion MYSQL
const PG_HOST  = process.env.MYSQL_HOST;
const PG_USER = process.env.MYSQL_USER;
const PG_PASSWORD = process.env.MYSQL_PASSWORD;
const PG_DATABASE = process.env.MYSQL_DATABASE;
const PG_PORT = process.env.MYSQL_PORT;

export const setupRealtime = (server) => {
    // 1. Configurar Socket.io
    const io = new Server(server, {
        cors: { origin: [
            "http://localhost:5173",
            "https://sga360.co"
        ] } // Tu URL de Vite
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
    const pgClient = new Client({
        host: PG_HOST,
        user: PG_USER,
        password: PG_PASSWORD,
        database: PG_DATABASE,
        port: PG_PORT,
        ssl: {
            rejectUnauthorized: false
        }
    });

    pgClient.connect();
    pgClient.query('LISTEN sga_db_channel'); // El mismo nombre que en el Trigger

    pgClient.on('notification', (msg) => {
        const payload = JSON.parse(msg.payload);
        console.log(`---> ${JSON.stringify(payload)}`)
        // Enviamos el mensaje SOLO a la empresa dueña del cambio
        console.log('Enviando actualización al cliente')
        io.to(`company_${payload.company_id}`).emit('db_change', payload);
    });
};