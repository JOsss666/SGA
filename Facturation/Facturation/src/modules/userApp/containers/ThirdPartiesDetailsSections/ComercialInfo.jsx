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

    const updateInfo = async()=>{
        setDisabled(true);
        try{
            const res = await postInfo('/updateThirdParty',formInfo);
            if(res?.[0]){
                addNotification({
                    type:'aproved',
                    title:'Tercero actualizado',
                    description:'La información comercial se guardó correctamente.'
                });
                reloadFun?.();
            }
        }catch(error){
            addNotification({
                type:'error',
                title:'No fue posible actualizar',
                description:error?.message ?? 'Error al guardar la información comercial.'
            });
        }
        setDisabled(false);
    }

    // Carga las relaciones producto-impuesto del tercero (igual que FormNewThirdParties).
    const getProductRelations = async()=>{
        if(!info?.id) return;
        try{
            const res = await postInfo('/inventory/getThirdPartyProductTaxRelations',{
                company_id:info.company_id ?? appInfo.company_id,
                third_party_id:info.id
            });
            const rows = Array.isArray(res?.[1]) ? res[1] : [];
            setProductRelations(rows.map(relation => ({
                ...relation,
                operation_type:relation.operation_type ?? relation.operation,
                tax_role:relation.tax_role ?? relation.role,
                tax_name:relation.tax_name ?? relation.name
            })));
        }catch(err){
            console.error('Error cargando relaciones producto-impuesto del tercero:',err);
            setProductRelations([]);
        }
    }

    useEffect(()=>{
        console.log(info)
        console.log(comercial_state)
        getProductRelations();
    },[info])

    return(
        <div className="ComercialInfo">
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                updateInfo();
            }}>
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
                    {formInfo != info && can_edit && (
                    <div className="optionsRow">
                        <FormButton negative={true} text={'Cancelar'} disabled={disabled} />
                        <FormButton text={'Guardar Cambios'} disabled={disabled} />
                    </div>
                )}
            </form>
            <div className="productRelationsContainer">
                <h6>Productos relacionados</h6>
                <ProductLinkFiscalConditionsCard
                    companyId={info.company_id ?? appInfo.company_id}
                    info={info}
                    readOnly={true}
                    value={productRelations}
                />
            </div>
        </div>
    )
}
