


const demo = {
    //selfWithholdingAgent:false, // --> Campo utilizado para control retencion en la venta
    regime:'Regimen Ordinario Renta', // --> Formulario opcion 1 o 2
    // Preguntas nuew form
    rent:{
        // RENTA
        rentTaxResponsable:false, // Responsable del impuesto sobre RENTA
        rentTaxDeclarant:false, // Declarante impuesto sobre la RENTA
        rentWithholdingAgent:false, // Agente retenedor a titulo de RENTA
        rentSelfWithholdingAgent:false, // Autorreteneor a titulo de RENTA
        rentSpecialSelfWithholdingAgent:false, // Autoretenedor especial de RENTA
    },
    iva:{
        // IVA
        stateEntity:false, // Entidad estatal
        DIANMajorTaxpayer:false,//Gran Contribuyente DIAN
        ivaTaxResponsable:false, // Responsable de IVA
        ivaWithholdingAgent:false, // Agente retenedor a titulo de IVA
        ivaWithholdingAgentByCI:false, // Agente retenedor a titulo de IVA por ventas CI
    },
    ring:{
        // TIMBRE
        ringTaxResponsable:false, // Responsable impuesto de timbre
        ringWithholdingAgent:false, // Agente retenedor a titulo de timbre
        ringSelfWithholdingAgent:false, // Autorretenedor a titulo de timbre
    },
    consumption:{
        // TIMBRE
        consumptionTaxResponsable:false, // Responsable impuesto al Consumo
        consumptionWithholdingAgent:false, // Agente retenedor a titulo de impuesto al consumo
        consumptionSelfWithholdingAgent:false, // Autorretenedor a titulo de impuesto al consumo
    },
    territorialTaxes:[
        {
            name:'ICA',
            code:'05',
            regions:[ // --> Municipios u otras entidades territoriales
                {
                    name:'Bogota DC',
                    code:'02',
                    // responsable,
                    // Gran contribuyente,
                    // regimen comun,
                    // regimen especial,
                    isTaxRetainer:true, // --> Si es o no retenedor del impuesto regional
                    isSelfTaxRetainer:false, // --> Si es o no auto retenedor del impuesto regional
                    activities:[
                        {
                            code:'01', // --> Codigo actividad economica
                            description:'Actividad 1', // --> Nombre o desc actividad economica
                            rate:5, // --> Tarifa a esta actividad
                            minimumBase:0, // --> Aplica base minima en valor o (Variables como UVTS y demas);
                        },
                        {
                            code:'02', // --> Codigo actividad economica
                            description:'Actividad 2', // --> Nombre o desc actividad economica
                            rate:10, // --> Tarifa a esta actividad
                            minimumBase:0, // --> Aplica base minima en valor o (Variables como UVTS y demas);
                        }
                    ]
                }
            ]
        }
    ]
}