import pkg from 'pg';
import { v2 as cloudinary } from 'cloudinary'; // Importando `v2` directamente de cloudinary
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import * as transformers from "@xenova/transformers";

// Cargar las variables de entorno
dotenv.config();
    // Informacion Cloudynary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Datos Conexion MYSQL
const PG_HOST  = process.env.MYSQL_HOST;
const PG_USER = process.env.MYSQL_USER;
const PG_PASSWORD = process.env.MYSQL_PASSWORD;
const PG_DATABASE = process.env.MYSQL_DATABASE;
const PG_PORT = process.env.MYSQL_PORT;
const { Pool } = pkg;

const pool = new Pool({
    host: PG_HOST,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE,
    port: PG_PORT,
    max: 10,
    idleTimeoutMillis: 30000,
    ssl: {
        rejectUnauthorized: false
    }
});

// informacion para subida archivos
const uploadDependence = multer({ storage: multer.memoryStorage() });

const uploadMiddleware = uploadDependence.array("files", 10) // o la cantidad máxima que quieras;

async function testDBConnection() {
    console.log(PG_USER);

    try {
        const result = await pool.query('SELECT NOW() as now');
        console.log('✅ Conexión a PostgreSQL establecida correctamente:', result.rows[0].now);
    } catch (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err);
        process.exit(1);
    }
}

testDBConnection();

// PROCES IA - PRE_API CONFIG
let calsificatorAI;
const {pipeline} = transformers;
const API_AI_Categories = [
    "Inventarios: productos: insumos: stock: existencias: entradas: salidas: kardex: bodegas: almacén: lote: reposición: control de mercancía: codificación: referencias: unidades disponibles: rotación: clasificación de productos: ajuste de inventario",
    "Contabilidad: registros: asientos contables: balances: estado de resultados: estados financieros: libro diario: libro mayor: plan de cuentas: conciliación: auditoría: depreciación: impuestos: retenciones: causación: provisiones: obligaciones fiscales: cierres contables",
    "Facturación: facturas: ventas: comprobantes: recibos: notas crédito: notas débito: clientes: pedidos: cotizaciones: remisiones: orden de compra: número de factura: facturación electrónica: detalle de venta: impuestos en facturas",
    "Tesorería: pagos: bancos: flujo de caja: transferencias: conciliación bancaria: cuentas por pagar: cuentas por cobrar: recaudos: movimientos bancarios: cheques: consignaciones: desembolsos: control financiero: gestión de caja: recaudo de clientes: egresos: ingresos",
    "Procesos: tareas: actividades: flujo de trabajo: productividad: eficiencia: indicadores: reportes de gestión: tiempos: asignación de tareas: seguimiento: procesos internos: coordinación: automatización: planeación: gestión de usuarios: órdenes de producción: cronogramas"
];


async function initAiClasificator(){
    calsificatorAI = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("Clasificador AI cargado ✅");
}

await initAiClasificator();

// Función para calcular similitud coseno
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

// Precalcula embeddings de las categorías
const categoryEmbeddings = {};
for (let cat of API_AI_Categories) {
    const emb = await calsificatorAI(cat, { pooling: "mean", normalize: true });
    categoryEmbeddings[cat] = emb.data;
}

// Función que evalúa la petición API - AI
export async function isRelevanPrompt(prompt){
    console.log(`Evaluando : ${prompt}`)
    const textEmb = await calsificatorAI(prompt, { pooling: "mean", normalize: true });
    let mejorCategoria = null;
    let mejorScore = -1;

    for (let cat of API_AI_Categories) {
        const score = cosineSimilarity(textEmb.data, categoryEmbeddings[cat]);
        if (score > mejorScore) {
        mejorScore = score;
        mejorCategoria = cat;
        }
    }

    return {
        relevant: mejorScore > 0.5, // umbral configurable
        category: mejorCategoria,
        score: mejorScore,
    }
}


export const actualDate = new Date();

// FUNCIONES
function encrypt(data) {
    const sha256Hash = crypto.createHash('sha256').update(data).digest();
    const sha96Hash = sha256Hash.slice(0, 12);
    return sha96Hash.toString('hex');
}

const useDataBase = async (sentence, values, typeConsult) => {
    console.log(sentence, values);
    try {
        const result = await pool.query(sentence, values);

        switch (typeConsult) {

            case 1: // SELECT
                return result.rows.length > 0 
                    ? [true, result.rows] 
                    : [false, []];

            case 2: // UPDATE o DELETE (sin RETURNING)
                return [true, result.rowCount];
            case 3:
                return result.rows[0];
            case 4:
                return result.rows[0]?.id != undefined;

            case 5: // SELECT con total
                return [true, result.rows[0]?.total];

            case 6: // INSERT RETURNING insertId personalizado
                return [true, result.rows[0]?.id];

            default:
                throw new Error("Tipo de consulta no válido");
        }
    } catch (err) {
        console.error(err);
        return [false, err];
    }
};


export async function sendMailF(infoR, mailsSend) { // FUNCION PARA ENVIAR CORREO ELECTRONICO
    console.log('Enviando Mail');
    let transporter = nodemailer.createTransport({
        host: infoR.host != undefined? infoR.host:"smtp.hostinger.com",
        port: infoR.port!=undefined? infoR.port:465,
        secure:true,
        auth: {
            user: infoR.user!=undefined? infoR.user:'contacto@certicloud.com.co',  
            pass: infoR.pass!=undefined? infoR.pass:'JVSxtp32*'  
        }
    });
    let destinatarios = Array.isArray(mailsSend) ? mailsSend.join(",") : mailsSend;
    let mailOptions = {
        from: infoR.from!= undefined? infoR.form:'contacto@certicloud.com.co',  // Remitente
        to: mailsSend.length>1? 'contacto@certicloud.com.co':mailsSend[0],  // Destinatario(s)
        subject: infoR.subject,  // Asunto
        html: `${infoR.body}`  // Contenido del correo en formato HTML
    };
    if(mailsSend.length>1){
        mailOptions['bcc'] = destinatarios;
    }
    if(infoR.files.length >0){
        mailOptions.attachments = [
            {
                filename:infoR.fileOname[0],
                path: infoR.fileCloudName[0],
                contentType: infoR.fileType[0]
            }
        ]
    }
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log('Error al enviar el correo electrónico: ', error);
                reject(false);
            } else {
                console.log('Correo electrónico enviado: ' + info.response);
                resolve(true);
                if(infoR.files.length >0){
                    eliminarArchivo(infoR.files[0],'raw');
                }
            }
            console.log('Proceso terminado')
        });
    });
}


export function calcWeightedAverage(prevTotal,prevUnits,total,units){
    console.log(prevTotal)
    console.log(prevUnits)
    console.log(total)
    console.log(units)
    prevTotal = JSON.parse(prevTotal);
    prevUnits = JSON.parse(prevUnits);
    total = JSON.parse(total);
    units = JSON.parse(units);
    return(
        [
            prevUnits + units,
            prevTotal + total,
            ( prevTotal + total)/(prevUnits + units)
        ]
    )
}



export function readCSV(path,type){
    fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
        console.error('Error al leer el archivo:', err);
        return;
    }

    // Separar líneas
    const rows = data.split('\r\n').map(linea => linea.split(','));
    console.log(rows)
    if(type == 'PUC'){
        //createPUC(rows);
    }else if(type == 'TAX'){
        //createTax(rows)
    }
    return(rows)
    });
}

async function createPUC(rows){
    let errors = [];
    let sentence = `
        INSERT INTO
            Ecosystem.account_templates_PUC
        (
            company_id,
            code,
            name,
            level,
            type,
            account_path
        )
        VALUES(?,?,?,?,?,?);
    `;
    const results = await Promise.all(
    rows.map(async (element, index) => {
            let values = element[0].split(';');
            console.log(values);
            let res = await useDataBase(sentence,[
                0,
                values[0],
                values[1],
                values[0].length,
                values[2],
                `${values[0]}`,
            ],2);
            console.log(res);
            if(!res[0]){
                errors.push[[values]];
            }
            return res;
    })
    );
    console.log(results);
    console.log('Errores ----> ',errors.length);
    console.log(errors);
}

async function createTax(rows){
    let sentence = `
        INSERT INTO
            Ecosystem.taxes
        (
            company_id,
            account_id,
            code,
            rate,
            base
        )
        VALUES(?,?,?,?,?);
    `;
    let errors = [];
    const results = await Promise.all(
    rows.map(async (element, index) => {
            if(index == 0){
                console.log('---> head <----- ',element);
            }
            if(index != 0){
                let values = element[0].split(';');
                console.log(values);
                let res = await useDataBase(sentence,[
                    parseInt(values[0]),
                    values[1],
                    values[2],
                    values[3],
                    values[4],
                ],2); 
                if(res != true){
                    errors.push(element)
                }
                return res;
            }
    })
    );
    console.log(results);
    console.log('Errores ----> ',errors.length);
    console.log(errors);
}

export{
    cloudinary,
    encrypt,
    useDataBase,
    uploadMiddleware,
    uploadDependence
}


