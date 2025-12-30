import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { postInfo } from "../../../../utils/functions";
import './FormNewDC.css'
import { LoadingSpace } from "../LoadingSpace";
import { FormNewOperation } from "./FormNewOperation";
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormNewStore } from "./FormNewStore";
import { FormNewBussines } from "./FormNewBussines";
import { FormNewCostCenter } from "./FormNewCostCenter";

export function FormNewDC({info,reloadFun}){
    if(info == undefined){
        info = {}
    }

    // Requirements
    const [concepts,setConcepts] = useState([]);
    const [stores,setStores] = useState([]);
    const [bussines,setBussines] = useState([]);
    const [costCenters,setCostCenters] = useState([]);

    // control
    const {popOutAlert,popInAlert} = useAlert();
    const {appInfo,userInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const [paymentMethods,setPaymentMethods] = useState([]);
    const [paymentMethod,setPaymentMethod] = useState();
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [thirdParties,setTirdParties] = useState([]);

    // document info
    const [OPS,setOPS] = useState([]);
    const [status,setStatus] = useState('active');
    const [store_id,setStore_id] = useState();
    const [bussines_id,setbussines_id] = useState();
    const [costCenter_id,setCostCenter_id] = useState();
    const [attached,setAttached] = useState('');
    const [op_id,setOp_id] = useState();
    const [thirdParty_id,setTirdParty] = useState();
    const [description,setDescription] = useState('');
    const [concept_id,setConceptId] = useState();
    const [doc_date,setDocDate] = useState();
    
    // DC info
    const [total,setTotal] = useState(0);

    const formInfo = {
        company_id:appInfo.company_id,
        store_id,
        bussines_id,
        costCenter_id,
        thirdParty_id,
        document_type:'Purchase Document',
        status,
        created_by:userInfo.user_id,
        op_id,
        description,
        costCenter_id:1,
        attached,
        total,
        paymentMethod,
        doc_date,
        concept_id,
        subTotal:total,
        
    }
    
    const getConcepts = async()=>{
        let res = await postInfo('/getConcepts',{
            company_id:appInfo.company_id,
            typePlanAccount:appInfo.accountPlanType
        })
        console.log(res)
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`SGA#${element.id} ${element.name}`,
                    value:element.id
                })
                setConcepts(C)
            });
        }else{
            setConcepts([])
        }
    }

    const getThirdParties = async()=>{
        let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
        console.log(thirdParties)
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.names}  ${element.indentification_type}_${element.indentification_number}`,
                    value:element.id
                })
            });
            setTirdParties(C);
        }
    }

    const getStores = async()=>{
        let res = await postInfo('/getStores',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
                setStores(C);
            });
        }
    }

    const getBussines = async()=>{
        let res = await postInfo('/getBussines',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
                setBussines(C);
            });
        }
    }

    const getCostCenters = async()=>{
        let res = await postInfo('/getCostCenters',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
                setCostCenters(C);
            });
            
        }
    }
    

    const createDC = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/createDC',formInfo);
        console.log(res);
        if(typeof res === 'number'){
            addNotification({
                title:`DC#${res} creado`,
                description:`Se ha añadido el documento de compra (DC#${res}) correctamente a la orden de producción (OP#${op_id})`,
                type:'aproved'
            })
            await popOutAlert();
            formInfo.doc_type = 'Purchase Document',
            formInfo.doc_id = res;
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                title:`Error al crear Documento de Compra`,
                description:`Error: ${res[1]}`,
                type:'error',
                fixed:true
            })
            popOutAlert();
        }
        setLoading(false);
        setDisabled(false);
        if(typeof res === 'number'){
            await popInAlert(<FormNewOperation info={formInfo}/>)
        }
    }

    const getPaymentMethods = async()=>{
        let res = await postInfo('/getPaymentMethods',{
            company_id:appInfo.company_id,
            typePlanAccount:appInfo.accountPlanType
        })
        console.log(res)
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element
                })
            });
            setPaymentMethods(C);
        }
    }

    const getFormOptions = async()=>{
        setLoading(true);
        await getStores()
        await getBussines()
        await getCostCenters();
        await getThirdParties();
        await getConcepts();
        await getPaymentMethods();
        if(info.op_id == undefined){
            let getOps = await postInfo('/process/getOp',{company_id:appInfo.company_id});
            if(getOps[0]){
                let C = [];
                getOps[1].forEach(element => {
                    C.push({
                        text:`OP#${element.ownSerial}`,
                        value:element.id
                    })
                });
                setOPS(C);
            }
        }else{
            setOp_id(info.op_id);
        }
        setLoading(false)
    }

    useEffect(()=>{
        getFormOptions();
    },[])

    if(!loading){
        return(
            <div className="FormNewDC">
                <BoldTitle text={'Nuevo Documento de Compra'}/>
                <form  onSubmit={(e) => {
                    if (!e.target.checkValidity()) return;
                        e.preventDefault();
                        createDC();
                    }} >
                    {info.op_id == undefined &&(
                        <SearchinList disabled={disabled} action={setOp_id} title={'Orden de produccíon'} placeHolder={'Seleccione la OP a la que pertenece'} list={OPS}/>
                    )}
                    {info.store_id == undefined && (
                        <SearchinList disabled={disabled} action={setStore_id} title={'Tienda'} list={stores} placeHolder={'Selecione la tienda'} specialOption={
                            <NewElementSelect title={'Crear nueva'} onClick={()=>{
                                popInAlert(<FormNewStore/>)
                            }}/>
                        }/>
                    )}
                    {info.bussines_id == undefined && (
                        <SearchinList disabled={disabled} action={setbussines_id} title={'Negocio'} list={bussines} placeHolder={'Seleccione el negoio'} specialOption={
                            <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                popInAlert(<FormNewBussines/>)
                            }}/>
                        }/>
                    )}
                    {info.costCenter_id == undefined && (
                        <SearchinList disabled={disabled} action={setCostCenter_id} title={'Centro de costo'} list={costCenters} placeHolder={'Seleccione el centro de costo'} specialOption={
                            <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                popInAlert(<FormNewCostCenter/>)
                            }}/>
                        }/>
                    )}
                    <FormInput disabled={disabled} action={setDocDate} title={'Fecha del documento'} type={'date'}/>
                    <SearchinList disabled={disabled} action={setTirdParty} title={'Provedor'} placeHolder={'Seleccione el proveedor'} list={thirdParties}/>
                    <SearchinList disabled={disabled} action={setConceptId} title={'Concepto del documento'} placeHolder={'Seleccione el concepto del documento'} list={concepts}/>
                    <FormInput disabled={disabled} action={setDescription} title={'Descripción'} placeholder={'Descripción de la nueva orden de cliente'} textArea={true}/>
                    <SearchinList disabled={disabled} action={setPaymentMethod} title={'Metodo de pago'} placeHolder={'Seleccione el metodo de pago'} list={paymentMethods} specialOption={
                        <NewElementSelect title={'Crear nuevo metodo de págo'} onClick={()=>{
                            popInAlert(<span>Formulario para nuevo metodo de págo</span>)
                        }}/>
                    }/>
                    <FormInput disabled={disabled} action={setTotal} title={'Valor documento'} moneyF={true} placeholder={'Descripción de la nueva orden de cliente'} />
                    <FormButton disabled={disabled} text={'Continuar'} loading={loading}/>
                </form>
            </div>
        )
    }
    else{
        return(
                <LoadingSpace title={'Cargando datos'} description={'Esto no debe tardar mucho...'}/>
        )
    }
}