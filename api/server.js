import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'

const app = express();
const asignedPort  = process.env.PORT || 3000;

// *** Configuración CORRECTA y SEGURA para Producción ***
const productionOrigin = 'https://sga-managemet.onrender.com'; 

app.use(cors({
    origin: productionOrigin, // El servidor responderá SOLO con este origen
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true // Crucial para permitir peticiones con cookies/tokens
}));
// *******************************************************

app.use(routes);

app.listen(asignedPort , () => {
    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
});