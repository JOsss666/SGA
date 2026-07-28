import { useState } from 'react'
import { useAlert } from '../../../../../context/context'
import { CapsuleButtonAi } from '../../../components/ChatAiComponents/CapsuleButtonAi'
import { MainTitleAi } from '../../../components/ChatAiComponents/MainTitleAi'
import { DescriptionSpan } from '../../../components/DescriptionSpan'
import { FileInput } from '../../../components/FileInput'
import { FormButton } from '../../../components/FormButton'
import { WarningForm } from '../../../components/WarningForm'
import { runAiTask } from '../../../../../utils/aiUtils'
import './AutoCompleteThirdParties.css'


const thirdPartySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        company_id: { type: 'null' },
        userPhoto: { type: 'string' },
        first_name: { type: 'string' },
        second_name: { type: 'string' },
        first_surname: { type: 'string' },
        second_surname: { type: 'string' },
        indentification_type: {
            type: 'string',
            enum: ['NIT', 'CC', 'CE', 'TE', 'PAS', 'RC', 'TI', '']
        },
        indentification_number: { type: 'string' },
        mail: { type: 'string' },
        phone: { type: 'string' },
        country: { type: 'string' },
        department: { type: 'string' },
        municipality: { type: 'string' },
        municipality_code: { type: 'string' },
        mucipality_id: { type: 'string' },
        city: { type: 'string' },
        address: { type: 'string' },
        type: {
            type: 'string',
            enum: ['client', 'supplier', 'both', 'employee', 'contractor', 'partner', 'other', '']
        },
        credit: { type: 'boolean' },
        credit_term: { type: 'number' },
        credit_value: { type: 'number' },
        interest_rate: { type: 'number' },
        comercial_state: {
            type: 'string',
            enum: ['active', 'disabled', 'blocked', 'reported']
        },
        typePerson: {
            type: ['integer', 'null'],
            enum: [1, 2, null]
        },
        regime: {
            type: 'string',
            enum: ['ORDINARIO', 'SIMPLE', 'ESPECIAL', 'NO_CONTRIBUYENTE', '']
        },
        IVA_responsability: {
            type: ['integer', 'null'],
            enum: [18, 21, 22, null]
        },
        retention_type: {
            type: 'string',
            enum: ['NO_AGENTE', 'AGENTE_RETENCION', 'AUTORRETENEDOR', '']
        },
        economic_activity: { type: 'string' },
        attachedRut: { type: 'string' },
        identidicationType_id: { type: 'null' },
        country_id: { type: 'null' },
        department_id: { type: 'null' },
        municipality_jurisdiction_id: { type: 'null' },
        locality_id: { type: 'null' },
        withholdingRetentions: {
            type: 'object',
            additionalProperties: false,
            properties: {
                selfWithholdingAgent: { type: 'boolean' },
                regime: { type: 'string' },
                rent: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        rentTaxResponsable: { type: 'boolean' },
                        rentTaxDeclarant: { type: 'boolean' },
                        rentWithholdingAgent: { type: 'boolean' },
                        rentSelfWithholdingAgent: { type: 'boolean' },
                        rentSpecialSelfWithholdingAgent: { type: 'boolean' }
                    },
                    required: [
                        'rentTaxResponsable',
                        'rentTaxDeclarant',
                        'rentWithholdingAgent',
                        'rentSelfWithholdingAgent',
                        'rentSpecialSelfWithholdingAgent'
                    ]
                },
                iva: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        stateEntity: { type: 'boolean' },
                        DIANMajorTaxpayer: { type: 'boolean' },
                        ivaTaxResponsable: { type: 'boolean' },
                        ivaWithholdingAgent: { type: 'boolean' },
                        ivaWithholdingAgentByCI: { type: 'boolean' }
                    },
                    required: [
                        'stateEntity',
                        'DIANMajorTaxpayer',
                        'ivaTaxResponsable',
                        'ivaWithholdingAgent',
                        'ivaWithholdingAgentByCI'
                    ]
                },
                ring: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        ringTaxResponsable: { type: 'boolean' },
                        ringWithholdingAgent: { type: 'boolean' },
                        ringSelfWithholdingAgent: { type: 'boolean' }
                    },
                    required: [
                        'ringTaxResponsable',
                        'ringWithholdingAgent',
                        'ringSelfWithholdingAgent'
                    ]
                },
                consumption: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        consumptionTaxResponsable: { type: 'boolean' },
                        consumptionWithholdingAgent: { type: 'boolean' },
                        consumptionSelfWithholdingAgent: { type: 'boolean' }
                    },
                    required: [
                        'consumptionTaxResponsable',
                        'consumptionWithholdingAgent',
                        'consumptionSelfWithholdingAgent'
                    ]
                },
                territorialTaxes: {
                    type: 'array',
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            name: { type: 'string' },
                            code: { type: 'string' },
                            regions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    additionalProperties: false,
                                    properties: {
                                        name: { type: 'string' },
                                        code: { type: 'string' },
                                        isTaxRetainer: { type: 'boolean' },
                                        isSelfTaxRetainer: { type: 'boolean' },
                                        activities: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                additionalProperties: false,
                                                properties: {
                                                    code: { type: 'string' },
                                                    description: { type: 'string' },
                                                    rate: { type: 'number' },
                                                    minimumBase: { type: 'number' }
                                                },
                                                required: [
                                                    'code',
                                                    'description',
                                                    'rate',
                                                    'minimumBase'
                                                ]
                                            }
                                        }
                                    },
                                    required: [
                                        'name',
                                        'code',
                                        'isTaxRetainer',
                                        'isSelfTaxRetainer',
                                        'activities'
                                    ]
                                }
                            }
                        },
                        required: ['name', 'code', 'regions']
                    }
                }
            },
            required: [
                'selfWithholdingAgent',
                'regime',
                'rent',
                'iva',
                'ring',
                'consumption',
                'territorialTaxes'
            ]
        },
        performed_by: { type: 'string' }
    },
    required: [
        'company_id',
        'userPhoto',
        'first_name',
        'second_name',
        'first_surname',
        'second_surname',
        'indentification_type',
        'indentification_number',
        'mail',
        'phone',
        'country',
        'department',
        'municipality',
        'municipality_code',
        'mucipality_id',
        'city',
        'address',
        'type',
        'credit',
        'credit_term',
        'credit_value',
        'interest_rate',
        'comercial_state',
        'typePerson',
        'regime',
        'IVA_responsability',
        'retention_type',
        'economic_activity',
        'attachedRut',
        'identidicationType_id',
        'country_id',
        'department_id',
        'municipality_jurisdiction_id',
        'locality_id',
        'withholdingRetentions',
        'performed_by'
    ]
};

export function AutoCompleteThirdParties({updateFunction}){

    // Requieirments
    const {popOutAlert} = useAlert();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [files,setFiles] = useState([]);
    const [error,setError] = useState('');

    const handleAutoComplete = async()=>{
        if(files.length === 0){
            setError('Selecciona al menos un archivo antes de continuar.');
            return;
        }

        setDisabled(true);
        setLoading(true);
        setError('');

        try {
            const response = await runAiTask({
                masterPrompt: `
                    Eres un agente especializado exclusivamente en extracción y
                    clasificación de información de documentos colombianos RUT
                    (Registro Único Tributario) y RIT (Registro de Información
                    Tributaria).

                    Lee minuciosamente todos los documentos adjuntos y extrae
                    únicamente información correspondiente al esquema solicitado.
                    No inventes, completes por intuición ni supongas información.
                    Cuando un dato no esté explícitamente disponible utiliza su
                    valor vacío: "", null, 0, false o [] según el tipo.

                    Si hay RUT y RIT, usa el RIT como información complementaria,
                    pero prioriza el RUT cuando exista una discrepancia.

                    REGLAS DE IDENTIFICACIÓN:
                    - Persona natural: separa primer nombre, segundo nombre,
                      primer apellido y segundo apellido.
                    - Persona jurídica: coloca la razón social completa en
                      first_name y deja los demás nombres y apellidos vacíos.
                    - indentification_number debe ir sin puntos, comas, espacios
                      ni otros separadores.
                    - indentification_type: NIT, CC, CE, TE, PAS, RC o TI.
                    - typePerson: 1 persona jurídica, 2 persona natural.
                    - Los IDs internos deben ser null; la aplicación los resolverá.

                    REGLAS DE UBICACIÓN:
                    - country será Colombia salvo indicación explícita contraria.
                    - department y municipality deben contener sus nombres.
                    - municipality_code debe ser el código DANE sin separadores.
                    - mucipality_id debe contener el mismo código DANE.
                    - city y address corresponden al domicilio principal.

                    REGLAS FISCALES:
                    - regime: ORDINARIO, SIMPLE, ESPECIAL o NO_CONTRIBUYENTE.
                    - IVA_responsability: 18 responsable de IVA, 21 no responsable
                      de IVA, 22 no responsable de consumo.
                    - retention_type: NO_AGENTE, AGENTE_RETENCION o
                      AUTORRETENEDOR.
                    - economic_activity debe contener el código CIIU y, cuando
                      aparezca, su descripción.
                    - comercial_state será active.
                    - credit será false y sus valores asociados serán 0.
                    - No deduzcas la relación comercial type desde un RUT o RIT;
                      si no está explícita utiliza una cadena vacía.

                    RETENCIONES:
                    Examina especialmente las responsabilidades y obligaciones
                    fiscales del RUT para completar todas las propiedades de
                    withholdingRetentions: RENTA, IVA, TIMBRE y CONSUMO.
                    Cada booleano será true solo cuando el documento lo respalde
                    explícitamente; en caso contrario será false.

                    Para territorialTaxes usa principalmente el RIT. Extrae ICA u
                    otros impuestos, región, calidad de retenedor/autorretenedor,
                    actividades, tarifa y base mínima. Si no existe información
                    territorial devuelve territorialTaxes como [].

                    withholdingRetentions.regime debe ser descriptivo, por ejemplo
                    "Regimen Ordinario Renta", "Regimen Simple" o "Regimen
                    Especial".

                    attachedRut y performed_by deben devolverse vacíos porque la
                    aplicación los asignará. Responde únicamente conforme al
                    JSON Schema, sin comentarios ni explicaciones adicionales.
                `,
                prompt: `
                    Procesa los RUT y/o RIT adjuntos. Identifica el tipo de cada
                    documento, cruza la información del mismo tercero y devuelve
                    el objeto completo para autocompletar su formulario.
                `,
                files,
                responseType: 'json_schema',
                schemaName: 'third_party_document_extraction',
                jsonSchema: thirdPartySchema,
                temperature: 0
            });
            console.log('Respuesta IA:', response.data);

            const applyUpdate = updateFunction ?? updatFunction;
            await applyUpdate?.({
                ...response.data,
                attachedRut: files[0]?.url ?? files[0]
            });
            popOutAlert();
        } catch (err) {
            setError(err.message || 'No se pudieron procesar los documentos.');
        } finally {
            setLoading(false);
            setDisabled(false);
        }
    };

    return(
        <div className="AutoCompleteThirdParties">
            <div className="head">
                <MainTitleAi text={'Auto completar tercero'}/>
                <DescriptionSpan text={'Para continuar seleeccione el RUT y/o RUT del tercero el cual quiere crear.'}/>
            </div>
            <FileInput
                placeholder={'Seleccione uno o varios archivos'}
                action={setFiles}
                disabled={disabled}
                setDisabled={setDisabled}
                multiple={true}
                includeFiles={true}
            />
            {error && (
                <span className="aiAutoCompleteError">{error}</span>
            )}
            <WarningForm tittle={'Advertencia'} desc={'La Intelegencia artifical puede cometer errores, recuerde revisar el resultado y modificar de ser necesario para un resultado optimo.'}/>
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
                    <span>
                        {loading ? 'Analizando...' : 'Enviar a la IA'}
                    </span>
                </CapsuleButtonAi>
            </div>
        </div>
    )
}
