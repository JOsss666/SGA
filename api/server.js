import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'
import http from 'http';
import { setupRealtime } from './realTimeConnection.js';
import electronicFacturationController from './controllers/electronicFacturationController.js';
import { allowedOrigins } from './config/corsConfig.js';

const app = express();
const asignedPort  = process.env.PORT || 3000;
const server = http.createServer(app);

// Render y los despliegues equivalentes operan detrás de un proxy.
// Esto permite que req.ip sea confiable para auditoría y rate limiting.
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true }))

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(routes);

setupRealtime(server)


server.listen(asignedPort , async() => {
    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
    await electronicFacturationController.init();
});

//server.listen(asignedPort , () => {
//    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
//});
