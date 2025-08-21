import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { postInfo } from "../../../../utils/functions";
import './FormNewDC.css'

export function FormNewDC({info,reloadFun}){

    const {popOutAlert} = useAlert();
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

    const formInfo = {
        company_id:appInfo.company_id,
        user_id:userInfo.user_id,
        store_id:1,
        op_id,
        thirdParty_id,
        description,
        value:value != '' ? JSON.parse(value):0
    }

    const createDC = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/createDC',formInfo);
        if(typeof res === 'number'){
            addNotification({
                title:`DC#${res} creado`,
                description:`Se ha añadido el documento de compra (DC#${res}) correctamente a la orden de producción (OP#${op_id})`,
                type:'aproved'
            })
            popOutAlert();
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
        }
        setLoading(false);
        setDisabled(false);
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
                <SearchinList disabled={disabled} action={setTirdParty} title={'Provedor'} placeHolder={'Seleccione el proveedor'} list={thirdParties}/>
                <FormInput disabled={disabled} action={setDescription} title={'Descripción'} placeholder={'Descripción de la nueva orden de cliente'} textArea={true}/>
                <FormInput disabled={disabled} action={setValue} title={'Valor documento'} moneyF={true} placeholder={'Descripción de la nueva orden de cliente'} />
                <FormButton disabled={disabled} text={'Añadir orden del cliente'} loading={loading}/>
            </form>
        </div>
    )
}