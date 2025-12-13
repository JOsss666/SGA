import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'

const app = express();
// Se recomienda usar la sintaxis estándar de importación/exportación de módulos si es posible
// app.use(express.json()); // Asegúrate de tener esto si manejas cuerpos JSON en peticiones POST/PUT

const asignedPort  = process.env.PORT || 3000;

// *** 1. Determinar el Entorno ***
const isProduction = process.env.NODE_ENV === 'production';

// *** 2. Definir Orígenes Permitidos ***
// Origen de producción de Render (Siempre debe estar)
const productionOrigin = 'https://sga-managemet.onrender.com'; 

let allowedOrigins = [productionOrigin];

// En desarrollo, añadimos todos los posibles orígenes locales
if (!isProduction) {
    allowedOrigins = [
        ...allowedOrigins,
        'http://localhost:3000', // React CRA, default
        'http://localhost:5173', // React Vite, default
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
        // Añade cualquier otro puerto que uses, ej: 'http://localhost:8080'
    ];
}

// *** 3. Configuración de CORS con Lógica Mejorada ***
const corsOptions = {
    origin: function (origin, callback) {
        // En desarrollo (o si es una petición sin 'origin', como Postman o cURL)
        // se permite el acceso, a menos que se fuerce la producción.
        if (!origin) return callback(null, true);

        // Si el 'origin' está en la lista de permitidos
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Este es el error que veías:
            console.error(`CORS Blocked: Origin ${origin} not in allowed list.`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Asegúrate de incluir OPTIONS para el preflight
    credentials: true 
};

app.use(cors(corsOptions));
// ******************************************************

app.use(routes);

app.listen(asignedPort , () => {
    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
    console.log(`Entorno: ${isProduction ? 'Producción' : 'Desarrollo'}`);
});