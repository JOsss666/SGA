import { useState } from "react";
import { SelectOptions } from "../../components/SelectOptions";
import { FormInput } from "../../components/FormInput";
import './ComercialInfo.css'
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormButton } from "../../components/FormButton";
import { SearchinList } from "../../components/SearchInList";
import { useAppInfo } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";

export function ComercialInfo({info,reloadFun}){

    // Requirements
    const {userConfig} = useAppInfo();

    // control
    const can_edit = userConfig?.access?.sections?.thirdparties?.can_edit
    const [disabled,setDisabled] = useState(!can_edit);

    // params form
    const [credit,setCredit] = useState(info.credit != undefined? info.credit:'');
    const [credit_term,setCredit_term] = useState(info.credit_term != undefined? info.credit_term:0);
    const [credit_value,setCredit_value] = useState(info.credit_value != undefined? info.credit_value:0);
    const [interest_rate,setInterestRate] = useState(info.interest_rate != undefined? info.interest_rate:0);
    const [comercial_state,setComercial_state] = useState(info.comercial_state != undefined? info.comercial_state:undefined);

    const formInfo = {
        id:info.id,
        credit,
        credit_term,
        credit_value,
        interest_rate,
        comercial_state
    }

    const updateInfo = async()=>{
        setDisabled(true);
        console.log(formInfo)
        let res = await postInfo('/updateThirdPartyComercialInfo',formInfo);
        if(res[0]){
            console.log('Actualizacion Exitosa');
            reloadFun?.();
        }
        setDisabled(false);
    }

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
                            <FormInput disabled={disabled} action={setCredit_value} title={'Monto del credito'} value={credit_value} moneyF={true} placeholder={'$ 0'} />
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
                    <FormButton text={'Guardar Cambios'} disabled={disabled} />
                )}
            </form>
            <div className="listDiscounts">
                <h6>Lista de descuentos</h6>
                <div className="gridDiscounts">
                    <NewElementSelect title={'Crear nuevo descuento'}/>
                </div>
            </div>
        </div>
    )
}