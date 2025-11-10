import { useState } from "react";
import { SelectOptions } from "../../components/SelectOptions";
import { FormInput } from "../../components/FormInput";
import './ComercialInfo.css'
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormButton } from "../../components/FormButton";

export function ComercialInfo({info}){
    // control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // params form
    const [credit,setCredit] = useState(info.credit != undefined? info.credit:'');
    const [creditTerm,setCreditTerm] = useState(info.creditTerm != undefined? info.creditTerm:0);
    const [creditValue,setCreditValue] = useState(info.creditValue != undefined? info.creditValue:0);
    const [interesRate,setInterestRate] = useState(info.interesRate != undefined? info.interesRate:0);
    const [comercialState,setComercialState] = useState(info.comercialState != undefined? info.comercialState:0);

    const formInfo = {
        credit,
        creditTerm,
        creditValue,
        interesRate,
        comercialState
    }

    return(
        <div className="ComercialInfo">
            <form action="">
                    <div className="SelOp">
                        <h6>Credito</h6>
                        <SelectOptions action={setCredit} options={['Si','No']} />
                    </div>
                    <FormInput title={'Plazo de págo en días'} placeholder={'0 días'} type={'number'} value={15} disabled={disabled}/>
                    <FormInput disabled={disabled} action={setCredit} title={'Monto del credito'} moneyF={true} placeholder={'$ 0'} />
                    <FormInput title={'Tasa de interes diaria por mora'} placeholder={'0 %'} type={'number'} disabled={disabled}/>
                    <div className="SelOp">
                        <h6>Estado Comercial</h6>
                        <SelectOptions action={setCredit} options={['Activo','Bloqueado','En revisión']} />
                    </div>
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