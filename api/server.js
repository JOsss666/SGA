import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'
import http from 'http';
import { setupRealtime } from './realTimeConnection.js';

const app = express();
const asignedPort  = process.env.PORT || 3000;
const server = http.createServer(app);

export const allowedOrigins = [
        "http://localhost:5173", // Developer
        "http://localhost:3000", // localHost
        "https://sga-1-wv7x.onrender.com", // Tesoreria
        "https://facturation.sga360.co", // Facturación
        "https://www.inventory.sga360.co", // Inventario
        "https://www.management.sga360.co", // Administración
        "https://www.process.sga360.co", // Procesos
    ]

app.use(express.urlencoded({ extended: true }))

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(routes);

setupRealtime(server)


server.listen(asignedPort , () => {
    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
});

//server.listen(asignedPort , () => {
//    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
//});