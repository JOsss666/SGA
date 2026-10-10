import { useEffect, useState } from "react";
import { SelectOptions } from "../../components/SelectOptions";
import { FormInput } from "../../components/FormInput";
import './ComercialInfo.css'
import { FormButton } from "../../components/FormButton";
import { SearchinList } from "../../components/SearchInList";
import { ProductLinkFiscalConditionsCard } from "../../components/ProductLinkFiscalConditionsCard";
import { useAppInfo, useNotifications } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";

export function ComercialInfo({info,reloadFun}){

    // Requirements
    const {appInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();

    // control
    const can_edit = userConfig?.access?.sections?.thirdparties?.can_edit
    const [disabled,setDisabled] = useState(!can_edit);

    // Productos relacionados (impuestos y retenciones por compra/venta)
    const [productRelations,setProductRelations] = useState([]);
    const [productAssociations,setProductAssociations] = useState([]);
    const [draftProductRelations,setDraftProductRelations] = useState([]);
    const [draftProductAssociations,setDraftProductAssociations] = useState([]);
    const [savingProductRelations,setSavingProductRelations] = useState(false);
    const [loadingProductRelations,setLoadingProductRelations] = useState(true);
    const [productRelationsLoadError,setProductRelationsLoadError] = useState('');
    const [productRelationsLoaded,setProductRelationsLoaded] = useState(false);

    // params form
    const [credit,setCredit] = useState(info.credit != undefined? info.credit:'');
    const [credit_term,setCredit_term] = useState(info.credit_term != undefined? info.credit_term:0);
    const [credit_value,setCredit_value] = useState(info.credit_value != undefined? info.credit_value:0);
    const [interest_rate,setInterestRate] = useState(info.interest_rate != undefined? info.interest_rate:0);
    const [comercial_state,setComercial_state] = useState(info.comercial_state != undefined? info.comercial_state:undefined);

    const formInfo = {
        company_id:info.company_id ?? appInfo.company_id,
        id:info.id,
        credit,
        credit_term,
        credit_value,
        interest_rate,
        comercial_state
    }

    const hasCommercialChanges = String(credit ?? '') !== String(info.credit ?? '')
        || String(credit_term ?? '') !== String(info.credit_term ?? 0)
        || String(credit_value ?? '') !== String(info.credit_value ?? 0)
        || String(interest_rate ?? '') !== String(info.interest_rate ?? 0)
        || String(comercial_state ?? '') !== String(info.comercial_state ?? '');

    const cancelChanges = ()=>{
        setCredit(info.credit != undefined ? info.credit : '');
        setCredit_term(info.credit_term != undefined ? info.credit_term : 0);
        setCredit_value(info.credit_value != undefined ? info.credit_value : 0);
        setInterestRate(info.interest_rate != undefined ? info.interest_rate : 0);
        setComercial_state(info.comercial_state != undefined ? info.comercial_state : undefined);
        setDraftProductRelations(productRelations);
        setDraftProductAssociations(productAssociations);
    }

    const updateInfo = async()=>{
        if(!can_edit || (!hasCommercialChanges && !hasProductChanges)) return;
        const saveProductChanges = hasProductChanges;
        setDisabled(true);
        setSavingProductRelations(saveProductChanges);
        try{
            if(hasCommercialChanges){
                const response = await postInfo('/updateThirdParty',formInfo);
                if(!response?.[0]) throw new Error('No fue posible guardar la información comercial.');
            }

            if(saveProductChanges){
                await persistProductRelations();
                await getProductRelations();
            }

            addNotification({
                type:'aproved',
                title:'Cambios guardados',
                description:hasCommercialChanges && saveProductChanges
                    ? 'Se actualizó la información comercial, los productos y sus condiciones fiscales.'
                    : saveProductChanges
                        ? 'Se guardaron los productos, impuestos y retenciones asociados.'
                        : 'La información comercial se guardó correctamente.'
            });
            reloadFun?.();
        }catch(error){
            addNotification({
                type:'error',
                title:'No fue posible guardar todos los cambios',
                description:`${error?.message ?? 'Ocurrió un error al guardar.'}${saveProductChanges ? ' Algunos cambios podrían haberse guardado antes del error.' : ''}`
            });
            if(saveProductChanges) await getProductRelations();
        }finally{
            setDisabled(false);
            setSavingProductRelations(false);
        }
    }

    // Carga asociaciones y condiciones fiscales para incluir productos sin impuestos configurados.
    const getProductRelations = async()=>{
        if(!info?.id){
            setLoadingProductRelations(false);
            return;
        }
        setLoadingProductRelations(true);
        setProductRelationsLoadError('');
        setProductRelationsLoaded(false);
        try{
            const requestInfo = {
                company_id:info.company_id ?? appInfo.company_id,
                third_party_id:info.id
            };
            const [associationsRes,relationsRes] = await Promise.all([
                postInfo('/inventory/getThirdPartyProductAssociations',requestInfo),
                postInfo('/inventory/getThirdPartyProductTaxRelations',requestInfo)
            ]);
            const associations = Array.isArray(associationsRes?.[1]) ? associationsRes[1] : [];
            const rows = Array.isArray(relationsRes?.[1]) ? relationsRes[1] : [];
            const relations = rows.map(relation => ({
                ...relation,
                operation_type:relation.operation_type ?? relation.operation,
                tax_role:relation.tax_role ?? relation.role,
                tax_name:relation.tax_name ?? relation.name
            }));
            setProductAssociations(associations);
            setDraftProductAssociations(associations);
            setProductRelations(relations);
            setDraftProductRelations(relations);
            setProductRelationsLoaded(true);
        }catch(err){
            console.error('Error cargando relaciones producto-impuesto del tercero:',err);
            setProductRelationsLoadError(err?.message ?? 'No fue posible cargar las asociaciones del tercero.');
        }finally{
            setLoadingProductRelations(false);
        }
    }

    const getProductId = product => product.product_id ?? product.id;
    const getRelationKey = relation => (
        `${relation.product_id}-${relation.operation_type}-${relation.tax_role}-${relation.tax_id}`
    );
    const associationSnapshot = products => products
        .map(product => `${getProductId(product)}:${product.third_party_reference ?? ''}`)
        .sort();
    const relationSnapshot = relations => relations.map(getRelationKey).sort();
    const hasProductChanges = JSON.stringify(associationSnapshot(productAssociations))
        !== JSON.stringify(associationSnapshot(draftProductAssociations))
        || JSON.stringify(relationSnapshot(productRelations))
        !== JSON.stringify(relationSnapshot(draftProductRelations));

    const persistProductRelations = async()=>{
        const companyId = info.company_id ?? appInfo.company_id;
        const originalById = new Map(productAssociations.map(product => [
            String(getProductId(product)),product
        ]));
        const selectedById = new Map(draftProductAssociations.map(product => [
            String(getProductId(product)),product
        ]));

        for(const [productId] of originalById){
            if(selectedById.has(productId)) continue;
            const response = await postInfo('/inventory/updateThirdPartyProductAssociation',{
                company_id:companyId,
                third_party_id:info.id,
                product_id:Number(productId),
                is_active:false
            });
            if(response?.status !== 'OK') throw new Error('No se pudo retirar uno de los productos asociados.');
        }

        for(const [productId,product] of selectedById){
            const associationResponse = await postInfo('/inventory/updateThirdPartyProductAssociation',{
                company_id:companyId,
                third_party_id:info.id,
                product_id:Number(productId),
                third_party_reference:product.third_party_reference ?? '',
                is_active:true
            });
            if(associationResponse?.status !== 'OK') throw new Error('No se pudo guardar uno de los productos asociados.');

            const selectedRelations = draftProductRelations.filter(relation => (
                String(relation.product_id) === productId
            ));
            const relationsPayload = selectedRelations.map((relation,index)=>{
                const previous = productRelations.find(item => getRelationKey(item) === getRelationKey(relation));
                const payload = {
                    tax_id:relation.tax_id,
                    operation_type:relation.operation_type,
                    tax_role:relation.tax_role,
                    priority:relation.priority ?? index
                };
                ['valid_from','valid_until','notes'].forEach(field=>{
                    if(Object.prototype.hasOwnProperty.call(relation,field)){
                        payload[field] = relation[field];
                    }else if(previous && Object.prototype.hasOwnProperty.call(previous,field)){
                        payload[field] = previous[field];
                    }
                });
                return payload;
            });
            const relationsResponse = await postInfo('/inventory/updateThirdPartyProductTaxRelations',{
                company_id:companyId,
                third_party_id:info.id,
                product_id:Number(productId),
                relations:relationsPayload,
                replace:true
            });
            if(relationsResponse?.status !== 'OK') throw new Error('No se pudieron guardar los impuestos y retenciones de un producto.');
        }
    }

    useEffect(()=>{
        setCredit(info.credit != undefined ? info.credit : '');
        setCredit_term(info.credit_term != undefined ? info.credit_term : 0);
        setCredit_value(info.credit_value != undefined ? info.credit_value : 0);
        setInterestRate(info.interest_rate != undefined ? info.interest_rate : 0);
        setComercial_state(info.comercial_state != undefined ? info.comercial_state : undefined);
        getProductRelations();
    },[info])

    return(
        <div className="ComercialInfo">
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                updateInfo();
            }}>
                <div className="commercialFields">
                    <div className="SelOp">
                        <h6>Credito</h6>
                        <SelectOptions disabled={disabled} defaultValue={{text:credit? 'Si':'No',value:`${credit}`}} action={setCredit} objectC={true} options={[
                            {text:'Si',value:'true'},
                            {text:'No',value:'false'},
                        ]} />
                    </div>
                    {credit == true || credit == 'true' && (
                        <>
                            <FormInput title={'Plazo de págo en días'} action={setCredit_term} placeholder={'0 días'} type={'number'} value={credit_term} disabled={disabled}/>
                            <FormInput disabled={disabled} action={setCredit_value} title={'Monto del credito'} value={credit_value}  placeholder={'$ 0'} />
                            <FormInput title={'Tasa de interes diaria por mora'} action={setInterestRate} placeholder={'0 %'} value={interest_rate} type={'number'} disabled={disabled}/>
                            <SelectOptions disabled={disabled} title={'Estado comercial'} defaultValue={{text:comercial_state,value:comercial_state}} action={setComercial_state} objectC={true} options={[
                                {text:'Activo',value:'active'},
                                {text:'Desactivado',value:'disabled'},
                                {text:'Bloqueado',value:'blocked'},
                                {text:'Reportado',value:'reported'}
                            ]}/>
                        </>
                    )}
                </div>
            <div className="productRelationsContainer">
                <h6>Productos relacionados</h6>
                {loadingProductRelations && <p role="status">Cargando productos y condiciones fiscales...</p>}
                {!loadingProductRelations && productRelationsLoadError && (
                    <p role="alert">{productRelationsLoadError}</p>
                )}
                <ProductLinkFiscalConditionsCard
                    companyId={info.company_id ?? appInfo.company_id}
                    info={info}
                    disabled={!can_edit || disabled || savingProductRelations || loadingProductRelations || !productRelationsLoaded}
                    readOnly={!can_edit || !productRelationsLoaded}
                    value={draftProductRelations}
                    associatedProducts={draftProductAssociations}
                    action={setDraftProductRelations}
                    productsAction={setDraftProductAssociations}
                />
            </div>
            {can_edit && (hasCommercialChanges || hasProductChanges) && (
                <div className="optionsRow">
                    <FormButton
                        type="button"
                        negative={true}
                        text={'Cancelar'}
                        disabled={disabled || savingProductRelations}
                        onClick={cancelChanges}
                    />
                    <FormButton
                        type="submit"
                        text={'Guardar Cambios'}
                        disabled={disabled || savingProductRelations || (hasProductChanges && (loadingProductRelations || !productRelationsLoaded))}
                        loading={disabled || savingProductRelations}
                    />
                </div>
            )}
            </form>
        </div>
    )
}
