import fs from 'fs/promises';
import path from 'path';
import { useDataBase } from '../app.js';

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

async function getNumercRangeData(type) {
    const cache = await readFile(RANGES_PATH);
    if (!cache || !cache.numbering_ranges) return null;
    const rangesArray = Object.values(cache.numbering_ranges);
    switch (type) {
        case 'invoice':

            const invoiceRange = rangesArray.find(item => item.document === 'Factura de Venta');
            return invoiceRange ? invoiceRange.id : null;

        case 'note':
            const noteRange = rangesArray.find(item => item.document === 'Nota Crédito');
            return noteRange ? noteRange.id : null;

        default:
            return null;
    }
}

electronicFacturationController.getAuthToken = async (grantType = 'password', refreshToken = null) => {
    const validGrants = ['password', 'refresh_token'];
    let finalGrantType = validGrants.includes(grantType) ? grantType : 'password';

    let stored = await readFile(TOKEN_PATH);

    // Si pedimos password pero hay un token válido en caché, lo usamos
    if (stored && finalGrantType === 'password') {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now < (stored.expires_at - fiveMinutes)) {
            console.log('✅ Utilizando token guardado en caché');
            return stored;
        }
        
        if (stored.refresh_token) {
            console.log('🔄 El access_token expiró, intentando refrescar...');
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

        const response = await fetch('https://api-sandbox.factus.com.co/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            // SOLUCIÓN AL ERROR DE REFRESH: Si falla el refresh_token, reintentamos con password
            if (finalGrantType === 'refresh_token') {
                console.warn('⚠️ Refresh token inválido o revocado. Reintentando login completo...');
                return await electronicFacturationController.getAuthToken('password');
            }
            
            console.error('❌ Error detallado de Factus:', data);
            throw new Error(data.message || data.error || 'Error en la autenticación');
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
        if(stored){
          console.log('Res ran num Cache: ',stored);
          return (stored);
        }
        const response = await fetch('https://api-sandbox.factus.com.co/v1/numbering-ranges', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${auth.access_token}` // ¡ESTO ES VITAL!
            },
        });

        const data = await response.json();
        console.log('Res ran num: ',data);
        console.log('Rangos Numericos: ',data.data.data);
        saveNumberingRanges(data.data.data)
        if (!response.ok) throw new Error(data.message || 'Error al obtener rangos');
        return data;
    } catch (error) {
        console.error('Error en Rangos:', error.message);
        throw error;
    }   
};

electronicFacturationController.getTaxes = async () => {
    const auth = await electronicFacturationController.getAuthToken();
    try {
        const response = await fetch('https://api-sandbox.factus.com.co/v1/tributes/products', {
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
        "numbering_range_id": 8,
        "reference_code": "fact0022025",
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
            },
            {
                "code_reference": "54321",
                "name": "SGA 2 ",
                "quantity": 1,
                "discount": 0,
                "discount_rate": 0,
                "price": 250000,
                "tax_rate": "5.00",
                "unit_measure_id": 70,
                "standard_code_id": 1,
                "is_excluded": 0,
                "tribute_id": 1,
                "withholding_taxes": []
            }
        ]*/
       "items":info.items
    }
    console.log(params)
    const response = await fetch('https://api-sandbox.factus.com.co/v1/bills/validate', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json', // ¡Faltaba este!
            'Accept': 'application/json'
        },
        body: JSON.stringify(params)
    });
    const resInvoice = await response.json();
    if(resInvoice.status == 'Created'){
        let data = resInvoice.data
        let insertRes = await electronicFacturationController.registerElectronicInvoice({
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
            qr_image:data.bill.qr_image
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


electronicFacturationController.registerElectronicInvoice = async(info)=>{
    let sentence = `
        INSERT INTO "ElectronicFacturation".invoices(
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
            qr_image
            )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id;
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
        info.qr_image
    ],3);
    return consulta;
}


electronicFacturationController.getAuthToken('password',null);

export default electronicFacturationController;