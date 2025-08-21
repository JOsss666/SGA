import mysql from 'mysql2';
import { v2 as cloudinary } from 'cloudinary'; // Importando `v2` directamente de cloudinary
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import multer from 'multer';
import { Console } from 'console';

// Cargar las variables de entorno
dotenv.config();
    // Informacion Cloudynary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Datos Conexion MYSQL
const mySQL_host  = process.env.MYSQL_HOST;
const mySQL_user = process.env.MYSQL_USER;
const mySQL_password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;
const MYSQL_PORT = process.env.MYSQL_PORT;

const pool = mysql.createPool({
    host: mySQL_host,
    user: mySQL_user,
    password: mySQL_password,
    database: database,
    port: MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10, 
    queueLimit: 0
});

const poolPromise = pool.promise();


async function testDBConnection() {
  try {
    const connection = await poolPromise.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente.');
    connection.release(); // Muy importante liberar la conexión
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err);
    process.exit(1); // Opcional: termina el servidor si la DB falla
  }
}

testDBConnection();



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
        const [results] = await poolPromise.query(sentence, values);

        switch (typeConsult) {
            case 1:
                return results.length > 0 ? [true, results] : [false, []];
            case 2:
                return true;
            case 3:
            case 4:
                return results.insertId;
            case 5:
                return [true, results[0].total];
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



export function readCSV(path){
    fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
        console.error('Error al leer el archivo:', err);
        return;
    }

    // Separar líneas
    const rows = data.split('\r\n').map(linea => linea.split(','));
    console.log(rows)
    createNUC(rows);
    return(rows)
    });
}

/*

async function createNUC(rows){
    let sentence = `
        INSERT INTO
            sga_ecosystem.account_templates_PUC
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
            if(!res){
                console.log(`Error en la ${valuescode}`)
            }
            return res;
    })
    );
    console.log(results);
}

*/


export{
    cloudinary,
    encrypt,
    useDataBase,
}


