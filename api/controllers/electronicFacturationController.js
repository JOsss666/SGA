import axios from "axios";

const electronicFacturationController = {};

electronicFacturationController.createInvoice = async (req, res) => {
    try {
        const { customerData, items, invoiceNumber } = req.body;

        // 2. Construimos el objeto siguiendo el esquema de tu agente (Dataico)
        const dataicoPayload = {
            actions: {
                send_dian: true,
                send_email: false,
                email: "murillojose.nvc@gmail.com",
                pdf: "string", // Opcional
                attachments: []
            },
            invoice: {
                // IGNORAR POR AHORA DATOS ARL Y SECTOR SALUDA
                health: {
                    version: "API_SALUD_V1",
                    coverage: "COBERTURA_ARL",
                    person: {
                        first_name: "Javier",
                        last_name: "Mendoza",
                        identification: "900373118",
                        dian_identification_type: "TI"
                    },
                    associated_users: []
                },
                currency: "COP",
                invoice_type_code: "FACTURA_VENTA",
                items: items, // Los items que vienen de tu base de datos
                number: invoiceNumber,
                numbering: {
                    resolution_number: process.env.DATAICO_RESOLUTION,
                    prefix: "SETP",
                    flexible: true
                },
                customer: customerData, // El cliente que seleccionaste en el SGA
                dataico_account_id: process.env.DATAICO_ACCOUNT_ID,
                env: process.env.NODE_ENV === 'production' ? 'PRODUCCION' : 'PRUEBAS',
                operation: "ESTANDAR"
            }
        };

        // Envio y manejo respuesta
        const response = await axios({
            method: 'post',
            url: 'https://api.dataico.com/dataico_api/v2/invoices',
            timeout: 20000,
            headers: {
                'Content-Type': 'application/json',
                'Auth-Token': process.env.DATAICO_TOKEN
            },
            data: dataicoPayload
        });

        // 4. Respuesta al Frontend
        return res.status(200).json({
            success: true,
            dian_status: response.data.status,
            cufe: response.data.cufe,
            invoice_url: response.data.pdf_url
        });

    } catch (error) {
        console.error("Error DIAN Dataico:", error.response?.data || error.message);
        
        return res.status(error.response?.status || 500).json({
            success: false,
            error: "Error en facturación electrónica",
            details: error.response?.data?.errors || error.message
        });
    }
};


export default electronicFacturationController;


/*
   MODEL DATAICO FACTURA
{
  "actions": {
    "send_dian": false,
    "send_email": false,
    "email": "murillojose.nvc@gmail.com",
    "pdf": "string",
    "attachments": [
      {
        "name": "extra-file.pdf",
        "data": "string"
      }
    ]
  },
  "invoice": {
    "currency_exchange_rate_date": "21/02/2019",
    "issue_date": "21/02/2019",
    "currency": "COP",
    "invoice_type_code": "FACTURA_VENTA",
    "charges": [
      {
        "base-amount": 1200,
        "reason": "Envios",
        "discount": true
      }
    ],
    "order_reference": "OC20",
    "items": [
      {
        "sku": "SKU_112322",
        "mandante-identification": "900123123",
        "taxes": [
          {
            "tax-category": "IVA",
            "tax-rate": 19,
            "tax-amount": 190,
            "tax-description": "Impuesto Cigarillo",
            "tax-base": 100,
            "base-amount": 1000
          }
        ],
        "measuring-unit": "CEN",
        "quantity": 10,
        "retentions": [
          {
            "tax-category": "RET_IVA",
            "tax-rate": 15,
            "base-amount": 2000,
            "amount": 20
          }
        ],
        "mandante-identification-type": "NIT",
        "original-price": 2800.1,
        "discount-rate": 10.5,
        "price": 2300,
        "description": "string"
      }
    ],
    "payment_means_type": "DEBITO",
    "retentions": [
      {
        "tax_category": "RET_IVA",
        "tax_rate": 15
      }
    ],
    "prepayments": [
      {
        "amount": 1200,
        "description": "Pago para Abril",
        "received_date": "21/02/2019"
      }
    ],
    "operation": "ESTANDAR",
    "number": "98001",
    "numbering": {
      "resolution_number": "18760000001",
      "prefix": "SETP",
      "flexible": true
    },
    "dataico_account_id": "002979c5-7c23-43ab-aa98-3fa7dce6e4d0",
    "payment_date": "23/02/2019 13:22:43",
    "env": "PRUEBAS",
    "currency_exchange_rate": 3854,
    "notes": [
      "string"
    ],
    "customer": {
      "department": "ANTIOQUIA o 05",
      "address_line": "Calle 12",
      "party_type": "PERSONA_JURIDICA",
      "city": "MEDELLIN o 001",
      "tax_level_code": "SIMPLIFICADO",
      "id": "string",
      "email": "test@email.com",
      "country_code": "CO",
      "updated_at": "string",
      "first_name": "string",
      "phone": "string",
      "party_identification_type": "NUIP",
      "company_name": "string",
      "family_name": "string",
      "regimen": "AUTORRETENEDOR",
      "party_identification": "132322333"
    },
    "payment_means": "DEBIT_CARD"
  }
}

*/