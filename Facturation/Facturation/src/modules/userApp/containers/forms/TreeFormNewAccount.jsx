import { useState } from 'react'
import { FormButton } from '../../components/FormButton'
import {SelectOptions} from '../../components/SelectOptions'
import './TreeFormNewAccount.css'
import { postInfo } from '../../../../utils/functions';
import { useAppInfo, useNotifications } from '../../../../context/context';

export function TreeFormNewAccount({fatherInfo,reloadINfo}){
    
    const {appInfo} = useAppInfo();
    const [name,setName] = useState('');
    const [type,setType] = useState('DB')
    const [subNacc,setsubNacc] = useState(0);
    const {addNotification} = useNotifications();

    const formInfo = {
        accountPlanId:appInfo.accountPlanId,
        name,
        type,
        company_id:appInfo.company_id,
        code:`${fatherInfo.code}${subNacc}`,
        typePlanAccount:appInfo.accountPlanType
    }

    const createAccount = async()=>{
        let res = await postInfo('/insertNewAccount',formInfo);
        if(res){
            addNotification({
                type:'aproved',
                title:`Cuenta ${fatherInfo.code}${subNacc} creada`,
                description:`La cuenta ${fatherInfo.code}${subNacc} fue creada exitosamente.`,
            })
            if(reloadINfo != undefined){
                reloadINfo();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error l crear la cuenta`,
                description:`Error al añadir la cuenta ${fatherInfo.code}${subNacc} a ${fatherInfo.code}.`
            })
        }
    }

    return(
        <form onSubmit={(e) => {
                if (!e.target.checkValidity()) return;
                    e.preventDefault();
                    createAccount();
        }} className="TreeFormNewAccount">
            <span>{fatherInfo.code}</span>
            <input onChange={(e)=>{
                setsubNacc(e.target.value)
            }}required min={0} max={99} className='accountN' type="number" placeholder='00'/>
            <input onChange={(e)=>{
                setName(e.target.value)
            }} required className='accountName' type="text" placeholder='Nombre de la cuenta'/>
            <SelectOptions action={setType} options={['DB','CR']}/>
            <FormButton text={'Crear cuenta'}/>
        </form>
    )
}