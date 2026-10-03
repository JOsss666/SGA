import { useEffect, useState } from "react";
import './RetentionsInfo.css'
import { CollapsableItem } from "../../components/CollapsableItem";
import { SwitchOption } from "../../components/SwitchOption";
import { SelectOptions } from "../../components/SelectOptions";
import { FormButton } from "../../components/FormButton";
import { useAppInfo, useNotifications } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";

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

const cloneTaxConfig = (config)=>JSON.parse(JSON.stringify(config));

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

export function RetentionsInfo({info,reloadFun}){

    const {appInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();
    const canEdit = userConfig?.access?.sections?.thirdparties?.can_edit;

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
    const [savedTaxConfig,setSavedTaxConfig] = useState(()=>cloneTaxConfig(withholdingRetentions));
    const [saving,setSaving] = useState(false);
    const hasChanges = JSON.stringify(withholdingRetentions) !== JSON.stringify(savedTaxConfig);

    useEffect(()=>{
        let raw = info?.taxConfig ?? {};
        if(typeof raw === 'string'){
            try{ raw = JSON.parse(raw || '{}'); }
            catch{ raw = {}; }
        }
        const nextConfig = normalizeTaxConfig(raw ?? {});
        setWithholdingRetentions(nextConfig);
        setSavedTaxConfig(cloneTaxConfig(nextConfig));
    },[info?.id,info?.taxConfig]);

    const saveTaxConfig = async()=>{
        setSaving(true);
        try{
            const response = await postInfo('/updateThirdParty',{
                company_id:info?.company_id ?? appInfo.company_id,
                id:info?.id,
                taxConfig:withholdingRetentions
            });
            if(response?.[0]){
                const savedConfig = cloneTaxConfig(withholdingRetentions);
                setSavedTaxConfig(savedConfig);
                addNotification({
                    type:'aproved',
                    title:'Retenciones actualizadas',
                    description:'La configuración tributaria se guardó correctamente.'
                });
                reloadFun?.();
            }
        }catch(error){
            addNotification({
                type:'error',
                title:'No fue posible actualizar',
                description:error?.message ?? 'Error al guardar las retenciones.'
            });
        }finally{
            setSaving(false);
        }
    };

    const discardTaxConfigChanges = ()=>{
        setWithholdingRetentions(cloneTaxConfig(savedTaxConfig));
    };

    // Mantiene los cambios locales hasta que el usuario los guarde explícitamente.
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
                            value={withholdingRetentions.rent.rentTaxResponsable}
                            action={canEdit && !saving ? value=>updateNestedField(['rent','rentTaxResponsable'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Declarante impuesto sobre la RENTA</span>
                        <SwitchOption
                            key={`rent-declarant-${withholdingRetentions.rent.rentTaxDeclarant}`}
                            value={withholdingRetentions.rent.rentTaxDeclarant}
                            action={canEdit && !saving ? value=>updateNestedField(['rent','rentTaxDeclarant'],value) : undefined}
                        />
                    </div>
                    <SelectOptions
                        key={`withholding-regime-${withholdingRetentions.rent.regime}`}
                        title={'Regimen'}
                        defaultValue={{value:withholdingRetentions.rent.regime}}
                        disabled={!canEdit || saving}
                        action={canEdit && !saving ? value=>updateNestedField(['rent','regime'],value) : undefined}
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
                            value={withholdingRetentions.rent.rentWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['rent','rentWithholdingAgent'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autorreteneor a titulo de RENTA</span>
                        <SwitchOption
                            key={`rent-self-withholding-${withholdingRetentions.rent.rentSelfWithholdingAgent}`}
                            value={withholdingRetentions.rent.rentSelfWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['rent','rentSelfWithholdingAgent'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autoretenedor especial de RENTA</span>
                        <SwitchOption
                            key={`rent-special-self-${withholdingRetentions.rent.rentSpecialSelfWithholdingAgent}`}
                            value={withholdingRetentions.rent.rentSpecialSelfWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['rent','rentSpecialSelfWithholdingAgent'],value) : undefined}
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
                            value={withholdingRetentions.iva.stateEntity}
                            action={canEdit && !saving ? value=>updateNestedField(['iva','stateEntity'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Gran Contribuyente DIAN</span>
                        <SwitchOption
                            key={`iva-major-${withholdingRetentions.iva.DIANMajorTaxpayer}`}
                            value={withholdingRetentions.iva.DIANMajorTaxpayer}
                            action={canEdit && !saving ? value=>updateNestedField(['iva','DIANMajorTaxpayer'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Responsable de IVA</span>
                        <SwitchOption
                            key={`iva-responsible-${withholdingRetentions.iva.ivaTaxResponsable}`}
                            value={withholdingRetentions.iva.ivaTaxResponsable}
                            action={canEdit && !saving ? value=>updateNestedField(['iva','ivaTaxResponsable'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de IVA</span>
                        <SwitchOption
                            key={`iva-withholding-${withholdingRetentions.iva.ivaWithholdingAgent}`}
                            value={withholdingRetentions.iva.ivaWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['iva','ivaWithholdingAgent'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de IVA por ventas CI</span>
                        <SwitchOption
                            key={`iva-ci-${withholdingRetentions.iva.ivaWithholdingAgentByCI}`}
                            value={withholdingRetentions.iva.ivaWithholdingAgentByCI}
                            action={canEdit && !saving ? value=>updateNestedField(['iva','ivaWithholdingAgentByCI'],value) : undefined}
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
                            value={withholdingRetentions.ring.ringTaxResponsable}
                            action={canEdit && !saving ? value=>updateNestedField(['ring','ringTaxResponsable'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de timbre</span>
                        <SwitchOption
                            key={`ring-withholding-${withholdingRetentions.ring.ringWithholdingAgent}`}
                            value={withholdingRetentions.ring.ringWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['ring','ringWithholdingAgent'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autorretenedor a titulo de timbre</span>
                        <SwitchOption
                            key={`ring-self-${withholdingRetentions.ring.ringSelfWithholdingAgent}`}
                            value={withholdingRetentions.ring.ringSelfWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['ring','ringSelfWithholdingAgent'],value) : undefined}
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
                            value={withholdingRetentions.consumption.consumptionTaxResponsable}
                            action={canEdit && !saving ? value=>updateNestedField(['consumption','consumptionTaxResponsable'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Agente retenedor a titulo de impuesto al consumo</span>
                        <SwitchOption
                            key={`consumption-withholding-${withholdingRetentions.consumption.consumptionWithholdingAgent}`}
                            value={withholdingRetentions.consumption.consumptionWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['consumption','consumptionWithholdingAgent'],value) : undefined}
                        />
                    </div>
                    <div className="labelSwitch">
                        <span>Autorretenedor a titulo de impuesto al consumo</span>
                        <SwitchOption
                            key={`consumption-self-${withholdingRetentions.consumption.consumptionSelfWithholdingAgent}`}
                            value={withholdingRetentions.consumption.consumptionSelfWithholdingAgent}
                            action={canEdit && !saving ? value=>updateNestedField(['consumption','consumptionSelfWithholdingAgent'],value) : undefined}
                        />
                    </div>
                </section>
            </CollapsableItem>
            {canEdit && hasChanges && (
                <div className="optionsRow">
                    <FormButton negative text={'Cancelar'} disabled={saving} onClick={discardTaxConfigChanges}/>
                    <FormButton text={saving ? 'Guardando...' : 'Guardar cambios'} loading={saving} disabled={saving} onClick={saveTaxConfig}/>
                </div>
            )}
        </div>
    )
}
