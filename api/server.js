import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js'

const app = express();
const assignedPort = process.env.PORT || 3000;

app.use(cors());
app.use(routes);

app.listen(assignedPort, () => {
    console.log('Servidor SGA_inventory v1.2 Escuchando en el puerto', asignedPort);
});
