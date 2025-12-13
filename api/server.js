import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'

const app = express();
// Se recomienda usar este middleware para que Express pueda leer los cuerpos JSON de las peticiones POST/PUT
app.use(express.json()); 

const asignedPort  = process.env.PORT || 3000;

// *** 1. Definir Entornos y Orígenes ***
const isProduction = process.env.NODE_ENV === 'production';
const productionOrigin = 'https://sga-managemet.onrender.com'; 

let allowedOrigins = [productionOrigin];

// En desarrollo, añadimos los orígenes locales comunes
if (!isProduction) {
    allowedOrigins.push(
        'http://localhost:3000', // Común para CRA/React local
        'http://localhost:5173', // Común para Vite/React local
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
        // Puedes añadir otros puertos que uses en local aquí
    );
}

// *** 2. Configuración Dinámica de CORS ***
const corsOptions = {
    // Si estamos en producción, solo permitimos el origen de Render.
    // Si estamos en desarrollo, usamos la lógica de función para verificar la lista de allowedOrigins.
    origin: isProduction 
        ? productionOrigin 
        : function (origin, callback) {
            // Permite peticiones sin 'origin' (como Postman/cURL) o si el origen está permitido
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.error(`CORS Blocked: Origin ${origin} not in allowed list.`);
                callback(new Error('Not allowed by CORS'));
            }
        },
    
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Incluye todos los métodos que usas
    credentials: true 
};

// *** 3. Aplicar el Middleware ***
app.use(cors(corsOptions));
// **********************************

app.use(routes);

app.listen(asignedPort , () => {
    console.log(`Servidor SGA_inventory v1.2 Escuchando en el puerto ${asignedPort}`);
    console.log(`Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}. Origen(es) permitido(s): ${isProduction ? productionOrigin : allowedOrigins.join(', ')}`);
});