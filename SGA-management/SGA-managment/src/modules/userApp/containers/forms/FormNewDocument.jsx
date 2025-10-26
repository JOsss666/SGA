import { BeutyReciptContainer } from "../../components/BeutyReciptContainer";
import { BoldTitle } from "../../components/BoldTitle";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { InputFiles } from "../../components/InputFiles";
import { SearchinList } from "../../components/SearchInList";
import {TableTransactions} from '../TableTransactions'
import { useAppInfo } from "../../../../context/context";
import { useAlert } from "../../../../context/context";
import { useEffect, useState } from "react";
import './FormNewDocument.css'
import { moneyFormat,postInfo } from "../../../../utils/functions";
import {WarningForm} from '../../components/WarningForm'

export function FormNewDocument({type,reloadFun,info}){

    const titleForm = {
        "sell":"Salida",
        "transfer":"Translado",
        "consuption":"Consumo",
        "entry":"Entrada"
    }

    // controll form
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // Aditional Data
    const {popOutAlert} = useAlert();
    const {appInfo,userInfo} = useAppInfo();
    // Component Info
    const [stores,setStores] = useState([]);
    const [cellars,setCellars] = useState([]);

    //Form data
    const [op_id,setOp_id] = useState();
    const [thirdParties,setTirdParties] = useState([])
    const [OPS,setOPS] = useState([])
    const [movement_value,setTotalBill] = useState(0); 
    const [supplier_id,setSupplierId] = useState();
    const [store_id,setStoreId] = useState(null);
    const [cellar_id,setCellarId] = useState(null);
    const [document_number,setDocNumber] = useState();
    const [movement_date,setDocDate] = useState();
    const [movement_transactions,setMovementTrans] = useState([])
    const [movement_description,setMovementDes] = useState('');

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
        processAction:true,
        op_id
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
                    text:element.store_name,
                    value:element.store_id
                })
            });
            console.log(C)
            setStores(C);
        }
        console.log(res);
    }

    useEffect(() => {
        if (store_id != undefined) {
            getCellars();
        }
        console.log(store_id);
    }, [store_id, cellar_id]);


    useEffect(()=>{
        if(appInfo.company_id != undefined){
            getStores();
        }
    },[appInfo.company_id])

    const getFormOptions = async()=>{
            if(info.op_id == undefined){
                let getOps = await postInfo('/process/getOp',{company_id:appInfo.company_id});
                if(getOps[0]){
                    let C = [];
                    getOps[1].forEach(element => {
                        C.push({
                            text:`OP#${element.op_id}`,
                            value:element.op_id
                        })
                    });
                    setOPS(C);
                }
            }else{
                setOp_id(info.op_id);
            }
            if(info.thirdParty_id == undefined){
                let getThirdParties = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
                if(getThirdParties[0]){
                    let C = [];
                    getThirdParties[1].forEach(element => {
                        C.push({
                            text:`${element.names}  ${element.indentification_type}_${element.indentification_number}`,
                            value:element.id
                        })
                    });
                    setTirdParties(C);
                }
            }else{
                setSupplierId(info.thirdParty_id);
            }
        }
    
        useEffect(()=>{
            getFormOptions();
        },[])

        const handleEndProcess = ()=>{
            //popOutAlert();
            if(reloadFun != undefined){
                reloadFun();
            }
        }

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
                {info.op_id == undefined &&(
                    <SearchinList disabled={disabled} action={setOp_id} title={'Orden de produccíon'} placeHolder={'Seleccione la OP a la que pertenece'} list={OPS}/>
                )}
                {info.thirdParty_id == undefined && (
                    <SearchinList disabled={loading} action={setSupplierId}  title={"Proveedor"} placeHolder={"Seleccionar proveedor"} list={thirdParties}/>
                )}
                <SearchinList disabled={loading} action={setStoreId} title={"Tienda"} placeHolder={"Seleccionar Tienda"} list={stores}/>
                <SearchinList disabled={loading} action={setCellarId} title={"Bodega"} placeHolder={"Seleccionar Bodéga"} list={cellars}/>
                <FormInput disabled={loading} action={setDocNumber} title={"No Documento"} placeholder={"FC 212..."}/>
                <FormInput disabled={loading} action={setDocDate} title={"Fecha Documento"} placeholder={"aa/mm/dd"} type={"date"}/>
            </div>
            <div className="transactionsContainer">
                {store_id !=null &&  store_id != "" && (
                    <TableTransactions setLoading={setLoading} type={type} aplyTransactions={aplyTransactions} docInfo={formInfo} setTotalBill={setTotalBill} reloadFun={handleEndProcess} />
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