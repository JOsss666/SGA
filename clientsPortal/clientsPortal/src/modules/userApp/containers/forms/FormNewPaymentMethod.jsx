import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { postInfo } from "../../../../utils/functions";
import { NewElementSelect } from "../../components/NewElementSelect";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import './FormNewPaymentMethod.css'

export function FormNewPaymentMethod({reloadFun}){

    // requirements
    const {appInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popInAlert,popOutAlert} = useAlert();
    
    // Control
    const [disabled,setsDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [accounts,setAccounts] = useState(false);

    // FormInfo
    const [name,setName] = useState('');
    const [account_id,setAccount_id] = useState();
    const [code,setCode] = useState('');
    const [currency,setCurrency] = useState('COP');
    const [type,setType] = useState('');
    const [status,setStatus] = useState('active');

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        account_id,
        code,
        currency,
        type,
        status
    }

    // functions
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

    const createPaymentMehtod = async()=>{
        setsDisabled(true);
        setLoading(true);
        let res = await postInfo('/createPaymentMethod',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Metodo de pago "${name}" creado`,
                description:`El metodo de pago "${name}" fue creado correctamente.`
            })
            if(reloadFun != undefined){
                reloadFun()
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al crear Metodo de pago`,
                description:`Hubo un error al crear el metodo de pago "${name}", intentelo nuevamente.`
            })
        }
        popOutAlert();
        setLoading(false);
        setsDisabled(false);
    }

    useEffect(()=>{
        getAccounts();
    },[])


    return(
        <div className="FormNewPaymentMethod">
            <BoldTitle text={'Nuevo Metodo de págo'}/>
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                createPaymentMehtod();
            }}>
                <FormInput title={'Nombre'} action={setName} placeholder={'Nombra tu metodo de pago'} disabled={disabled}/>
                <FormInput title={'Codigo'} action={setCode} placeholder={'#...'} disabled={disabled}/>
                <SearchinList disabled={disabled} action={setAccount_id} title={'Cuenta'} list={accounts} placeHolder={'Seleccionar Cuenta'} specialOption={
                    <NewElementSelect title={'Crear nueva cuenta'} onClick={()=>{popInAlert(<span>Formulario nueva cuenta</span>)}}/>
                }/>
                <SearchinList title={'Tipo de metodo de pago'} placeHolder={'Seleccionar opción'} disabled={disabled} action={setType} list={[
                    {text:'Efectivo',value:'cash'},
                    {text:'Transferencia bancaria',value:'bank_transfer'},
                    {text:'Tarjeta debito',value:'debit_card'},
                    {text:'Tarjeta credito',value:'credit_card'},
                    {text:'Billetera digital',value:'digital_wallet'},
                    {text:'Cheque',value:'check'},
                    {text:'Pago contraentrega',value:'cash_onDelivery'},
                    {text:'Criptomoneda',value:'crypto_currency'},
                    {text:'Saldos a favor',value:'balances favor'}
                ]}/>
                <SearchinList title={'Moneda'} placeHolder={'Seleccionar opción'} disabled={disabled} action={setCurrency} list={[
                    {text:'COP'},
                    {text:'USD'},
                    {text:'EUR'},
                    {text:'GBP'},
                    {text:'CHF'},
                    {text:'JPY'},
                    {text:'HKD'},
                    {text:'CAD'},
                    {text:'CNY'},
                    {text:'AUD'},
                    {text:'BRL'},
                    {text:'RUB'},
                    {text:'MXN'}
                ]}/>
                <SearchinList title={'Estado'} placeHolder={'Seleccionar opción'} disabled={disabled} action={setStatus} list={[
                    {text:'active'},
                    {text:'disabled'},
                    {text:'blocked'},
                    {text:'reported'}
                ]}/>
                <FormButton text={loading? 'Creando ...':'Crear metodo de pago'} loading={loading} disabled={disabled}/>
            </form>
        </div>
    )
}