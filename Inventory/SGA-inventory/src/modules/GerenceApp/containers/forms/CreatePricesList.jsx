import { BoldTitle } from "../../componets/BoldTitle";
import { FormInput } from "../../componets/FormInput";
import { useAppinfo } from "../../../../context/context";
import './CreatePricesList.css'
import { SearchinList } from "../../componets/SearchInList";
import { useEffect, useState } from "react";
import { postInfo } from "../../../../utils/functions";
import { FormButton } from "../../componets/FormButton";

export function CreatePricesList({Store}){

    const {appInfo} = useAppinfo();
    const [stores,setStores] = useState([])
    const [store_id,setStoreId] = useState(Store!= undefined? Store:'');
    const [list_name,setListName] = useState("");
    const [list_description,setListDesc] = useState("")
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false)

    const formInfo = {
        company_id:appInfo.company_id,
        store_id,
        list_name,
        list_description
    }

    const getStores = async()=>{
        let res = await postInfo('/getStores',appInfo.company_id);
        if(res[0]){
            let C = []
            res[1].map((element)=>{
                C.push({
                    text:element.store_name,
                    value:element.store_id
                })
            })
            setStores(C)
        }
    }

    const createList = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createPriceList',formInfo);
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        console.log(stores)
    },[stores])

    useEffect(()=>{
        if(Store == undefined){
            getStores();
        }
    },[])

    return(
        <div className="CreatePricesList">
            <BoldTitle text={"Nueva Lista de Precios"}/>
            <form action="">
                {Store != undefined && (
                    <FormInput title={"Tienda"} placeholder={"Nombra tu lista de precios."} value={Store} disabled={true}/>
                )}{Store == undefined && (
                    <SearchinList disabled={disabled} action={setStoreId} title={"Tienda"} placeHolder={"Que tienda va a usar esta lista"} list={stores}/>
                )}
                <FormInput disabled={disabled} action={setListName} title={"Nombre"} placeholder={"Nombra tu lista de precios."}/>
                <FormInput disabled={disabled} action={setListDesc} title={"Descripción"} textArea={true} placeholder={"Información adicional sobre tu lista de precios."}/>
                <FormButton loading={loading} disabled={disabled} text={"Crear Lista de Precios"} onClick={(e)=>{
                    e.preventDefault();
                    createList();
                }}/>
            </form>
        </div>
    )
}