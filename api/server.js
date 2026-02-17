import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'
import http from 'http';
import { setupRealtime } from './realTimeConnection.js';

const app = express();
const asignedPort  = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(cors({
    origin: "https://facturation.sga360.co",
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