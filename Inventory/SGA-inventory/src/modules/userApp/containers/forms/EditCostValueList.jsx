import { useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import './EditCostValueList.css'
import { postInfo } from "../../../../utils/functions";

export function EditCostValueList({info,reloadFun,listInfo}){
    const [unit_value,setUnitValue] = useState(info.unit_value);
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);

    const formInfo = {
        price_id:info.price_id,
        company_id:info.company_id,
        list_id:listInfo.list_id,
        product_id:info.product_id,
        unit_value,
        store_id:listInfo.store_id,
        cellar_id:info.cellar_id,
        stock_id:info.stock_id,
        product_id:info.product_id
    }

    console.log(info);

    const updateProduct = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/updateProductList',formInfo);
        console.log(res);
        setLoading(false);
        setDisabled(false);
        if(reloadFun != undefined){
            reloadFun(formInfo);
        }
    }

    return(
        <div className="EditCostValueList">
            <BoldTitle text={`Editar precio de venta ${info.product_name}`}/>
            <form action="">
                <FormInput type={"number"} moneyF={true} action={setUnitValue} title={"Precio venta"} placeholder={`$ ${info.unit_cost!=undefined? info.unit_cost:0}`} />
                <FormButton disabled={disabled} loading={loading} onClick={(e)=>{
                    e.preventDefault();
                    updateProduct();
                }} text={"Actualizar Información"}/>
                <FormButton disabled={disabled} negative={true} text={"Cancelar"}/>
            </form>
        </div>
    )
}