import { useState, useEffect } from "react";
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import './FormNewFV.css'
import { FormNewOperation } from "./FormNewOperation";

export function FormNewFV({info,reloadFun}){

    const {popOutAlert,popInAlert} = useAlert();
    const {appInfo,userInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const [thirdParties,setTirdParties] = useState([]);
    const [OPS,setOPS] = useState([]);
    const [store_id,setStore_id] = useState();
    const [op_id,setOp_id] = useState();
    const [thirdParty_id,setTirdParty] = useState();
    const [description,setDescription] = useState('');
    const [value,setValue] = useState(0);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [concepts,setConcepts] = useState([])
    const [concept_id,setConceptId] = useState();

    const formInfo = {
        company_id:appInfo.company_id,
        user_id:userInfo.user_id,
        store_id:1,
        op_id,
        concept_id,
        thirdParty_id,
        description,
        value:value != '' ? JSON.parse(value):0
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
            formInfo.doc_type = 'FV',
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
        getConcepts();
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
                <SearchinList disabled={disabled} action={setConceptId} title={'Concepto de venta'} placeHolder={'Seleccione el concepto de la venta'} list={concepts}/>
                <FormInput disabled={disabled} action={setDescription} title={'Descripción'} placeholder={'Descripción de la nueva orden de cliente'} textArea={true}/>
                <FormInput disabled={disabled} action={setValue} title={'Valor factura'} moneyF={true} placeholder={'Descripción de la nueva orden de cliente'} />
                <FormButton disabled={disabled} text={'Añadir orden del cliente'} loading={loading}/>
            </form>
        </div>
    )
}