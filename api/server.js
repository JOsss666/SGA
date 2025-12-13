import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';

const app = express();
const asignedPort = process.env.PORT || 3000;

const allowedOrigins = [
    "https://sga-managemet.onrender.com",
    "http://localhost:5173",
];

// Body parser
app.use(express.json());

// CORS correcto
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

// ✅ PRE-FLIGHT FIX (EXPRESS 5)
app.options(/.*/, cors());

// Rutas
app.use(routes);

app.listen(asignedPort, () => {
    console.log(
        'Servidor SGA_inventory v1.2 Escuchando en el puerto',
        asignedPort
    );
});
