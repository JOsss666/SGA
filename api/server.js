import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'

const app = express();
const asignedPort  = process.env.PORT || 3000;

app.use(cors());
app.use(routes);

app.listen(asignedPort , () => {
    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
});

