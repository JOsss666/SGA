import fs from 'fs/promises';
import { type } from 'os';
import path from 'path';

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
    // 1. VALIDACIÓN DE SEGURIDAD: 
    // Si grantType no es una de las dos opciones válidas, forzamos 'password'.
    // Esto evita el error "unsupported_grant_type" si se cuela un parámetro basura.
    const validGrants = ['password', 'refresh_token'];
    let finalGrantType = validGrants.includes(grantType) ? grantType : 'password';

    // 2. Intentar cargar token desde el archivo si es un flujo normal de password
    let stored = await readFile(TOKEN_PATH);

    if (stored && finalGrantType === 'password') {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // ¿Sigue siendo válido?
        if (now < (stored.expires_at - fiveMinutes)) {
            console.log('✅ Utilizando token guardado en caché');
            electronicFacturationController.authToken = stored;
            return stored;
        }
        
        // Si expiró pero tenemos el refresh_token guardado, lo usamos automáticamente
        if (stored.refresh_token) {
            console.log('🔄 El access_token expiró, intentando refrescar...');
            finalGrantType = 'refresh_token';
            refreshToken = stored.refresh_token;
        }
    }

    try {
        // 3. Construcción del Payload con los nombres exactos que pide Factus
        const payload = {
            grant_type: finalGrantType,
            client_id: process.env.FACTUS_CLIENT_ID,
            client_secret: process.env.FACTUS_CLIENT_SECRET,
        };

        if (finalGrantType === 'password') {
            payload.username = process.env.FACTUS_USERNAME;
            payload.password = process.env.FACTUS_PASSWORD;
        } else {
            // Si el refreshToken llegó nulo por alguna razón, abortamos antes de pedirlo
            if (!refreshToken) throw new Error("Se requiere refresh_token para este grant_type");
            payload.refresh_token = refreshToken;
        }

        console.log(`🚀 Solicitando token a Factus con grant_type: [${finalGrantType}]`);

        const response = await fetch('https://api-sandbox.factus.com.co/oauth/token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // 4. Si la API de Factus responde con error (aquí verías el unsupported_grant_type si algo falló)
        if (!response.ok) {
            console.error('❌ Error detallado de Factus:', data);
            throw new Error(data.message || data.error || 'Error en la autenticación');
        }

        // 5. Guardar en el archivo para el futuro
        const savedToken = await saveToken(data);
        electronicFacturationController.authToken = savedToken;
        
        console.log('✨ Nuevo token obtenido y guardado exitosamente');
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
            "identification": "123456789",
            "dv": "3",
            "company": "",
            "trade_name": "",
            "names": "Alan Turing",
            "address": "calle 1 # 2-68",
            "email": "alanturing@enigmasas.com",
            "phone": "1234567890",
            "legal_organization_id": "2",
            "tribute_id": "21",
            "identification_document_id": "3",
            "municipality_id": "980"
        },
        "items": [
            {
                "code_reference": "12345",
                "name": "producto de prueba",
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
                "name": "producto de prueba 2",
                "quantity": 1,
                "discount": 0,
                "discount_rate": 0,
                "price": 50000,
                "tax_rate": "5.00",
                "unit_measure_id": 70,
                "standard_code_id": 1,
                "is_excluded": 0,
                "tribute_id": 1,
                "withholding_taxes": []
            }
        ]
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
    const data = await response.json();
    console.log('XXXXX ',data)
  })
}


electronicFacturationController.getAuthToken('password',null);

export default electronicFacturationController;