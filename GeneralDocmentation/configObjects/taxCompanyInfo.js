


const demo = {
    "withholdingRetentions":[ // --> Lista de retenciones que practica la compañia a nivel nacional
        // --> Se obtienen de la lista de impuestos que ya tiene creado el usuario
        {
            name:"Retención en la fuente a titulo de..",
            code:'02',
            rate:15,
            base:0
        },
        {
            name:"Retención en la fuente a titulo de..",
            code:'02',
            rate:15,
            base:0
        }
    ],
    selfWithholdingAgent:false, // --> Campo utilizado para control retencion en la venta
    regime:'Regimen Ordinario Renta', // --> Formulario opcion 1 o 2
    // Preguntas Excel
    incomeTaxFiler:false, // --> Declarante impuesto sobre la RENTA
    specialIncomeTaxRegime:false, // --> Regimen tributario Especial RENTA
    DIANMajorTaxpayer:false, // --> Gran Contribuyente DIAN
    incomeTaxWithholdingAgent:false,// --> Agente retenedor a titulo de Renta
    IVAwithholdingAgent:false,// --> Agente retenedor a titulo de IVA
    rentSelfWithholding:false,// --> Autorretenedor RENTA
    requiredIssueInvoices:false,// --> Obligado a facturar
    requiredIssueInvoices:false,// --> Obligado a facturar
    // Pendiente de implementar (Agente retenedor a titulo de IVA por ventas CI)
    territorialTaxes:[
        {
            name:'ICA',
            code:'05',
            regions:[ // --> Municipios u otras entidades territoriales
                {
                    name:'Bogota DC',
                    code:'02',
                    clasification:'Clasificacion etc ...',
                    isTaxRetainer:true, // --> Si es o no retenedor del impuesto regional
                    isSelfTaxRetainer:false, // --> Si es o no auto retenedor del impuesto regional
                    minimumBase:0, // --> Aplica base minima en valor o (Variables como UVTS y demas);
                    activities:[
                        {
                            code:'01', // --> Codigo actividad economica
                            description:'Actividad 1', // --> Nombre o desc actividad economica
                            rate:5, // --> Tarifa a esta actividad
                        },
                        {
                            code:'02', // --> Codigo actividad economica
                            description:'Actividad 2', // --> Nombre o desc actividad economica
                            rate:10, // --> Tarifa a esta actividad
                        }
                    ]
                }
            ]
        }
    ]
}