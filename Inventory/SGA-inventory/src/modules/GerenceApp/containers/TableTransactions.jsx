import { postInfo } from '../../../utils/functions'
import { RowTransaction } from '../componets/RowTransaction'
import './TableTransactions.css'
import { useEffect, useState } from 'react';

export function TableTransactions({setLoading,setTotalBill,docInfo,aplyTransactions,type}){
    // InfoPrevia
    const columns = ["","#","Producto / Servicio","Codigo","Descripción","Unidades",`${type == 'sell'? 'Valor Venta':'Costo'}`,"Total","",""]
    const [products,setProducts] = useState([]);
    const [productsServ,setProductsServ] = useState([]);
    const [disabledRows,setDisabledRows] = useState(false);

    // functions
    const getProducts = async()=>{
        let infoLine = {
            company_id:docInfo.company_id,
        }
        if(type != "entry"){
            infoLine.priceRequired = true,
            infoLine.store_id = docInfo.store_id,
            infoLine.cellar_id = docInfo.cellar_id
        }else{
            infoLine.totalProducts = true;
        }
        let res = await postInfo('/getProducts',infoLine)
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.product_name}`,
                    value:element
                })
            });
            setProducts(C)
        }
    }

    useEffect(()=>{
        getProducts();
    },[docInfo.store_id,docInfo.cellar_id])

    const verProductExis = (id)=>{
        let res = false
        productsServ.forEach(element => {
            console.log(element)
            console.log(id)
            if(element.product_id == id){
                res = true;
            }
        });
        return(res)
    }

    const addProduct = (info)=>{
        if(info != undefined){
            if (!verProductExis(info.product_id)){
                let C = []
                productsServ.forEach(element => {
                    C.push(element);
                });
                C.push(info)
                setProductsServ(C);
            }else{
                alert('El producto ya fue agreado a la lista, modifiquelo o eliminelo.')
            }
        }
    }

    const deleteProduct = (indexDel)=>{
        console.log("Eliminado Producto")
        let C = []
        productsServ.forEach((element,index) => {
            if(index != indexDel){
                C.push(element)
            }else{
                element.movementsUnits = undefined;
            }
        });
        console.log(C);
        setProductsServ(C);
    }

    const calcTotal = ()=>{
        let sum = 0;
        productsServ.map((element)=>{
            if(element.movementsUnits != undefined){
                if(type == "sell"){
                    sum += (element.movementsUnits * element.unit_value)
                }else{
                    sum += (element.movementsUnits * element.unit_cost)
                }
            }
        })
        if(setTotalBill !=undefined){
            setTotalBill(sum);
        }
    }

    const saveMovement = async()=>{
        console.log(docInfo);
        docInfo.movement_type = type;
        let res = await postInfo('/newMovement',docInfo);
        console.log(res);
    }

    const actTransactions = async () => {
    let routers = {
        "sell": "newDeparture",
        "transfer": "Translado",
        "consuption": "newDeparture",
        "entry": "newEntry"
    };
    
    setLoading(true);
    setDisabledRows(true);

    let arrayTransactions = [];

    // Crea un array de promesas
    const promises = productsServ.map(async (element) => {
        let infoTrans = {
            company_id: docInfo.company_id,
            store_id: docInfo.store_id,
            cellar_id: docInfo.cellar_id,
            section_id: docInfo.section_id,
            user_id: docInfo.user_id,
            product_id: element.product_id,
            supplier_id: element.supplier_id,
            units: element.movementsUnits,
            unit_cost: element.unit_cost,
            stock_id: element.stock_id,
            unit_value: element.unit_value,
        };

        if (type === "entry") {
            infoTrans["cost"] = docInfo.movement_value;
            infoTrans["entry_status"] = "completada";
        } 
        if (type === "sell" || type === "consuption") {
            infoTrans["departure_value"] = docInfo.movement_value;
            infoTrans["departure_status"] = "completada";
            infoTrans["client_id"] = element.supplier_id;
        }

        infoTrans["list_id"] = element.list_id;
        element.stateTransaction = "loading";

        console.log("Realizando transacción para: ", infoTrans);

        let res = await postInfo(`/${routers[type]}`, infoTrans);

        console.log(res);
        if (res[0]) {
            arrayTransactions.push(res[1]);
            element.stateTransaction = "realized"
        }
    });

    // Espera a que todas las transacciones se completen
    await Promise.all(promises);

    console.log(arrayTransactions); // ✅ Ahora sí estará lleno

    docInfo["movement_transactions"] = JSON.stringify(arrayTransactions);
    saveMovement();
    setLoading(false);
    setDisabledRows(true);
}


    // PrevActions
    useEffect(()=>{
        getProducts();
    },[])

    useEffect(()=>{
        if(productsServ.length >0){
            calcTotal();
        }else{
            setTotalBill(0);
        }
    },[productsServ])

    useEffect(()=>{
        if(aplyTransactions){
            actTransactions();
        }
    },[aplyTransactions])

    return(
        <div className="TableTransactions">
            <div className="headTable">
                {columns.map((element,index)=>(
                    <span key={index}>{element}</span>
                ))}
            </div>
            <div className="bodyTable">
                {productsServ.length > 0 && productsServ.map((element,index)=>(
                    <RowTransaction disabled={disabledRows} type={type} updateTotal={calcTotal} delP={deleteProduct} index={index} info={element} key={element.product_id} products={[]}/>
                ))}
                <RowTransaction disabled={disabledRows} addP={addProduct} products={products}/>
            </div>
        </div>
    )
}