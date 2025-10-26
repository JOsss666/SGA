import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import './FormNewOc.css'
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";
import { FormButton } from "../../components/FormButton";
import { SearchinList } from "../../components/SearchInList";

export function FormNewOc({info,reloadFun}){

    const {popOutAlert} = useAlert();
    const {appInfo,userInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const [thirdParties,setTirdParties] = useState([]);
    const [OPS,setOPS] = useState([]);
    const [store_id,setStore_id] = useState();
    const [op_id,setOp_id] = useState();
    const [thirdParty_id,setTirdParty] = useState();
    const [description,setDescription] = useState('');
    const [budgetIncome,setBudgetIn] = useState(0);
    const [budgetCost,setBudgetCo] = useState(0);
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    const formInfo = {
        company_id:appInfo.company_id,
        user_id:userInfo.user_id,
        store_id:1,
        op_id,
        thirdParty_id,
        description,
        budgetIncome:budgetCost != ''? JSON.parse(budgetIncome):0,
        budgetCost:JSON.parse(budgetCost) != ''? JSON.parse(budgetCost):0
    }

    const createOc = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/process/createOC',formInfo);
        console.log(res);
        if(typeof res == "number"){
            popOutAlert();
            addNotification({
                type:'aproved',
                title:`OC#${res} Creada`,
                description:`Se a añadido la Orden de cliente (OC#${res}) a la orden de producción (OP#${op_id} exitosamente.)`
            })
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al añadir la orden de cliente`,
                description:`No se pudo añadir la orden de cliente a la OP#${op_id} intentalo de nuevo`
            })
        }
        setLoading(false)
        setDisabled(false)
    }

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
            setTirdParty(info.thirdParty_id);
        }
    }

    useEffect(()=>{
        getFormOptions();
    },[])

    return(
        <div className="FormNewOc">
            <BoldTitle text={'Nueva Orden de Cliente'}/>
            <form onSubmit={(e) => {
                if (!e.target.checkValidity()) return;
                    e.preventDefault();
                    createOc();
                }}>
                {info.op_id == undefined &&(
                    <SearchinList disabled={disabled} action={setOp_id} title={'Orden de produccíon'} placeHolder={'Seleccione la OP a la que pertenece'} list={OPS}/>
                )}
                {info.thirdParty_id == undefined &&(
                    <SearchinList disabled={disabled} action={setTirdParty} title={'Cliente'} placeHolder={'Seleccione el cliente'} list={thirdParties}/>
                )}
                <FormInput disabled={disabled} action={setDescription} title={'Descripción'} placeholder={'Descripción de la nueva orden de cliente'} textArea={true}/>
                <FormInput disabled={disabled} action={setBudgetIn} title={'Ingreso presupuestado'} moneyF={true} placeholder={'Descripción de la nueva orden de cliente'} />
                <FormInput disabled={disabled} action={setBudgetCo} title={'Costo presupuestado'} moneyF={true} placeholder={'Descripción de la nueva orden de cliente'} />
                <FormButton disabled={disabled} text={'Añadir orden del cliente'} loading={loading}/>
            </form>
        </div>
    )
}