import { useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { useAppInfo } from "../../../../context/context";
import {postInfo} from "../../../../utils/functions"
import './FormNewCellar.css'

export function FormNewCellar({storeId,store_name,reloadFun}){

    const [disabled,setDisabled] = useState(false);
    const {appInfo} = useAppInfo();
    const [cellar_name,setCellarName] = useState("");
    const [cellar_location,setCellarLocation] = useState("");
    const [store_id,setStoreId] = useState(storeId != undefined? storeId:"");

    const formInfo = {
        company_id:appInfo.company_id,
        cellar_name,
        cellar_location,
        store_id,
    }

    const createCellar = async()=>{
        let res = await postInfo('/createCellar',formInfo);
        console.log(res)
        if(reloadFun != undefined){
            reloadFun();
        }
    }

    return(
        <div className="FormNewCellar">
            <BoldTitle text={"Nueva Bodega"}/>
            <form action="">
                {storeId == undefined && (
                    <SearchinList action={setStoreId} title={"Tienda"} placeHolder={"Seleccione La tienda"} list={[
                        {text:"Tienda 1",value:1},
                        {text:"Tienda 2",value:2},
                        {text:"Tienda 3",value:3}
                    ]} />
                )}
                {storeId != undefined && (
                    <FormInput title={"Tienda"} value={store_name} disabled={true}/>
                )}
                <FormInput action={setCellarName} title={"Nombre"} placeholder={"Nombre de la bodéga"} disabled={disabled}/>
                <FormInput action={setCellarLocation} title={"Dirección"} placeholder={"Cll 101 50 A..."} disabled={disabled}/>
                <FormButton text={"Crear Bodéga"} onClick={(e)=>{
                    e.preventDefault();
                    createCellar();
                }}/>
            </form>
        </div>
    )
}

