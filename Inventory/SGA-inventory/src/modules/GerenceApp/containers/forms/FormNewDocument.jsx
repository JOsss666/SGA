import { BeutyReciptContainer } from "../../componets/beutyReciptContainer";
import { BoldTitle } from "../../componets/BoldTitle";
import { FormButton } from "../../componets/FormButton";
import { FormInput } from "../../componets/FormInput";
import { InputFiles } from "../../componets/InputFiles";
import { SearchinList } from "../../componets/SearchInList";
import { TableTransactions } from "../TableTransactions";
import { useAppInfo } from "../../../../context/context";
import { useAlert } from "../../../../context/context";
import { useEffect, useState } from "react";
import './FormNewDocument.css'
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { WarningForm } from "../../componets/WarningForm";

export function FormNewDocument({type}){
    
    const titleForm = {
        "sell":"Salida",
        "transfer":"Translado",
        "consuption":"Consumo",
        "entry":"Entrada"
    }

    // controll form
    const [loading,setLoading] = useState(false);

    // Aditional Data
    const {popOutAlert,setOpenAlert} = useAlert();
    const {appInfo,userInfo} = useAppInfo();
    // Component Info
    const [stores,setStores] = useState([]);
    const [cellars,setCellars] = useState([]);

    //Form data
    const [movement_value,setTotalBill] = useState(0); 
    const [supplier_id,setSupplierId] = useState();
    const [store_id,setStoreId] = useState(null);
    const [cellar_id,setCellarId] = useState(null);
    const [document_number,setDocNumber] = useState();
    const [movement_date,setDocDate] = useState();
    const [movement_transactions,setMovementTrans] = useState([])
    const [movement_description,setMovementDes] = useState();

    // Actions
    const [aplyTransactions,setAplyTransactions] = useState(false);

    const formInfo = {
        supplier_id,
        movement_value,
        user_id:userInfo.user_id,
        company_id:appInfo.company_id,
        store_id,
        cellar_id,
        document_number,
        movement_date,
        movement_transactions,
        movement_description,
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

    const getStores = async()=>{
        let res = await postInfo('/getStores',appInfo.company_id);
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
            });
            setStores(C);
        }
        console.log(res);
    }

    useEffect(() => {
        if (store_id != undefined) {
            getCellars();
        }
        console.log(store_id);
    }, [store_id, cellar_id]); // ← Esto es correcto SIEMPRE que no cambies dinámicamente su contenido


    useEffect(()=>{
        if(appInfo.company_id != undefined){
            getStores();
        }
    },[appInfo.company_id])

    return(
        <div className="FormNewDocument">
            <BeutyReciptContainer children={
                    <div className="formSubmS">
                        <strong>Valor total documento</strong>
                        <BoldTitle text={`$ ${moneyFormat(movement_value)}`}/>
                    </div>
                }/>
            <BoldTitle text={`Nuevo documento de ${titleForm[type]}`} children={<i className="fa-solid fa-receipt"/>}/>
            <div className="topParameters">
                <SearchinList disabled={loading} action={setSupplierId}  title={"Proveedor"} placeHolder={"Seleccionar proveedor"} list={[
                    {text:"Proveedor 1",value:1}
                ]}/>
                <SearchinList disabled={loading} action={setStoreId} title={"Tienda"} placeHolder={"Seleccionar Tienda"} list={stores}/>
                <SearchinList disabled={loading} action={setCellarId} title={"Bodega"} placeHolder={"Seleccionar Bodéga"} list={cellars}/>
                <FormInput disabled={loading} action={setDocNumber} title={"No Documento"} placeholder={"FC 212..."}/>
                <FormInput disabled={loading} action={setDocDate} title={"Fecha Documento"} placeholder={"aa/mm/dd"} type={"date"}/>
            </div>
            <div className="transactionsContainer">
                {store_id !=null &&  store_id != "" && (
                    <TableTransactions setLoading={setLoading} type={type} aplyTransactions={aplyTransactions} docInfo={formInfo} setTotalBill={setTotalBill}/>
                )}
                {store_id == null || store_id == "" && (
                    <WarningForm tittle={"Advertencia documento"} desc={`Para continuar por favor seleccione una tienda y una bodega.`}/>
                )}
            </div>
            <div className="footerParameters">
                <FormInput disabled={loading} action={setMovementDes} title={"Observación"} placeholder={"Agregar una descripción o observacion al documento."} textArea={true}/>
                <InputFiles title={"Adjuntar comprobante"}/>
                <BeutyReciptContainer children={
                    <div className="formSubmS">
                        <strong>Valor total documento</strong>
                        <BoldTitle text={`$ ${moneyFormat(movement_value)}`}/>
                        <div className="btnC">
                            <FormButton disabled={loading} onClick={()=>{
                                popOutAlert()
                            }} text={"Cancelar"} negative={true}/>
                            <FormButton disabled={loading} loading={loading} onClick={()=>{
                                setAplyTransactions(true);
                            }} text={loading? "Guardando":"Guardar"}/>
                        </div>
                    </div>
                }/>
            </div>
        </div>
    )
}