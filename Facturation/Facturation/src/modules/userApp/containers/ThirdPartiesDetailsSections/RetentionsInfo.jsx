import { useState } from "react";
import './RetentionsInfo.css'
import { CollapsableItem } from "../../components/CollapsableItem";
import { SwitchOption } from "../../components/SwitchOption";
import { SelectOptions } from "../../components/SelectOptions";

// Misma forma base que el taxConfig de FormNewThirdParties, para leer de forma
// segura un tercero que todavía no tenga toda la estructura guardada.
const createInitialTaxConfig = () => ({
    rent:{
        regime:'',
        rentTaxResponsable:false,
        rentTaxDeclarant:false,
        rentWithholdingAgent:false,
        rentSelfWithholdingAgent:false,
        rentSpecialSelfWithholdingAgent:false
    },
    iva:{
        stateEntity:false,
        DIANMajorTaxpayer:false,
        ivaTaxResponsable:false,
        ivaWithholdingAgent:false,
        ivaWithholdingAgentByCI:false
    },
    ring:{
        ringTaxResponsable:false,
        ringWithholdingAgent:false,
        ringSelfWithholdingAgent:false
    },
    consumption:{
        consumptionTaxResponsable:false,
        consumptionWithholdingAgent:false,
        consumptionSelfWithholdingAgent:false
    }
});

const normalizeTaxConfig = (taxConfig = {}) => {
    const initial = createInitialTaxConfig();
    return {
        rent:{
            ...initial.rent,
            ...(taxConfig.rent ?? {}),
            regime:taxConfig.rent?.regime ?? taxConfig.regime ?? ''
        },
        iva:{ ...initial.iva, ...(taxConfig.iva ?? {}) },
        ring:{ ...initial.ring, ...(taxConfig.ring ?? {}) },
        consumption:{ ...initial.consumption, ...(taxConfig.consumption ?? {}) }
    };
};

export function RetentionsInfo({info}){

    // El backend devuelve taxConfig como jsonb (objeto) pero puede venir como
    // string según el consumidor; normalizamos para leerlo sin romper.
    const [withholdingRetentions,setWithholdingRetentions] = useState(()=>{
        let raw = info?.taxConfig ?? {};
        if(typeof raw === 'string'){
            try{ raw = JSON.parse(raw || '{}'); }
            catch{ raw = {}; }
        }
        return normalizeTaxConfig(raw ?? {});
    });

    // Los switches son interactivos para reciclar la UI del formulario, pero este
    // cambio es solo local: todavía no existe endpoint para persistir el taxConfig.
    const updateNestedField = (path,value)=>{
        setWithholdingRetentions(prev=>{
            const next = {...prev};
            let ref = next;
            for(let i=0;i<path.length-1;i++){
                ref[path[i]] = {...ref[path[i]]};
                ref = ref[path[i]];
            }
            ref[path[path.length-1]] = value;
            return next;
        });
    };

    return(
        <div className="RetentionsInfo retentionsSection">
            <CollapsableItem title={'RENTA'}>
                <section className='taxRentSection'>
                    <div className="labelSwitch">
                        <span>Responsable del impuesto sobre RENTA</span>
                        <SwitchOption
                            key={`rent-responsible-${withholdingRetentions.rent.rentTaxResponsable}`}
                            defaultValue={withholdingRetentions.rent.rentTaxResponsable}
                            action={value=>updateNestedField(['rent','rentTaxResponsable'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Declarante impuesto sobre la RENTA</span>
                        <SwitchOption
                            key={`rent-declarant-${withholdingRetentions.rent.rentTaxDeclarant}`}
                            defaultValue={withholdingRetentions.rent.rentTaxDeclarant}
                            action={value=>updateNestedField(['rent','rentTaxDeclarant'],value)}
                        />
                    </div>
                    <SelectOptions
                        key={`withholding-regime-${withholdingRetentions.rent.regime}`}
                        title={'Regimen'}
                        defaultValue={{value:withholdingRetentions.rent.regime}}
                        action={value=>updateNestedField(['rent','regime'],value)}
                        options={[
                            'Regimen Ordinario Renta',
                            'Regimen Simple',
                            'Regimen Especial'
                        ]}
                    />
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de RENTA</span>
                        <SwitchOption
                            key={`rent-withholding-${withholdingRetentions.rent.rentWithholdingAgent}`}
                            defaultValue={withholdingRetentions.rent.rentWithholdingAgent}
                            action={value=>updateNestedField(['rent','rentWithholdingAgent'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autorreteneor a titulo de RENTA</span>
                        <SwitchOption
                            key={`rent-self-withholding-${withholdingRetentions.rent.rentSelfWithholdingAgent}`}
                            defaultValue={withholdingRetentions.rent.rentSelfWithholdingAgent}
                            action={value=>updateNestedField(['rent','rentSelfWithholdingAgent'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autoretenedor especial de RENTA</span>
                        <SwitchOption
                            key={`rent-special-self-${withholdingRetentions.rent.rentSpecialSelfWithholdingAgent}`}
                            defaultValue={withholdingRetentions.rent.rentSpecialSelfWithholdingAgent}
                            action={value=>updateNestedField(['rent','rentSpecialSelfWithholdingAgent'],value)}
                        />
                    </div>
                </section>
            </CollapsableItem>
            <CollapsableItem title={'IVA'}>
                <section className='taxRentSection'>
                    <div className="labelSwitch">
                        <span>Entidad estatal</span>
                        <SwitchOption
                            key={`iva-state-${withholdingRetentions.iva.stateEntity}`}
                            defaultValue={withholdingRetentions.iva.stateEntity}
                            action={value=>updateNestedField(['iva','stateEntity'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Gran Contribuyente DIAN</span>
                        <SwitchOption
                            key={`iva-major-${withholdingRetentions.iva.DIANMajorTaxpayer}`}
                            defaultValue={withholdingRetentions.iva.DIANMajorTaxpayer}
                            action={value=>updateNestedField(['iva','DIANMajorTaxpayer'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Responsable de IVA</span>
                        <SwitchOption
                            key={`iva-responsible-${withholdingRetentions.iva.ivaTaxResponsable}`}
                            defaultValue={withholdingRetentions.iva.ivaTaxResponsable}
                            action={value=>updateNestedField(['iva','ivaTaxResponsable'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de IVA</span>
                        <SwitchOption
                            key={`iva-withholding-${withholdingRetentions.iva.ivaWithholdingAgent}`}
                            defaultValue={withholdingRetentions.iva.ivaWithholdingAgent}
                            action={value=>updateNestedField(['iva','ivaWithholdingAgent'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de IVA por ventas CI</span>
                        <SwitchOption
                            key={`iva-ci-${withholdingRetentions.iva.ivaWithholdingAgentByCI}`}
                            defaultValue={withholdingRetentions.iva.ivaWithholdingAgentByCI}
                            action={value=>updateNestedField(['iva','ivaWithholdingAgentByCI'],value)}
                        />
                    </div>
                </section>
            </CollapsableItem>
            <CollapsableItem title={'TIMBRE'}>
                <section className='taxRentSection'>
                    <div className="labelSwitch">
                        <span>Responsable impuesto de timbre</span>
                        <SwitchOption
                            key={`ring-responsible-${withholdingRetentions.ring.ringTaxResponsable}`}
                            defaultValue={withholdingRetentions.ring.ringTaxResponsable}
                            action={value=>updateNestedField(['ring','ringTaxResponsable'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de timbre</span>
                        <SwitchOption
                            key={`ring-withholding-${withholdingRetentions.ring.ringWithholdingAgent}`}
                            defaultValue={withholdingRetentions.ring.ringWithholdingAgent}
                            action={value=>updateNestedField(['ring','ringWithholdingAgent'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autorretenedor a titulo de timbre</span>
                        <SwitchOption
                            key={`ring-self-${withholdingRetentions.ring.ringSelfWithholdingAgent}`}
                            defaultValue={withholdingRetentions.ring.ringSelfWithholdingAgent}
                            action={value=>updateNestedField(['ring','ringSelfWithholdingAgent'],value)}
                        />
                    </div>
                </section>
            </CollapsableItem>
            <CollapsableItem title={'CONSMUMO'}>
                <section className='taxRentSection'>
                    <div className="labelSwitch">
                        <span>Responsable impuesto al Consumo</span>
                        <SwitchOption
                            key={`consumption-responsible-${withholdingRetentions.consumption.consumptionTaxResponsable}`}
                            defaultValue={withholdingRetentions.consumption.consumptionTaxResponsable}
                            action={value=>updateNestedField(['consumption','consumptionTaxResponsable'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de impuesto al consumo</span>
                        <SwitchOption
                            key={`consumption-withholding-${withholdingRetentions.consumption.consumptionWithholdingAgent}`}
                            defaultValue={withholdingRetentions.consumption.consumptionWithholdingAgent}
                            action={value=>updateNestedField(['consumption','consumptionWithholdingAgent'],value)}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autorretenedor a titulo de impuesto al consumo</span>
                        <SwitchOption
                            key={`consumption-self-${withholdingRetentions.consumption.consumptionSelfWithholdingAgent}`}
                            defaultValue={withholdingRetentions.consumption.consumptionSelfWithholdingAgent}
                            action={value=>updateNestedField(['consumption','consumptionSelfWithholdingAgent'],value)}
                        />
                    </div>
                </section>
            </CollapsableItem>
        </div>
    )
}
