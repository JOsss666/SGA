import { useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { useAlert, useAppInfo } from "../../../../context/context";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import './FormNewAccount.css'
import { FormButton } from "../../components/FormButton";
import { postInfo } from "../../../../utils/functions";
import { LoadingSpace } from "../LoadingSpace";

export function FormNewAccount({update, updateInfo = {},reloadFun}){

    console.log(updateInfo)

    // Requirements
    const {appInfo} = useAppInfo();
    const {popOutAlert} = useAlert();

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // FormVariables
    const [code,setCode] = useState(updateInfo.code??'');
    const [name,setName] = useState(updateInfo.name??'');
    const [type,setType] = useState(updateInfo.type??'');
    const [state,setState] = useState(updateInfo.status??'active');
    const [type_account,setTypeAccount] = useState(updateInfo.status??'');

    const formInfo = {
        company_id:appInfo.company_id,
        code,
        name,
        type,
        state,
        type_account
    }

    // Functions
    
    const updateAccount = async()=>{
        let res = await postInfo(`/contability/updateContableAccount/${updateInfo.id}`,formInfo);
        console.log('---> ',res);
    }

    const handleActions = async()=>{
        setDisabled(true)
        setLoading(true)
        if(updateInfo){
            await updateAccount();
            reloadFun?.();
            popOutAlert();
        }else{

        }
        setLoading(false)
        setDisabled(false)
    }

    return(
        <div className="FormNewAccount">
            <BoldTitle text={update? `Actualizar ${updateInfo.name}`:'Nueva cuenta contable'}/>
            {!loading && (
                <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                    handleActions();
                }}>
                    <FormInput type={'text'} title={'Codigo'} action={setCode} disabled={disabled} value={code}/>
                    <FormInput type={'text'} title={'Nombre'} action={setName} disabled={disabled} value={name}/>
                    <SearchinList title={'Tipo'} disabled={disabled} placeHolder={type} action={setType} list={[
                        {text:'Debito',value:'DB'},
                        {text:'Crédito',value:'CR'}
                    ]}/>
                    <SearchinList title={'Estado'} disabled={disabled} placeHolder={state} action={setState} list={[
                        {text:'Activa',value:'active'},
                        {text:'Desactivada',value:'disabled'}
                    ]}/>
                    <FormButton text={update? 'Actualizar información':'Crear cuenta'}/>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Procesando'} description={'Esto no debe tardar mucho.'}/>
            )}
        </div>
    )
}