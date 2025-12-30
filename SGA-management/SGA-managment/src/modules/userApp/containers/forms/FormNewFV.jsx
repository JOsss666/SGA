import { useState, useEffect } from "react";
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import './FormNewFV.css'
import { FormNewOperation } from "./FormNewOperation";
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormNewBussines } from "./FormNewBussines";
import { FormNewCostCenter } from "./FormNewCostCenter";
import { FormNewStore } from "./FormNewStore";

export function FormNewFV({info,reloadFun}){
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

    // document info
    const [thirdParties,setTirdParties] = useState([]);
    const [OPS,setOPS] = useState([]);
    const [status,setStatus] = useState('active');
    const [store_id,setStore_id] = useState();
    const [bussines_id,setbussines_id] = useState();
    const [costCenter_id,setCostCenter_id] = useState();
    const [attached,setAttached] = useState('');
    const [op_id,setOp_id] = useState();
    const [thirdParty_id,setTirdParty] = useState(info.thirdParty_id);
    const [description,setDescription] = useState('');
    const [concept_id,setConceptId] = useState();
    const [doc_date,setDocDate] = useState();
    
    // DC info
    const [total,setTotal] = useState(0);

    const formInfo = {
        company_id:appInfo.company_id,
        store_id,
        thirdParty_id,
        document_type:'Sell Invoice',
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
        doc_date,
        bussines_id,
        costCenter_id
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

    const createFV = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/createFV',formInfo);
        if(typeof res === 'number'){
            addNotification({
                title:`FV#${res} creado`,
                description:`Se ha añadido la factura de venta (FV#${res}) correctamente a la orden de producción (OP#${op_id})`,
                type:'aproved'
            })
            formInfo.doc_type = 'Sell Invoice',
            formInfo.doc_id = res;
            popOutAlert();
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                title:`Error al crear Factura de venta`,
                description:`Error: ${res[1]}`,
                type:'error',
                fixed:true
            })
        }
        if(typeof res === 'number'){
            await popInAlert(<FormNewOperation info={formInfo}/>)
        }
        setLoading(false);
        setDisabled(false);
    }


    const getFormOptions = async()=>{
        await getStores();
        await getBussines();
        await getCostCenters();
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
            setTirdParty(info.thirdParty_id);
        }
    }

    useEffect(()=>{
        getFormOptions();
    },[])


    return(
        <div className="FormNewFV">
            <BoldTitle text={'Nueva factura de venta'}/>
            <form  onSubmit={(e) => {
                if (!e.target.checkValidity()) return;
                    e.preventDefault();
                    createFV();
                }} >
                {info.op_id == undefined &&(
                    <SearchinList disabled={disabled} action={setOp_id} title={'Orden de produccíon'} placeHolder={'Seleccione la OP a la que pertenece'} list={OPS}/>
                )}
                {info.thirdParty_id == undefined &&(
                    <SearchinList disabled={disabled} action={setTirdParty} title={'Cliente'} placeHolder={'Seleccione el cliente'} list={thirdParties}/>
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
                <SearchinList disabled={disabled} action={setConceptId} title={'Concepto de venta'} placeHolder={'Seleccione el concepto de la venta'} list={concepts}/>
                <FormInput disabled={disabled} action={setDescription} title={'Descripción'} placeholder={'Descripción de la nueva orden de cliente'} textArea={true}/>
                <FormInput disabled={disabled} action={setTotal} title={'Valor factura'} moneyF={true} placeholder={'Descripción de la nueva orden de cliente'} />
                <SearchinList disabled={disabled} action={setPaymentMethod} title={'Metodo de pago'} placeHolder={'Seleccione el metodo de pago'} list={paymentMethods} specialOption={
                    <NewElementSelect title={'Crear nuevo metodo de págo'} onClick={()=>{
                        popInAlert(<span>Formulario para nuevo metodo de págo</span>)
                    }}/>
                }/>
                <FormButton disabled={disabled} text={'Crear factura de venta'} loading={loading}/>
            </form>
        </div>
    )
}