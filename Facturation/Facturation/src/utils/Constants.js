import { postInfo } from "./functions";



export const ThirdPartyNatureCodes = [
    {text:'Persona juridica',value:1},
    {text:'Persona Natural',value:2}
];

export const ThirdPartyIvaResponsabilityCodes = [
    {text:'No aplica / No responsable de IVA',value:21},
    {text:'Responsable de IVA',value:18},
    {text:'No responsable de consumo',value:22},
];

export const ThirdPartyFactusIdentificationTypeCodes = [
    { text: 'NIT', value: 6 },
    { text: 'Cédula de Ciudadanía', value: 3 },
    { text: 'Cédula de Extranjería', value: 5 },
    { text: 'Tarjeta de extranjería', value: 4 },
    { text: 'Pasaporte', value: 7 },
    { text: 'Registro civil', value: 11 },
    { text: 'Tarjeta de identidad', value: 12 }
];


export async function insertCredentials(){
    let res = await postInfo('/electronicFacturation/providerCredentials',{
        "company_id": 1,
        "provider": "factus",
        "environment": "production",
        "api_url": "https://api.factus.com.co",
        "client_id": "a1990244-e151-41de-bd0c-c9a27a9a56ad",
        "client_secret": "s11tghu07gYTubA9TvEWuie8s3u6FOo1WFf39dvV",
        "username": "zyjdigitalimpresion@gmail.com",
        "password": "79741447",
        "status": "active"
        });
    console.log('CR res: ',res);
}

export async function handShakeFacturationCredentials(){
    let res = await postInfo('/electronicFacturation/providerCredentials/testConnection',{
        "company_id": 1,
        "environment": "production"
    })
    console.log('handShake facturation credentials: ',res);
}