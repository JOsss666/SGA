import { useEffect, useState } from "react";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton"
import { BoldTitle } from "../../components/BoldTitle";
import './FormNewConcept.css'
import {NewElementSelect} from '../../components/NewElementSelect'
import { CardTitleLogo } from "../../components/CardTitleLogo";
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { FormNewTax } from "./FormNewTax";
import { FormNewAccount } from "./FormNewAccount";
import { SwitchOption } from "../../components/SwitchOption";

export function FormNewConcept({reloadInfo, update, updateInfo={}}){

    // Requeriments
    const {popOutAlert,popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const {appInfo} = useAppInfo();
    const [accounts,setAccounts] = useState([]);


    // Control
    const [disabled,setsDisabled] = useState(false);
    const [loading,setLoading] = useState(false);

    // FormInfo
    const [name,setName] = useState(updateInfo.name??'');
    const [selectedAccount,setSelectedAccount] = useState(updateInfo.account_id??null);
    const [description,setDescription] = useState('');
    const [order_index,setOrderIndex] = useState(null);
    // Type concept control
        const [for_wallet,setForWallet]= useState(updateInfo.for_wallet?? false);
        const [for_balance,setForBalance]= useState(updateInfo.for_balance ?? false);
        const [for_cashExit,setForCashExit]= useState(updateInfo.for_cashExit?? false);

    const getAccounts = async()=>{
        let res = await postInfo('/getAccountsPlan',{
            company_id:appInfo.company_id,
            accountPlanId:appInfo.accountPlanId,
            accountPlanType:appInfo.accountPlanType
        })
        if(res[1][0]){
            let C = []
            res[1][1].forEach(element => {
                C.push({
                    text:`${element.code} - ${element.name}`,
                    value:element.id
                })
            });
            setAccounts(C)
        }
    }

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        account_id:selectedAccount,
    }

    const createConcept = async()=>{
        setsDisabled(true);
        setLoading(true);
        let res = await postInfo('/createConcept',formInfo)
        if(res){
            addNotification({
                type:'aproved',
                title:'Nuevo Concepto creado',
                description:`El concepto "${name}" ha sido creado correctamente.`
            })
            popOutAlert();
            if(reloadInfo != undefined){
                reloadInfo();
            }
        }else{
            addNotification({
                type:'error',
                title:'Error al crear el nuevo concepto',
                description:`Ups, ocurrio un error al intentar crear el nuevo concepto, intentalo de nuevo.`
            })
        }
        setLoading(false);
        setsDisabled(false);
    }

    const updateConcept = async()=>{
        setsDisabled(true)
        setLoading(true)
        let res = await postInfo(`/updateConcept/${updateInfo.id}`,formInfo);
        console.log(res);
        popOutAlert();
        reloadInfo?.();
        setLoading(false);
        setsDisabled(false);
    }

    const handleAction = async()=>{
        if(update){
            await updateConcept();
        }else{
            await createConcept();
        }
    }

    useEffect(()=>{
        getAccounts();
        console.log(updateInfo)
    },[])

    return(
        <div className="FormNewConcept">
                <BoldTitle text={`Actualizar "${updateInfo.name}"`}/>
                <form className="createNewConcept" onSubmit={(e)=>{
                    e.preventDefault();
                    handleAction();
                }}>
                    <FormInput disabled={disabled} action={setName} title={'Nombre'} placeholder={'Nombre del nuevo concepto'} value={name}/>
                    <SearchinList disabled={disabled} action={(value)=>{
                        if(value != ""){
                            setSelectedAccount(value)
                        }
                    }} title={'Cuenta'} list={accounts} placeHolder={selectedAccount? `Actual: ${selectedAccount}`:'Seleccionar Cuenta'} specialOption={
                        <NewElementSelect title={'Crear nueva cuenta'} onClick={()=>{popInAlert(<FormNewAccount/>)}}/>
                    }/>
                    <div className="switchContent">
                        <span className="switchLabel">Es para cartera?</span>
                        <SwitchOption action={setForWallet} defaultValue={for_wallet}/>
                    </div>
                    <div className="switchContent">
                        <span className="switchLabel">Es para anticipos?</span>
                        <SwitchOption action={setForBalance} defaultValue={for_balance}/>
                    </div>
                    <div className="switchContent">
                        <span className="switchLabel">Es para gastos?</span>
                        <SwitchOption action={setForCashExit} defaultValue={for_cashExit}/>
                    </div>
                    <FormButton text={update? `Actuaizar concepto`:'Crear nuevo concepto'} disabled={disabled} loading={loading}/>
                </form>
        </div>
    )
}