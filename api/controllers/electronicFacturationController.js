import { useDataBase } from '../app.js';
import dotenv from 'dotenv';
import factusService from '../services/factusService.js';
import electronicProviderCredentialsService from '../services/electronicProviderCredentialsService.js';
import sessionRepository from '../repositories/sessionRepository.js';

dotenv.config();

const electronicFacturationController = {};
const DEFAULT_FACTUS_ENVIRONMENT = 'sandbox';

const getCompanyIdFromInfo = (info = {}) => (
    info.company_id
    ?? info.company_info?.company_id
    ?? info.document?.company_id
    ?? info.company?.company_id
    ?? 0
);

const getEnvironmentFromInfo = (info = {}) => (
    info.environment
    ?? info.company_info?.factus_environment
    ?? info.company_info?.electronic_environment
    ?? info.company?.factus_environment
    ?? info.company?.electronic_environment
    ?? info.document?.factus_environment
    ?? info.document?.electronic_environment
);

const resolveEnvironmentFromInfo = async (info = {}) => (
    getEnvironmentFromInfo(info)
    ?? await electronicProviderCredentialsService.getPreferredEnvironment({
        company_id: getCompanyIdFromInfo(info),
        provider: 'factus'
    })
    ?? DEFAULT_FACTUS_ENVIRONMENT
);

const parseRoleConfig = (roleConfig) => {
    if (!roleConfig) return null;
    try {
        return typeof roleConfig === 'string' ? JSON.parse(roleConfig) : roleConfig;
    } catch {
        return null;
    }
};

// Busca electronicFacturation.numberingRanges sin depender de una ruta fija.
const findNumberingPolicy = (obj) => {
    if (!obj || typeof obj !== 'object') return undefined;
    if (obj.electronicFacturation?.numberingRanges) return obj.electronicFacturation.numberingRanges;
    for (const key of Object.keys(obj)) {
        const found = findNumberingPolicy(obj[key]);
        if (found) return found;
    }
    return undefined;
};

// Devuelve la lista blanca de rangos de numeración de facturas autorizados para
// el rol del usuario. `null` = sin restricción (rol con overAll o sin config).
const resolveInvoiceNumberingPolicy = async (info = {}) => {
    const userId = parseInt(info.user_id);
    const companyId = parseInt(getCompanyIdFromInfo(info));
    if (!Number.isInteger(userId) || userId <= 0) return { allowedRangeIds: null };
    if (!Number.isInteger(companyId) || companyId <= 0) return { allowedRangeIds: null };

    const membership = await sessionRepository.findMembership(userId, companyId);
    const config = parseRoleConfig(membership?.role_config);
    const numberingRanges = config?.services?.sga?.electronicFacturation?.numberingRanges
        ?? findNumberingPolicy(config);
    const enabled = Array.isArray(numberingRanges?.enabled) ? numberingRanges.enabled : [];

    // La lista `enabled` es autoritativa: si tiene elementos, solo esos rangos aplican.
    if (enabled.length > 0) {
        return { allowedRangeIds: enabled };
    }

    // Sin lista blanca: overAll o ausencia de config => sin restricción.
    if (!numberingRanges || numberingRanges.overAll === true) {
        return { allowedRangeIds: null };
    }

    // overAll:false y enabled vacío => ningún rango autorizado.
    return { allowedRangeIds: [] };
};

const resolveElectronicDocumentContext = async (info = {}) => {
    const billNumber = `${info.bill_numer ?? info.bill_number ?? info.number ?? ''}`.trim();
    if (!billNumber) {
        throw new Error('El número de la factura es requerido.');
    }

    let companyId = parseInt(getCompanyIdFromInfo(info));

    // Compatibilidad con clientes anteriores que solo enviaban el número.
    // La factura local conoce la compañía cuyas credenciales deben usarse.
    if (!Number.isInteger(companyId) || companyId <= 0) {
        const result = await useDataBase(`
            SELECT company_id
            FROM "ElectronicFacturation".documents
            WHERE number = $1
            ORDER BY id DESC
            LIMIT 1;
        `, [billNumber], 1);

        if (!result[0]) {
            throw new Error(`No se encontró la factura electrónica ${billNumber} en la base de datos local.`);
        }

        companyId = parseInt(result[1][0].company_id);
    }

    if (!Number.isInteger(companyId) || companyId <= 0) {
        throw new Error(`La factura electrónica ${billNumber} no tiene una compañía válida.`);
    }

    const requestInfo = {
        ...info,
        company_id: companyId
    };

    return {
        billNumber,
        companyId,
        environment: await resolveEnvironmentFromInfo(requestInfo)
    };
};

const sendFactusDownloadResponse = (res, response, billNumber) => {
    const payload = response.data ?? {};

    if (!response.ok) {
        const message = payload.message
            ?? payload.error
            ?? `No se pudo descargar el documento ${billNumber}`;

        res.writeHead(response.status || 502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Error', message }));
        return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
};

export async function getNumercRangeData(type, company_id = 0, environment = DEFAULT_FACTUS_ENVIRONMENT) {
    return factusService.getNumberingRangeId({ company_id, environment, type });
}

electronicFacturationController.getAuthToken = async (grantType = 'password', refreshToken = null, bypassCache = false, info = {}) => (
    factusService.getAuthToken({
        company_id: getCompanyIdFromInfo(info),
        environment: await resolveEnvironmentFromInfo(info),
        bypassCache
    })
);

electronicFacturationController.getNumberingRanges = async (req, res) => {
    try {
        const info = {
            ...req.query,
            ...(req.body ?? {})
        };
        console.log('Params numbering ranges: ',info);
        const environment = await resolveEnvironmentFromInfo(info);
        const ranges = await factusService.getNumberingRanges({
            company_id: getCompanyIdFromInfo(info),
            environment
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([ranges.length > 0, ranges]));
    } catch (error) {
        console.error('Error en Rangos:', error.message);
        if (res) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'Error', message: error.message }));
        }
    }   
};

// Asigna manualmente el consecutivo actual de un rango de numeración en Factus.
// Body esperado: { numbering_range_id, current, company_id?, environment? }
electronicFacturationController.setNumberingRangeCurrent = (req, res) => {
    let bodyData = '';
    req.on('data', chunk => {
        bodyData += chunk;
    });
    req.on('end', async () => {
        try {
            const info = bodyData ? JSON.parse(bodyData) : {};
            console.log('Información actual: ',info)
            const environment = await resolveEnvironmentFromInfo(info);
            const data = await factusService.setNumberingRangeCurrent({
                company_id: getCompanyIdFromInfo(info),
                environment,
                numbering_range_id: info.numbering_range_id ?? info.id,
                current: info.current
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'OK', data }));
        } catch (error) {
            console.log('ERRR: ',error);
            console.error('Error al asignar el consecutivo del rango:', error.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'Error', message: error.message }));
        }
    });
    req.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Error', message: err.message }));
    });
};

// Elimina una factura PENDIENTE de la DIAN en Factus. Recibe el número de la
// factura (ZJ1..., INT..., etc.); el reference_code se resuelve consultando
// Factus (no la base local). También acepta reference directo.
// Body esperado: { number | bill_numer (o reference | reference_code), company_id, environment? }
electronicFacturationController.deletePendingBill = (req, res) => {
    let bodyData = '';
    req.on('data', chunk => {
        bodyData += chunk;
    });
    req.on('end', async () => {
        try {
            const info = bodyData ? JSON.parse(bodyData) : {};
            const environment = await resolveEnvironmentFromInfo(info);
            const data = await factusService.deletePendingBill({
                company_id: getCompanyIdFromInfo(info),
                environment,
                number: info.number ?? info.bill_numer,
                reference: info.reference ?? info.reference_code
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'OK', data }));
        } catch (error) {
            console.error('Error al eliminar la factura pendiente:', error.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'Error', message: error.message }));
        }
    });
    req.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Error', message: err.message }));
    });
};

electronicFacturationController.getTaxes = async (req, res) => {
    try {
        const info = {
            ...req.query,
            ...(req.body ?? {})
        };
        const environment = await resolveEnvironmentFromInfo(info);
        const response = await factusService.request({
            company_id: getCompanyIdFromInfo(info),
            environment,
            path: '/v1/tributes/products'
        });
        if (!response.ok) throw new Error(response.data?.message || 'Error al obtener tributos');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response.data));
    } catch (error) {
        console.error('Error en Tributos Factus:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Error', message: error.message }));
    }   
};

electronicFacturationController.showActualToken = async(req, res)=>{
    try {
        const info = {
            ...req.query,
            ...(req.body ?? {})
        };
        const environment = await resolveEnvironmentFromInfo(info);
        const tokenInfo = await factusService.getAuthToken({
            company_id: getCompanyIdFromInfo(info),
            environment
        });
        const payload = {
            status: 'OK',
            company_id: tokenInfo.company_id,
            provider: tokenInfo.provider,
            environment: tokenInfo.environment,
            token_type: tokenInfo.token_type,
            expires_at: tokenInfo.expires_at
        };
        console.log('Token Factus actual:', payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    } catch (error) {
        console.error('Error consultando token Factus:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Error', message: error.message }));
    }
}

electronicFacturationController.getMunicipalities = async (req, res) => {
    try {
        const info = {
            ...req.query,
            ...(req.body ?? {})
        };
        const environment = await resolveEnvironmentFromInfo(info);
        const response = await factusService.request({
            company_id: getCompanyIdFromInfo(info),
            environment,
            path: '/v1/municipalities'
        });

        if (!response.ok) throw new Error(response.data?.message || `Error en Factus: ${response.status}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response.data));

    } catch (error) {
        console.error('Error al obtener municipios:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
};

electronicFacturationController.newInvoice = (req,res)=>{
  let bodyData = '';
  req.on('data',chunk=>{
      bodyData += chunk;
  })
	  req.on('end',async()=>{
        try {
	    let info = JSON.parse(bodyData);
		    console.log('--X ',info);
        const companyId = getCompanyIdFromInfo(info);
        const environment = await resolveEnvironmentFromInfo(info);
        console.log('Ambiente Factus para factura:', environment);
        const numberingPolicy = await resolveInvoiceNumberingPolicy(info);
	    let params = {
	        "document": "01",
	        "numbering_range_id": await factusService.getNumberingRangeId({
                company_id: companyId,
                environment,
                type: 'invoice',
                preferredRangeId: info.numbering_range_id ?? info.document?.numbering_range_id ?? null,
                allowedRangeIds: numberingPolicy.allowedRangeIds
            }),
        "reference_code": `FVE_${info.document.ownSerial}`,
        "observation":info.document.e_invoiceDescription,
        "payment_method_code": info.document.paymentMethod_code,
        "customer": {
            "identification": info.customer.indentification_number,
            "dv": `${info.customer.dv}` ?? "3",
            "company": `${info.customer.names} ${info.customer.lastNames}`,
            "trade_name": info.customer.names,
            "names":info.customer.corporative_name != '' && info.customer.corporative_name != undefined ? info.customer.corporative_name:info.customer.names,
            "address": info.customer.address,
            //"email": info.customer.mail,
            "email": info.customer.mail,
            "phone": info.customer.phone,
            "legal_organization_id": info.customer.thirdParty_nature,
            "tribute_id": info.customer.IVA_responsability ?? '18',
            "identification_document_id": info.customer.identidicationType_id,
            "municipality_id": info.customer.municipality_id?? 149
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
	    const response = await factusService.validateInvoice({
            company_id: companyId,
            environment,
            payload: params
        });
	    let resInvoice = response.data;
	    console.log('Respuesta:  ',resInvoice)
	    if (!response.ok && (resInvoice.message?.includes('pendiente') || response.status === 409)) {
	        let pendingReference = resInvoice.reference_code;

        if (!pendingReference) {
            // Search for invoice pending of validation.
            // OJO: la lista de Factus viene SIN filtrar; solo status 0 (pendiente DIAN)
            // bloquea el canal. status 1 = validada -> NUNCA borrar.
            console.log('Buscando factura pendiente... ',pendingReference)
	            const pendingRes = await factusService.request({
                    company_id: companyId,
                    environment,
                    path: '/v1/bills'
	            });
	            const pendingData = pendingRes.data;
	            const allBills = pendingData?.data?.data ?? pendingData?.data ?? [];
	            const pendingBill = allBills.find(b => String(b.status) === '0');
            pendingReference = pendingBill?.reference_code;
        }

        if (pendingReference) {

	            // CASE FOR INVOICE PENDING OF VALIDATION BLOKING THE CHANNEL

	            console.log('Eliminado factura... ',pendingReference)
	            const deleteRes = await factusService.request({
                    company_id: companyId,
                    environment,
                    path: `/v1/bills/destroy/reference/${pendingReference}`,
                    method: 'DELETE'
	            });

	            if (deleteRes.ok) {
	                console.log(' Canal liberado exitosamente. Reintentando validación de la factura actual...');
	                let newResponse = await factusService.validateInvoice({
                        company_id: companyId,
                        environment,
                        payload: params
                    });
	                resInvoice = newResponse.data;
	                // Logueamos el CUERPO, no el objeto Response, para poder ver
	                // el motivo real si Factus responde 422 (datos inválidos).
	                console.log(`Re intento de creación [HTTP ${newResponse.status}]: `, JSON.stringify(resInvoice));
	            } else {
	                console.log(`No se pudo liberar el canal [HTTP ${deleteRes.status}]: `, JSON.stringify(deleteRes.data));
	            }
        }

    }

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
        } catch (error) {
            console.error('Error creando factura electronica:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'Error',
                message: error.message
            }));
        }
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
        try {
	    let info = JSON.parse(bodyData);
        console.dir(info, { depth: null, colors: true });
        const companyId = getCompanyIdFromInfo(info);
        const environment = await resolveEnvironmentFromInfo(info);
        const identificationDocumentId = Number(info.customer?.identidicationType_id);
        if (!Number.isInteger(identificationDocumentId)) {
            throw new Error('El cliente no tiene un tipo de identificación válido para Factus.');
        }
        console.log('Ambiente Factus para nota:', environment);
	    let params = {
	        "numbering_range_id": await factusService.getNumberingRangeId({
                company_id: companyId,
                environment,
                type: info.type == 'Credit Note'? 'cr_note':'db_note'
            }),
        "correction_concept_code": 2,
        // System use 22 when the note dont have an asociated bill. --> bill_id becomes optional
        "customization_id": info.bill_id != undefined? 20:22,
        "bill_id": info.bill_id,
        "reference_code":`${info.type}_${info.doc_id}`,
        "observation": "",
        "payment_method_code": "10",
        "customer": {
            "identification": info.customer.indentification_number,
            "dv": `${info.customer.dv}` ?? "3",
            "company": `${info.customer.names} ${info.customer.lastNames}`,
            "trade_name": info.customer.names,
            "names": info.customer.names,
            "address": info.customer.address,
            "email": info.customer.mail,
            "phone": info.customer.phone,
            "legal_organization_id": info.customer.thirdParty_nature,
            "tribute_id": info.customer.IVA_responsability ?? '18',
            "identification_document_id": identificationDocumentId,
            "municipality_id": info.customer.municipality_id?? 149
        },
        "items":info.items
	    }
	    console.dir(params, { depth: null, colors: true });
	    const response = await factusService.validateCreditNote({
            company_id: companyId,
            environment,
            payload: params
        });
	    const resInvoice = response.data;
        if (resInvoice?.status !== 'Created') {
            console.error(
                'Factus rechazó la nota electrónica:\n',
                JSON.stringify(resInvoice, null, 2)
            );
        } else {
            console.dir(resInvoice, { depth: null, colors: true });
        }
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
        } catch (error) {
            console.error('Error creando nota electronica:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'Error',
                message: error.message
            }));
        }
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
        console.log('Buscando documentos .....')
        let info = JSON.parse(data);
        let values = [];
        let whereClauses = [];

        if(info.company_id != undefined){
            values.push(info.company_id);
            whereClauses.push(`"ElectronicFacturation".documents.company_id = $${values.length}`);
        }

        if(info.doc_id != undefined){
            values.push(info.doc_id);
            whereClauses.push(`"ElectronicFacturation".documents.doc_id = $${values.length}`);
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
                "Ecosystem".docs_instances.instance_id,
                "Process".process_instance."ownSerial" AS "instance_ownSerial",
                "Process".process_instance.process_id,
                "Process".processes.code AS "process_code",
                "Ecosystem".documents.total AS doc_total,
                "Ecosystem".documents."thirdParty_id",
                "Ecosystem".documents."ownSerial" AS "doc_ownSerial",
                "Ecosystem".documents.document_type,
                "Ecosystem".documents.status AS doc_status,
                "Ecosystem".thirdparties.names AS "thirdParty_names",
                "Ecosystem".thirdparties.mail AS "thirdParty_mail",
                "Ecosystem".thirdparties.type AS "thirdParty_type"
            FROM
                "ElectronicFacturation".documents
            LEFT JOIN
                "Ecosystem".documents
            ON
                "ElectronicFacturation".documents.doc_id = "Ecosystem".documents.id
            LEFT JOIN
                "Ecosystem".thirdparties
            ON
                "Ecosystem".documents."thirdParty_id" = "Ecosystem".thirdparties.id
            LEFT JOIN
                "Ecosystem".docs_instances
            ON
                "Ecosystem".documents.id = "Ecosystem".docs_instances.doc_id
            LEFT JOIN
                "Process".process_instance
            ON
                "Ecosystem".docs_instances.instance_id = "Process".process_instance.id
            LEFT JOIN
                "Process".processes
            ON
                "Process".process_instance.process_id = "Process".processes.id
            ${whereQuery}
            ORDER BY id DESC ;
        `;
        let consulta = await useDataBase(sentence,values,1);
        console.log('Enviando documentos... ')
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
		try {
		    const info = JSON.parse(data);
            const context = await resolveElectronicDocumentContext(info);
	        console.log(`Consultando factura ${context.billNumber} para company_id ${context.companyId} (${context.environment})`);
	        const response = await factusService.request({
                company_id: context.companyId,
                environment: context.environment,
                path: `/v1/bills/show/${encodeURIComponent(context.billNumber)}`
            });

            res.writeHead(response.status || 502, {'Content-Type':'application/json'});
            res.end(JSON.stringify(response.data));
        } catch (error) {
            console.error('Error consultando factura en Factus:', error.message);
            res.writeHead(400, {'Content-Type':'application/json'});
            res.end(JSON.stringify({ status: 'Error', message: error.message }));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

electronicFacturationController.downloadBill = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
	req.on('end',async()=>{
        try {
            const info = JSON.parse(data);
            const context = await resolveElectronicDocumentContext(info);
            console.log(`Descargando PDF de factura ${context.billNumber} para company_id ${context.companyId} (${context.environment})`);
            const response = await factusService.request({
                company_id: context.companyId,
                environment: context.environment,
                path: `/v1/bills/download-pdf/${encodeURIComponent(context.billNumber)}`
            });
            sendFactusDownloadResponse(res, response, context.billNumber);
        } catch (error) {
            console.error('Error descargando PDF de Factus:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'Error', message: error.message }));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

electronicFacturationController.downloadBillXML = (req,res)=>{
    let data = '';
    req.on('data',chunk=>{
        data += chunk
    })
	req.on('end',async()=>{
        try {
            const info = JSON.parse(data);
            const context = await resolveElectronicDocumentContext(info);
            console.log(`Descargando XML de factura ${context.billNumber} para company_id ${context.companyId} (${context.environment})`);
            const response = await factusService.request({
                company_id: context.companyId,
                environment: context.environment,
                path: `/v1/bills/download-xml/${encodeURIComponent(context.billNumber)}`
            });
            sendFactusDownloadResponse(res, response, context.billNumber);
        } catch (error) {
            console.error('Error descargando XML de Factus:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'Error', message: error.message }));
        }
    })
    req.on('error',(err)=>{
        res.writeHead(500,{'Content-Type':'text/plain'})
        res.end(JSON.stringify(err));
    })
}

// Función auxiliar interna para limpiar el bache en Factus
async function deletePendingBillInternal(company_id, reference_code, environment = DEFAULT_FACTUS_ENVIRONMENT) {
    try {
        console.log(`🧹 Limpiando factura pendiente con referencia: ${reference_code}`);
        const response = await factusService.request({
            company_id: company_id ?? 0,
            environment,
            path: `/v1/bills/destroy/reference/${reference_code}`,
            method: 'DELETE'
        });

        const resData = response.data;
        console.log('Respuesta de eliminación en Factus:', resData);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Función para inicializar servicios al arrancar el servidor
electronicFacturationController.init = async () => {
    console.log('--- Facturación electrónica lista para usar credenciales dinámicas ---');
    console.log('La autenticación contra Factus se hará bajo demanda por company_id.');
};

export default electronicFacturationController;
