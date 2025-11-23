import { useState } from "react";
import { SelectOptions } from "../../components/SelectOptions";
import { FormInput } from "../../components/FormInput";
import './ComercialInfo.css'
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormButton } from "../../components/FormButton";
import { SearchinList } from "../../components/SearchInList";

export function ComercialInfo({info}){
    // control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // params form
    const [credit,setCredit] = useState(info.credit != undefined? info.credit:'');
    const [credit_term,setCredit_term] = useState(info.credit_term != undefined? info.credit_term:0);
    const [credit_value,setCredit_value] = useState(info.credit_value != undefined? info.credit_value:0);
    const [interest_rate,setInterestRate] = useState(info.interest_rate != undefined? info.interest_rate:0);
    const [comercial_state,setComercial_state] = useState(info.comercial_state != undefined? info.comercial_state:0);

    const formInfo = {
        credit,
        credit_term,
        credit_value,
        interest_rate,
        comercial_state
    }

    return(
        <div className="ComercialInfo">
            <form action="">
                    <div className="SelOp">
                        <h6>Credito</h6>
                        <SelectOptions action={setCredit} options={['Si','No']} />
                    </div>
                    <FormInput title={'Plazo de págo en días'} action={setCredit_term} placeholder={'0 días'} type={'number'} value={info.credit_term} disabled={disabled}/>
                    <FormInput disabled={disabled} action={setCredit_value} title={'Monto del credito'} value={info.credit_value} moneyF={true} placeholder={'$ 0'} />
                    <FormInput title={'Tasa de interes diaria por mora'} action={setInterestRate} placeholder={'0 %'} value={interest_rate} type={'number'} disabled={disabled}/>
                    <SearchinList action={setComercial_state} value={'Activo'} title={'Estado comercial'} placeHolder={'Estado comercial del tercero'} list={[
                        {text:'Activo',value:'active'},
                        {text:'Desactivado',value:'disabled'},
                        {text:'Bloqueado',value:'blocked'},
                        {text:'Reportado',value:'reported'}
                    ]}/>
                    {formInfo != info && (
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