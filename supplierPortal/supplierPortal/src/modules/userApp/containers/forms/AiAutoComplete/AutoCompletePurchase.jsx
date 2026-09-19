import { useState } from "react";
import { MainTitleAi } from "../../../components/ChatAiComponents/MainTitleAi";
import { DescriptionSpan } from "../../../components/DescriptionSpan";
import { FileInput } from "../../../components/FileInput";
import { WarningForm } from "../../../components/WarningForm";
import { runAiTask } from "../../../../../utils/aiUtils";
import { useAlert, useAppInfo, useNotifications } from "../../../../../context/context";
import { CapsuleButtonAi } from "../../../components/ChatAiComponents/CapsuleButtonAi";
import { FormButton } from "../../../components/FormButton";
import { postInfo } from "../../../../../utils/functions";
import { LoaderAiUtoComplete } from "./LoaderAiUtoComplete";
import './AutoCompletePurchase.css'

// Datos del EMISOR / VENDEDOR extraídos directamente del documento.
const purchaseValidationSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: ['OK', 'Error'] },
        message: { type: 'string' },
        selectedThirdParty: {
            anyOf: [
                {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        names: { type: 'string' },
                        mail: { type: 'string' },
                        documentType: { type: 'string' },
                        identificationNumber: { type: 'string' }
                    },
                    required: ['names', 'mail', 'documentType', 'identificationNumber']
                },
                { type: 'null' }
            ]
        }
    },
    required: ['status', 'message', 'selectedThirdParty']
};

const purchaseItemsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        items: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    documentDescription: { type: 'string' },
                    selectedItemIndex: { type: ['integer', 'null'] },
                    units: { type: 'number' },
                    unitValue: { type: 'number' }
                },
                required: ['documentDescription', 'selectedItemIndex', 'units', 'unitValue']
            }
        }
    },
    required: ['items']
};

export function AutoCompletePurchase({thirdParties,onComplete}){

    // Requierments
    const {appInfo} = useAppInfo();
    const {popOutAlert} = useAlert();
    const {addNotification} = useNotifications();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setloading] = useState(false);
    const [loadingMessage,setLoadingMessage] = useState('Enviando solicitud');
    const [completedSteps,setCompletedSteps] = useState([]);
    const [files,setFiles] = useState([]);

    // Getters of info

    const findRegisteredThirdParty = (extractedThirdParty) => {
        const onlyDigits = value => String(value ?? '').replace(/\D/g,'');
        const normalizeMail = value => String(value ?? '').trim().toLowerCase();
        const extractedIdentification = onlyDigits(extractedThirdParty?.identificationNumber);
        const extractedMail = normalizeMail(extractedThirdParty?.mail);

        const option = (thirdParties ?? []).find(currentOption => {
            const thirdParty = currentOption?.value ?? currentOption;
            const storedIdentification = onlyDigits(thirdParty?.indentification_number);
            const storedMail = normalizeMail(thirdParty?.mail);
            const sameIdentification = extractedIdentification && (
                storedIdentification === extractedIdentification
                || storedIdentification.slice(0,-1) === extractedIdentification
                || extractedIdentification.slice(0,-1) === storedIdentification
            );
            return sameIdentification
                || (extractedMail && storedMail === extractedMail);
        });

        return option?.value ?? option ?? null;
    };

    const getItems = async(selectedThirdParty)=>{
        const registeredThirdParty = findRegisteredThirdParty(selectedThirdParty);
        let res = await postInfo('/inventory/getProducts',{
            company_id:appInfo.company_id
        });
        let purchaseRelationsRes = await postInfo('/inventory/getPurchaseRelations',{
            company_id:appInfo.company_id
        });
        const thirdPartyRelationsRes = registeredThirdParty?.id
            ? await postInfo('/inventory/getThirdPartyProductTaxRelations',{
                company_id:appInfo.company_id,
                third_party_id:registeredThirdParty.id,
                active_only:true
            })
            : [false,[]];
        console.log('Servicios disponibles para compra: ',res)
        console.log('Relaciones para compra: ',purchaseRelationsRes)
        if(res[0]){
            const relationsByProduct = {};
            const referencesByProduct = {};
            if(purchaseRelationsRes[0]){
                purchaseRelationsRes[1].forEach(relation => {
                    relationsByProduct[relation.product_id] = relation;
                });
            }
            if(thirdPartyRelationsRes?.[0]){
                thirdPartyRelationsRes[1].forEach(relation => {
                    if(relation.third_party_reference && !referencesByProduct[relation.product_id]){
                        referencesByProduct[relation.product_id] = relation.third_party_reference;
                    }
                });
            }

            let C = []
            res[1].forEach(element => {
                const relations = relationsByProduct[element.id];
                // purchase_taxes viene ordenado por priority: el primero es el principal.
                const purchaseTax = relations?.purchase_taxes?.[0];
                const item = {
                    ...element,
                    product_id: element.id,
                    tax_id: purchaseTax?.tax_id ?? null,
                    tax_name: purchaseTax?.tax_name ?? null,
                    tax_base: purchaseTax?.base ?? 0,
                    tax_rate: purchaseTax?.rate ?? 0,
                    tax_account: purchaseTax?.tax_account ?? null,
                    retentions: relations?.retentions ?? [],
                    third_party_reference: referencesByProduct[element.id] ?? ''
                };
                C.push({
                    text:`${element.code} ${element.name}`,
                    value:item
                })
            });
            return C;
        }else{
            return [];
        }
    }

    // Verication Functions

    const verifyDocument = async()=>{
        // Se entrega el arreglo original completo para que el modelo tenga acceso a
        // toda la información disponible de cada tercero.
        const thirdPartiesList = thirdParties ?? [];
        setLoadingMessage('Validando documento')
        const response = await runAiTask({
                masterPrompt: `
                    Eres un agente especializado EXCLUSIVAMENTE en la VERIFICACIÓN
                    de validez de documentos de compra colombianos (facturas
                    electrónicas de venta, documentos equivalentes, facturas de
                    compra, notas y tiquetes). Tu única tarea es leer el documento
                    adjunto y determinar si cumple las validaciones solicitadas.
                    No completas formularios ni registras nada: solo verificas.

                    CONTEXTO DE ROLES (CLAVE): en un documento de compra, la empresa
                    que registra (NOSOTROS) somos el ADQUIRENTE / COMPRADOR. La
                    contraparte que emite el documento es el EMISOR / VENDEDOR /
                    PROVEEDOR. No confundas ambos roles: los datos del comprador y
                    del vendedor aparecen en bloques distintos (típicamente
                    "Emisor / Facturador" vs "Adquirente / Cliente").

                    IMPORTANTÍSIMO: en Colombia NO existe una "factura de compra"
                    como tal. El soporte de una compra es la FACTURA ELECTRÓNICA DE
                    VENTA (o documento equivalente) que emite el proveedor y en la
                    que NOSOTROS figuramos como adquirente / cliente. Por lo tanto,
                    un documento titulado "Factura Electrónica de Venta" es un
                    documento de compra VÁLIDO para nosotros. NUNCA lo rechaces solo
                    porque diga "venta": lo que determina que sea nuestra compra es
                    que el adquirente coincida con nuestros datos (paso 2), no el
                    título del documento.

                    Lee minuciosamente TODO el documento: encabezado, bloques de
                    emisor y adquirente, ítems, totales y, si existe, la
                    representación gráfica de la factura electrónica DIAN con su
                    CUFE. Basa cada decisión ÚNICAMENTE en lo que el documento
                    respalde de forma explícita. No inventes, no supongas, no
                    completes por intuición. Si un dato necesario no aparece,
                    considéralo ausente y falla la validación que lo requiera.

                    DOCUMENTOS ESCANEADOS O BASADOS EN IMÁGENES:
                    - El PDF original puede no tener texto extraíble. La solicitud
                      puede incluir imágenes llamadas "*-pagina-N.jpg", generadas
                      desde cada página del mismo PDF.
                    - Cuando existan esas imágenes, debes leerlas visualmente y
                      tratarlas como parte integral y fuente principal del documento;
                      no concluyas que faltan datos solo porque el parser del PDF no
                      haya extraído texto.
                    - Encabezados como "FACTURA ELECTRÓNICA DE VENTA", "Vendido a",
                      "Razón Comercial", "NIT", "Total a pagar" y la tabla de ítems
                      son evidencia válida aunque solo aparezcan en la imagen.

                    DATOS MÍNIMOS A EXTRAER (para poder validar):
                    - Tipo de documento (ej. "Factura electrónica de venta",
                      "Documento equivalente").
                    - Identificación y nombre del ADQUIRENTE / COMPRADOR.
                    - Identificación y nombre del EMISOR / VENDEDOR.
                    - Valor total del documento.

                    REGLAS DE COMPARACIÓN DE IDENTIFICACIÓN:
                    - Compara identificaciones ignorando puntos, comas, espacios y
                      guiones.
                    - Para NIT ignora el dígito de verificación (lo que va después
                      del guion): compara solo el número base. "901.234.567-8"
                      equivale a "901234567".
                    - Para decidir si el ADQUIRENTE somos nosotros, revisa por separado
                      identificación, correo, teléfono y nombre.
                    - Identificación, correo y teléfono son evidencias principales. Si
                      cualquiera de ellas coincide, la compra nos pertenece aunque el
                      nombre esté abreviado, incompleto o sea diferente.
                    - NUNCA rechaces la compra por una diferencia de nombre cuando el
                      número de identificación, el correo o el teléfono coincidan.
                    - Usa el nombre solamente como evidencia secundaria cuando el
                      documento no permita comparar identificación, correo ni teléfono.
                    - En ese caso acepta nombres parciales: "José Miguel" corresponde a
                      "José Miguel Murillo Romero". Ignora tildes, mayúsculas y orden
                      de espacios.

                    VALIDACIONES (ejecútalas EN ORDEN y detente en la primera que
                    falle; en ese caso reporta el paso, un mensaje de error corto y
                    una descripción clara y accionable en español):
                    1. ¿El documento es una factura o documento equivalente? Una
                       "Factura Electrónica de Venta" emitida por un proveedor SÍ
                       cuenta como documento de compra válido; NO la rechaces por
                       decir "venta". Solo falla si es otro tipo de documento
                       (cotización, remisión, estado de cuenta, orden de compra,
                       etc.).
                    2. [VALIDACIÓN DESACTIVADA TEMPORALMENTE] No verifiques si la
                       compra nos pertenece. Da este paso siempre por aprobado sin
                       importar el ADQUIRENTE / COMPRADOR que figure en el documento.
                    3. ¿El EMISOR / VENDEDOR está en la lista de proveedores
                       registrados entregada en la solicitud? Compara por
                       identificación con las reglas anteriores. Si no está, falla.
                    4. ¿El valor total del documento es mayor a 0? Si es 0, negativo
                       o no determinable, falla.

                    FORMA DE RESPUESTA:
                    - Responde ÚNICAMENTE con el JSON conforme al esquema
                      solicitado, sin comentarios ni explicaciones adicionales.
                    - En selectedThirdParty devuelve los datos que aparecen en el
                      documento para el EMISOR / VENDEDOR / PROVEEDOR: names, mail,
                      documentType e identificationNumber. No devuelvas los datos del
                      adquirente/comprador en este campo.
                    - Extrae selectedThirdParty siempre que el emisor sea legible,
                      incluso si otra validación falla. Usa null solamente si no es
                      posible identificar al vendedor en el documento.
                    - Si TODAS las validaciones pasan: status = "OK" y un message
                      breve confirmando la validación.
                    - Si ALGUNA falla: status = "Error" y en message el motivo del
                      rechazo, claro y accionable, indicando qué paso falló y por qué.
                    - Nunca reportes "OK" si falta evidencia: ante la duda responde
                      "Error" explicando qué dato faltó.
                `,
                prompt: `
                    Verfica la calidad del mdocumento adjunto en los siguientes 5 pasos, si
                    alguno de ellos no se cumple retorna con el mensaje de error y su debida descripción

                    1. Verifica que el documento sea una factura o documento equivalente. Una factura electrónica de venta emitida a mi nombre (donde figuro como adquirente/cliente) SÍ es una compra válida.
                    2. [DESACTIVADO TEMPORALMENTE] No verifiques si la compra me pertenece. Aprueba este paso siempre, sin comparar identificación, correo, celular ni nombre del adquirente.
                    3. Verificar si el proveedor o vendedor está en esta lista JSON de proveedores registrados: ${JSON.stringify(thirdPartiesList)}
                    4. Verificar si el valor del documento es mayor a 0.

                    mensaje de exito = {
                        status: 'OK',
                        message: 'Documento validado 1era etapa.',
                        selectedThirdParty: {
                            names: 'Nombre del vendedor',
                            mail: 'correo del vendedor o cadena vacía',
                            documentType: 'NIT, CC u otro tipo encontrado',
                            identificationNumber: 'número del vendedor'
                        }
                    }

                    mensaje de error = {
                        status: 'Error',
                        message: 'motivo por el cual fue rechazado',
                        selectedThirdParty: null
                    }
                `,
                files,
                responseType: 'json_schema',
                schemaName: 'purchase_document_validation',
                jsonSchema: purchaseValidationSchema,
                model: 'openai/gpt-4o',
                temperature: 0
            });
            console.log(`mis datos (${appInfo.identification_type} -  ${appInfo.identification_number} - ${appInfo.legal_name} / ${appInfo.trade_name} - celular: ${appInfo.phone} - correo: ${appInfo.company_mail} )`)
            console.log('Respuesta IA (cruda):', response);

            if(response.data.status === 'OK' && !response.data.selectedThirdParty){
                return {
                    status: 'Error',
                    message: 'No fue posible extraer la información del emisor o vendedor.',
                    selectedThirdParty: null
                };
            }

            return response.data;
    }

    const SelectInformation = async(items)=>{
        const normalizedItems = (items ?? []).map(item => item?.value ?? item);
        const systemItemsList = normalizedItems.map((item,index) => ({
            index,
            id: item?.product_id ?? item?.id ?? null,
            code: item?.code ?? '',
            name: item?.name ?? '',
            description: item?.description ?? '',
            type: item?.type ?? '',
            thirdPartyReference: item?.third_party_reference ?? ''
        }));

        if(systemItemsList.length === 0){
            throw new Error('No hay productos o servicios registrados para relacionar con la compra.');
        }
        setLoadingMessage('Relacionando ítems de la factura')
        const response = await runAiTask({
            masterPrompt: `
                Eres un especialista en normalización de líneas de compras. Lee el
                documento adjunto y extrae TODOS sus productos o servicios. Por cada
                línea debes elegir el ítem semánticamente equivalente de la lista del
                sistema, aunque los nombres no sean literales. Ejemplo: "zapatillas
                Samba" puede corresponder a "Zapatos".

                REGLAS OBLIGATORIAS:
                - Devuelve una entrada por cada renglón comprado del documento, en el
                  mismo orden. No omitas, agrupes ni inventes renglones.
                - selectedItemIndex debe ser exactamente un index de la lista recibida.
                - Compara nombre, descripción, código, naturaleza y contexto del ítem.
                - thirdPartyReference es la referencia con la que este proveedor
                  identifica nuestro producto. Cuando aparezca en el documento,
                  trátala como el criterio de coincidencia de mayor prioridad.
                - Si no existe una equivalencia razonable, usa null. No fuerces una
                  coincidencia ni inventes productos.
                - units es la cantidad comprada y debe ser mayor que cero.
                - unitValue es el valor unitario final de la línea, incluido IVA si el
                  documento lo presenta incluido. Si solo existe total de línea,
                  calcula total / units. Nunca uses el total de toda la factura.
                - Los descuentos de línea deben reflejarse en unitValue.
                - Devuelve exclusivamente el JSON solicitado.
            `,
            prompt: `
                Traduce cada línea del documento adjunto a un ítem compatible con
                esta lista JSON de productos y servicios registrados:
                ${JSON.stringify(systemItemsList)}
            `,
            files,
            responseType: 'json_schema',
            schemaName: 'purchase_items_mapping',
            jsonSchema: purchaseItemsSchema,
            model: 'openai/gpt-4o',
            temperature: 0
        });

        if(response.data.items.length === 0){
            throw new Error('No se encontraron ítems de compra en el documento.');
        }

        const unmatchedItems = response.data.items.filter(item =>
            !Number.isInteger(item.selectedItemIndex)
            || !normalizedItems[item.selectedItemIndex]
        );

        if(unmatchedItems.length > 0){
            const descriptions = unmatchedItems
                .map(item => item.documentDescription)
                .filter(Boolean)
                .join(', ');
            throw new Error(`No se encontraron equivalencias en el sistema para: ${descriptions || 'uno o más ítems del documento'}.`);
        }

        const invalidValues = response.data.items.some(item =>
            !Number.isFinite(Number(item.units))
            || Number(item.units) <= 0
            || !Number.isFinite(Number(item.unitValue))
            || Number(item.unitValue) <= 0
        );

        if(invalidValues){
            throw new Error('Uno o más ítems no tienen cantidades o valores unitarios válidos.');
        }

        return response.data.items.map(mapping => ({
            ...normalizedItems[mapping.selectedItemIndex],
            product_id: normalizedItems[mapping.selectedItemIndex].product_id
                ?? normalizedItems[mapping.selectedItemIndex].id,
            units: Number(mapping.units),
            unit_value: Number(mapping.unitValue),
            manualPrice: true,
            documentDescription: mapping.documentDescription
        }));
    }

    const handleAutoComplete = async()=>{
        if(files.length === 0){
            console.warn('Selecciona un archivo antes de continuar.');
            return;
        }
        setDisabled(true);
        setloading(true);
        setCompletedSteps(['Documento cargado']);
        setLoadingMessage('Validando documento');
        try {
            const validationResult = await verifyDocument();
            if(validationResult.status !== 'OK'){
                throw new Error(validationResult.message);
            }
            setCompletedSteps(current => [...current, 'Documento validado']);

            setLoadingMessage('Consultando catálogo de productos');
            const availableItems = await getItems(validationResult.selectedThirdParty);
            setCompletedSteps(current => [...current, 'Catálogo de productos consultado']);

            setLoadingMessage('Relacionando ítems de la factura');
            const mappedItems = await SelectInformation(availableItems);
            setCompletedSteps(current => [...current, 'Ítems de la factura relacionados']);
            const result = {...validationResult, items:mappedItems};

            setLoadingMessage('Parametrizando compra');
            onComplete?.(result);
            setCompletedSteps(current => [...current, 'Compra parametrizada']);
            addNotification({
                type:'aproved',
                title:'Compra analizada correctamente',
                description:`${mappedItems.length} ítem(s) fueron relacionados con productos del sistema.`
            });
            console.log('Resultado autocompletado de compra:', result);
            popOutAlert();
        } catch (err) {
            console.error('Error al verificar el documento:', err);
            addNotification({
                type:'error',
                title:'No fue posible autocompletar la compra',
                description:err?.message ?? 'Ocurrió un error durante el análisis del documento.'
            });
        } finally {
            setloading(false);
            setDisabled(false);
        }
    }

    if(loading){
        return <LoaderAiUtoComplete loadingMessage={loadingMessage} completedSteps={completedSteps} />;
    }

    return(
        <div className="AutoCompletePurchase">
            <div className="head">
                <MainTitleAi text={'Registrar compra con IA'}/>
                <DescriptionSpan text={'Completa y registra tus compras con ayuda de la IA'}/>
            </div>
            <div className="body">
                <FileInput placeholder={'Sube tu compra'} multiple={false} category="files" action={setFiles} setDisabled={setDisabled} includeFiles={true}/>
                <WarningForm tittle={'Advertencia de uso'} desc={'La IA es una herramienta que puede llegar a cometer errores, se sugiere un uso responsable, revise el resultado del proceso antes de continuar.'}/>
            </div>
            <div className="optionsControl">
                <FormButton
                    text={'Cancelar'}
                    negative={true}
                    disabled={disabled}
                    onClick={popOutAlert}
                />
                <CapsuleButtonAi
                    title={'Enviar a la IA'}
                    disabled={disabled || files.length === 0}
                    onClick={handleAutoComplete}
                >
                    <span className="statusMessage">Enviar a la IA</span>
                </CapsuleButtonAi>
            </div>
        </div>
    );
}
