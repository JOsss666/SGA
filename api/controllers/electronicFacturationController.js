import fs from 'fs/promises';
import path from 'path';
import { useDataBase } from '../app.js';
import dotenv from 'dotenv';

dotenv.config();
const urlSer = process.env.FACTUS_API_LINK;

const electronicFacturationController = {};
const TOKEN_PATH = path.resolve('./factus_token.json');
const RANGES_PATH = path.resolve('./numbering_ranges.json');

// Función auxiliar para leer el token guardado

async function readFile(path){
  try{
    const content = await fs.readFile(path,'utf-8')
    return JSON.parse(content);
  }catch(err){
    return null;
  }
}

// Función auxiliar para guardar el token
async function saveToken(tokenData) {
    // Agregamos la fecha de expiración real (ej: ahora + 60 min)
    const dataToSave = {
        ...tokenData,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
    await fs.writeFile(TOKEN_PATH, JSON.stringify(dataToSave));
    return dataToSave;
}

// Función auxiliar para guardar el token
async function saveNumberingRanges(ranges) {
    // Agregamos la fecha de expiración real (ej: ahora + 60 min)
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const dataToSave = {
        numbering_ranges:[ranges],
        expires_at:Date.now() + THIRTY_MINUTES
    };
    await fs.writeFile(RANGES_PATH, JSON.stringify(dataToSave));
    return dataToSave;
}

export async function getNumercRangeData(type) {
    const cache = await readFile(RANGES_PATH);
    if (!cache) return null;
    const rawData = cache.numbering_ranges ? cache.numbering_ranges : cache;
    const rangesArray = Object.values(rawData);
    if (rangesArray.length === 0) return null;

    switch (type) {
        case 'invoice':
            const invoiceRange = rangesArray.find(item => item.document === 'Factura de Venta');
            return invoiceRange ? invoiceRange.id : null;

        case 'cr_note':
            const crNoteRange = rangesArray.find(item => item.document === 'Nota Crédito');
            return crNoteRange ? crNoteRange.id : null;

        case 'db_note':
            const dbNoteRange = rangesArray.find(item => item.document === 'Nota Débito');
            return dbNoteRange ? dbNoteRange.id : null;

        default:
            return null;
    }
}

electronicFacturationController.getAuthToken = async (grantType = 'password', refreshToken = null, bypassCache = false) => {
    const validGrants = ['password', 'refresh_token'];
    let finalGrantType = validGrants.includes(grantType) ? grantType : 'password';

    // Si bypassCache es true, ignoramos el archivo (esto rompe el bucle)
    let stored = bypassCache ? null : await readFile(TOKEN_PATH);

    if (stored && finalGrantType === 'password') {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now < (stored.expires_at - fiveMinutes)) {
            return stored;
        }
        
        if (stored.refresh_token) {
            finalGrantType = 'refresh_token';
            refreshToken = stored.refresh_token;
        }
    }

    try {
        const payload = {
            grant_type: finalGrantType,
            client_id: process.env.FACTUS_CLIENT_ID,
            client_secret: process.env.FACTUS_CLIENT_SECRET,
        };

        if (finalGrantType === 'password') {
            payload.username = process.env.FACTUS_USERNAME;
            payload.password = process.env.FACTUS_PASSWORD;
        } else {
            if (!refreshToken) throw new Error("Falta refresh_token");
            payload.refresh_token = refreshToken;
        }

        console.log(`🚀 Solicitando token a Factus: [${finalGrantType}]`);

        const response = await fetch(urlSer + '/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            // SI FALLA EL REFRESH, reintentamos pasando bypassCache = true
            if (finalGrantType === 'refresh_token') {
                console.warn('⚠️ Refresh token inválido. Reintentando login con credenciales directas...');
                // Aquí pasamos TRUE en el tercer parámetro
                return await electronicFacturationController.getAuthToken('password', null, true);
            }
            
            console.error('❌ Error crítico de Factus:', data);
            throw new Error(data.message || 'Error de autenticación');
        }

        const savedToken = await saveToken(data);
        console.log('✨ Token actualizado correctamente');
        return savedToken;

    } catch (error) {
        console.error('🚨 Error Factus Auth:', error.message);
        throw error;
    }   
};

electronicFacturationController.getNumberingRanges = async () => {
    try {
        let stored = await readFile(RANGES_PATH);
        // Validamos si la caché existe y no ha pasado más de 30 mins
        if(stored && (Date.now() < stored.expires_at)){
            console.log('📦 Usando rangos de numeración desde caché');
            return (stored.numbering_ranges);
        }

        // CORRECCIÓN: Obtener el auth ANTES de usarlo
        const auth = await electronicFacturationController.getAuthToken();
        
        const response = await fetch(urlSer + '/v1/numbering-ranges', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${auth.access_token}`
            },
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.message || 'Error al obtener rangos');

        // Guardamos en caché
        await saveNumberingRanges(data.data.data);
        return data.data.data;
    } catch (error) {
        console.error('Error en Rangos:', error.message);
        throw error;
    }   
};

electronicFacturationController.getTaxes = async () => {
    const auth = await electronicFacturationController.getAuthToken();
    try {
        const response = await fetch(urlSer + '/v1/tributes/products', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${auth.access_token}` // ¡ESTO ES VITAL!
            },
        });

        const data = await response.json();
        console.log('Productos: ',data);
        if (!response.ok) throw new Error(data.message || 'Error al obtener rangos');
        return data;
    } catch (error) {
        console.error('Error en Rangos:', error.message);
        throw error;
    }   
};

electronicFacturationController.showActualToken = async()=>{
    let tokenInfo = await readFile(TOKEN_PATH);
    const storedToken = tokenInfo.access_token;
    const refreshToken = tokenInfo.refresh_token;
    console.log('Token Actual: ',storedToken);
    console.log('Token Refresh: ',refreshToken);
}

electronicFacturationController.getMunicipalities = async (auth) => {
    try {
        const response = await fetch(urlSer + '/v1/municipalities?name=Bogota', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${auth.access_token}`
            },
        });

        // 1. Verificamos si la respuesta fue exitosa antes de procesar
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status}`);
        }

        // 2. IMPORTANTE: Extraer los datos del cuerpo (body)
        const data = await response.json();

        // 3. Ahora sí verás los datos reales
        console.log('Resultados de Municipios:', data);
        
        return data;
    } catch (error) {
        console.error('Error al obtener municipios:', error.message);
    }
}

electronicFacturationController.newInvoice = (req,res)=>{
  let bodyData = '';
  req.on('data',chunk=>{
      bodyData += chunk;
  })
  req.on('end',async()=>{
    let info = JSON.parse(bodyData);
    const auth = await electronicFacturationController.getAuthToken();
    console.log(auth)
    let params = {
        "document": "01",
        "numbering_range_id": await getNumercRangeData('invoice'),
        "reference_code": `FVE_${info.document.ownSerial}`,
        "observation": "",
        "payment_method_code": "10",
        "customer": {
            "identification": info.customer.indentification_number,
            "dv": "3",
            "company": `${info.customer.names} ${info.customer.lastNames}`,
            "trade_name": info.customer.names,
            "names": info.customer.names,
            "address": info.customer.address,
            //"email": info.customer.mail,
            "email": info.customer.mail,
            "phone": info.customer.phone,
            "legal_organization_id": "2",
            "tribute_id": "21",
            "identification_document_id": "3",
            "municipality_id": 169
        },
        /*"items": [
            {
                "code_reference": "12345",
                "name": "SGA 1",
                "quantity": 1,
                "discount": 8403.36,
                "discount_rate": 20,
                "price": 50000,
                "tax_rate": "19.00",
                "unit_measure_id": 70,
                "standard_code_id": 1,
                "is_excluded": 0,
                "tribute_id": 1,
                "withholding_taxes": [
                    {
                        "code": "06",
                        "withholding_tax_rate": "7.00"
                    },
                    {
                        "code": "05",
                        "withholding_tax_rate": "15.00"
                    }
                ]
            },*/
       "items":info.items
    }
    const response = await fetch(urlSer + '/v1/bills/validate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json', // ¡Faltaba este!
            'Accept': 'application/json'
        },
        body: JSON.stringify(params)
    });
    const resInvoice = await response.json();
    console.log('ZZZZZZZZZ ',resInvoice)
    if(resInvoice.status == 'Created'){
        let data = resInvoice.data
        let insertRes = await electronicFacturationController.registerEFactDocument({
            user_id:info.user_id,
            customer:info.customer,
            company_id:info.company_info.company_id,
            store_id:6,
            doc_id:info.doc_id,
            invoice_id:data.bill.id,
            reference:data.bill.reference_code,
            number:data.bill.number,
            code:data.bill.cufe,
            url:data.bill.public_url,
            qr:data.bill.qr,
            qr_image:data.bill.qr_image,
            type:'electronic invoice'
        });
    resInvoice.sga_id = insertRes;
    }
    res.writeHead(200,{'Content-Type':'text/plain'})
    res.end(JSON.stringify(resInvoice));
  })
  req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}


electronicFacturationController.registerEFactDocument = async(info)=>{
    let sentence = `
        INSERT INTO "ElectronicFacturation".documents(
            generated_by,
            company_id,
            store_id,
            doc_id,
            invoice_id,
            reference,
            "number",
            code,
            url,
            qr,
            qr_image,
            type
            )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id;
    `;
    let consulta = await useDataBase(sentence,[
        info.user_id,
        info.company_id,
        info.store_id,
        info.doc_id,
        info.invoice_id,
        info.reference,
        info.number,
        info.code,
        info.url,
        info.qr,
        info.qr_image,
        info.type
    ],3);
    return consulta;
}

electronicFacturationController.newNote = (req,res)=>{
  let bodyData = '';
  req.on('data',chunk=>{
      bodyData += chunk;
  })
  req.on('end',async()=>{
    let info = JSON.parse(bodyData);
    const auth = await electronicFacturationController.getAuthToken();
    let params = {
        "numbering_range_id": await getNumercRangeData(info.type == 'Credit Note'? 'cr_note':'db_note'),
        "correction_concept_code": 2,
        // System use 22 when the note dont have an asociated bill. --> bill_id becomes optional
        "customization_id": info.bill_id != undefined? 20:22,
        "bill_id": info.bill_id,
        "reference_code": "5",
        "observation": "",
        "payment_method_code": "10",
        "customer": {
            "identification": info.customer.indentification_number,
            "dv": "3",
            "company": `${info.customer.names} ${info.customer.lastNames}`,
            "trade_name": info.customer.names,
            "names": info.customer.names,
            "address": info.customer.address,
            //"email": info.customer.mail,
            "email": 'murillojose.nvc@gmail.com',
            "phone": info.customer.phone,
            "legal_organization_id": "2",
            "tribute_id": "21",
            "identification_document_id": "3",
            "municipality_id": "980"
        },
        "items":info.items
    }
    console.log(params)
    const response = await fetch(urlSer + '/v1/credit-notes/validate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json', // ¡Faltaba este!
            'Accept': 'application/json'
        },
        body: JSON.stringify(params)
    });
    const resInvoice = await response.json();
    console.log(resInvoice)
    if(resInvoice.status == 'Created'){
        let data = resInvoice.data
        let insertRes = await electronicFacturationController.registerEFactDocument({
            user_id:info.user_id,
            customer:info.customer,
            company_id:info.company_info.company_id,
            store_id:6,
            doc_id:info.doc_id,
            invoice_id:data.credit_note.id,
            reference:data.credit_note.reference_code,
            number:data.credit_note.number,
            code:data.credit_note.cufe,
            url:data.credit_note.public_url,
            qr:data.credit_note.qr,
            qr_image:data.credit_note.qr_image,
            type:info.type
        });
    resInvoice.sga_id = insertRes;
    }
    res.writeHead(200,{'Content-Type':'text/plain'})
    res.end(JSON.stringify(resInvoice));
  })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

electronicFacturationController.getDocuments = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        if(info.company_id != undefined){
            values.push(info.company_id);
            whereClauses.push(`"ElectronicFacturation".documents.company_id = $${values.length}`);
        }

        if(info.type != undefined){
            values.push(info.type);
            whereClauses.push(`"ElectronicFacturation".documents.type = $${values.length}`);
        }

        if(info.id != undefined){
            values.push(info.id);
            whereClauses.push(`"ElectronicFacturation".documents.id = $${values.length}`);
        }

        const whereQuery = whereClauses.length > 0
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";

        let sentence = `
            SELECT 
                "ElectronicFacturation".documents.*,
                "Ecosystem".documents.id AS doc_id,
                "Ecosystem".documents."thirdParty_id"
            FROM
                "ElectronicFacturation".documents
            LEFT JOIN
                "Ecosystem".documents
            ON
                "ElectronicFacturation".documents.doc_id = "Ecosystem".documents.id
            ${whereQuery}
            ORDER BY id DESC ;
        `;
        let consulta = await useDataBase(sentence,values,1);
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(consulta));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

electronicFacturationController.getDocumentFullInfo = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk;
    })
    req.on('end',async()=>{
        const auth = await electronicFacturationController.getAuthToken();
        let info = JSON.parse(data);
        console.log('bill_number: ',info.bill_numer);
        console.log(`Ruta: ${urlSer}/v1/bills/show-bill/`);
        const response = await fetch(urlSer + `/v1/bills/show/${info.bill_numer}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${auth.access_token}`,
                'Accept': 'application/json'
            }
        });
        const resInvoice = await response.json();
        console.log(resInvoice)
        res.writeHead(200,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(resInvoice));
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })

}



// Función para inicializar servicios al arrancar el servidor
electronicFacturationController.init = async () => {
    try {
        console.log('--- 🔐 Iniciando Autenticación Factus ---');
        const auth = await electronicFacturationController.getAuthToken('password');
        console.log('---> ',auth)
        if (auth) {
            console.log('✅ Conexión inicial con Factus establecida.');
            // Opcional: También puedes precargar los rangos de numeración
            await electronicFacturationController.getNumberingRanges();
        }
    } catch (error) {
        console.log(error)
        console.error('⚠️ No se pudo obtener el token inicial de Factus:', error.message);
        console.log('ℹ️ El sistema reintentará la conexión en la primera solicitud de factura.');
    }
};

export default electronicFacturationController;