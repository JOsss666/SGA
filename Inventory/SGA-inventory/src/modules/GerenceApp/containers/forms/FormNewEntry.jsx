import { useEffect, useState } from "react";
import { BoldTitle } from "../../componets/BoldTitle";
import { FormButton } from "../../componets/FormButton";
import { FormInput } from "../../componets/FormInput";
import { useAppinfo } from "../../../../context/context";
import { SearchinList } from "../../componets/SearchInList";
import { useAlert } from "../../../../context/context";
import './FormNewEntry.css'
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { NewElementSelect } from "../../componets/NewElementSelect";
import { FormNewProduct } from "./FormNewProduct";

export function FormNewEntry(){

    const {popInAlert,setOPenAlert} = useAlert();
    const {appInfo,userInfo} = useAppinfo();
    const [store_id,setStoreId] = useState();
    const [cellar_id,setCellarId] = useState();
    const [product_id,setProductId] = useState();
    const [units,setUnits] = useState();
    const [supplier_id,setSupplierId] = useState();
    const [list_id,setListId] = useState();
    const [cost,setCost] = useState();
    const [entry_status,setStateEntry] = useState();
    const [products,setProducts] = useState([]);
    const [cellars,setCellars] = useState([]);

    const getProducts = async()=>{
        let res = await postInfo('/getProducts',{
            company_id:appInfo.company_id,
        })
        if(res[0]){
            let C = []
            res[1].forEach((element,index) => {
                if(index == 0){
                    setListId(element.list_id);
                }
                C.push({
                    text:`#${element.product_code}  ${element.product_name}`,
                    value:`${element.product_id};${element.supplier_id}`
                })
            });
            setProducts(C);
        }
    }

    const getCellars = async()=>{
        let res = await postInfo('/getCellars',{
            company_id:appInfo.company_id,
            store_id
        });
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:element.cellar_name,
                    value:element.cellar_id
                })
            });
            setCellars(C);
        }
        else{
            setCellars([])
        }
    }

    const setPiSi = (element)=>{
        console.log(element)
        if(element != ""){
            let x = element.split(";")
            setProductId(JSON.parse(x[0]));
            setSupplierId(JSON.parse(x[1]));
        }
    }

    const formInfo = {
        store_id,
        cellar_id,
        product_id,
        units,
        list_id,
        cost,
        entry_status,
        user_id:userInfo.user_id,
        company_id:appInfo.company_id,
        supplier_id
    }

    useEffect(()=>{
        getProducts();
    },[])

    useEffect(()=>{
        if(store_id != null){
            getCellars();
        }
    },[store_id])


    const createEntry = async()=>{
        console.log(formInfo)
        let res = await postInfo('/newEntry',formInfo);
        console.log(res);
    }

    return(
        <div className="FormNewEntry">
            <BoldTitle text={"Nuevo Ingreso"}/>
            <form action="">
                <SearchinList action={setStoreId} title={"Tienda"} placeHolder={"Seleccione La tienda"} list={[
                    {text:"Tienda 1",value:1},
                    {text:"Tienda 2",value:2},
                    {text:"Tienda 3",value:3}
                ]} />
                <SearchinList action={setCellarId} title={"Bodega"} placeHolder={"Seleccione La tienda"} list={cellars} />
                <SearchinList action={setPiSi} title={"Producto"} placeHolder={"Seleccione La tienda"} specialOption={
                    <NewElementSelect title={"Nuevo Prodcuto"} onClick={()=>{
                        popInAlert(<FormNewProduct/>);
                        setOPenAlert(true);
                    }}/>
                } list={products} />
                <FormInput action={setUnits} title={"Unidades adquiridas"} placeholder={"Ej 100 unidades"} type={"number"}/>
                <FormInput action={setCost} moneyF={true} title={"Costo Total"} placeholder={`$ 0`} />
                {units != null && cost != null && (
                    <div className="infoCostP"><h5>Importante <i className="fa-solid fa-circle-info"/></h5> <span>El costo de cada unidad en esta entrada es de <strong>$ {moneyFormat(cost/units)}</strong>.</span></div>
                )}
                <SearchinList action={setStateEntry} title={"Estado Ingreso"} placeHolder={"Seleccione el estado del ingreos"} list={[
                    {text:"Pendiente de llegada"},
                    {text:"Completado"},
                    {text:"Pendiente de aprobación"}
                ]} />
                <FormButton text={"Agregar Ingreso"} onClick={(e)=>{
                    e.preventDefault();
                    createEntry();
                }}/>
            </form>
        </div>
    )
}