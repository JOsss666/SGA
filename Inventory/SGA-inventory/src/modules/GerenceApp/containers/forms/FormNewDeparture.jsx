import { BoldTitle } from "../../componets/BoldTitle";
import { SearchinList } from "../../componets/SearchInList";
import { FormInput } from "../../componets/FormInput";
import './FormNewDeparture.css'
import { FormButton } from "../../componets/FormButton";
import { postInfo } from "../../../../utils/functions";
import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";

export function FormNewDeparture(){

    const {appInfo,userInfo} = useAppInfo();
    const [store_id,setStoreId] = useState();
    const [cellar_id,setCellarId] = useState();
    const [product_id,setProductId] = useState();
    const [units,setUnits] = useState(0);
    const [supplier_id,setSupplierId] = useState();
    const [stock_id,setStockid] = useState();
    const [departure_status,setDepartureStatus] = useState();
    const [products,setProducts] = useState([]);
    const [cellars,setCellars] = useState([]);
    const [maxUnit,setMaxUnit] = useState();
    const [departure_value,setunitCost] = useState();
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoadig] = useState(false);

    const getProducts = async()=>{
        let res = await postInfo('/getProducts',{
            company_id:appInfo.company_id,
            store_id,
            cellar_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`#${element.product_code}  ${element.product_name}`,
                    value:`${element.product_id};${element.supplier_id};${element.totalStock};${element.unit_cost};${element.stock_id}`
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
            setMaxUnit(JSON.parse(x[2]));
            setunitCost(JSON.parse(x[3]));
            setStockid(JSON.parse(x[4]));
        }
    }

    const formInfo = {
        store_id,
        cellar_id,
        product_id,
        departure_units:JSON.parse(units),
        stock_id,
        departure_status,
        user_id:userInfo.user_id,
        company_id:appInfo.company_id,
        supplier_id,
        departure_value
    }

    useEffect(()=>{
        getCellars();
    },[store_id])

    useEffect(()=>{
        getProducts();
    },[cellar_id])

    useEffect(()=>{
        if(maxUnit != null){
            setDisabled(units> maxUnit);
        }
    },[units])


    const createDeparture = async()=>{
        setDisabled(true);
        setLoadig(true);
        console.log(formInfo)
        let res = await postInfo('/newDeparture',formInfo);
        console.log(res)
        setLoadig(false)
        setDisabled(false);
    }
    
    return(
        <div className="FormNewDeparture">
            <BoldTitle text={"Nuevo Consumo"}/>
            <form action="" disabled={disabled} onSubmit={async(e)=>{
                e.preventDefault();
                await createDeparture();
            }} >
                <SearchinList disabled={disabled} action={setStoreId} title={"Tienda"} placeHolder={"Seleccionar Tienda"} list={[
                    {text:"Tienda 1",value:1},
                    {text:"Tienda 2",value:2},
                    {text:"Tienda 3",value:3}
                ]}/>
                <SearchinList disabled={disabled} action={setCellarId} title={"Bodega"} placeHolder={"Seleccione La tienda"} list={cellars} />
                <SearchinList disabled={disabled} action={setPiSi} title={"Producto"} placeHolder={"Seleccione La tienda"} list={products} />
                <FormInput action={setUnits} title={"Unidades descontadas"} min={0} max={maxUnit} placeholder={maxUnit != undefined? `Unidades disponibles = ${maxUnit}`:'Ej 100 unidades'} type={"number"}/>
                { units != null && units> maxUnit && (
                    <div className={`infoMaxU ${units>maxUnit? 'ExcesUnits':''}`}><h5>Advertencia <i className="fa-solid fa-circle-info"/></h5> <span>El número maximo de unidades disponibles es de <strong>{maxUnit}</strong>.</span></div>
                )}
                <SearchinList disabled={disabled} action={setDepartureStatus} title={"Estado operación"} placeHolder={"Seleccione el estado del ingreos"} list={[
                    {text:"Pendiente de llegada"},
                    {text:"Completado"},
                    {text:"Pendiente de aprobación"}
                ]} />
                <FormButton disabled={disabled} loading={loading} text={"Registrar salida"}/>
            </form>
        </div>
    )
}