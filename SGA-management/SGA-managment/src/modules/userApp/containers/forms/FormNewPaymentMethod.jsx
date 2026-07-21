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
    const [accounts,setAccounts] = useState([]);

    // FormInfo
    const [name,setName] = useState('');
    const [account_id,setAccount_id] = useState();
    const [code,setCode] = useState('');
    const [currency,setCurrency] = useState('COP');
    const [type,setType] = useState('');
    const [facturation_code,setFacturation_code] = useState('');
    const [status,setStatus] = useState('active');

    // utils

    const formInfo = {
        company_id:appInfo.company_id,
        name,
        account_id,
        code,
        currency,
        type,
        status,
        facturation_code
    }

    const paymentMethods = [
        {
            text: "Efectivo",
            value: { value: "10", text: "Efectivo", type: "cash" }
        },
        {
            text: "Consignación bancaria",
            value: { value: "42", text: "Consignación bancaria", type: "bank_transfer" }
        },
        {
            text: "Transferencia Débito Bancaria",
            value: { value: "47", text: "Transferencia Débito Bancaria", type: "bank_transfer" }
        },
        {
            text: "Transferencia Débito Bancaria (ACH)",
            value: { value: "31", text: "Transferencia Débito Bancaria (ACH)", type: "bank_transfer" }
        },
        {
            text: "Tarjeta de Crédito",
            value: { value: "48", text: "Tarjeta de Crédito", type: "credit_card" }
        },
        {
            text: "Tarjeta de Débito",
            value: { value: "49", text: "Tarjeta de Débito", type: "debit_card" }
        },
        {
            text: "Cheque",
            value: { value: "20", text: "Cheque", type: "check" }
        },
        {
            text: "Cheque certificado",
            value: { value: "25", text: "Cheque certificado", type: "check" }
        },
        {
            text: "Nota promisoria",
            value: { value: "61", text: "Nota promisoria", type: "cash_onDelivery" }
        },
        {
            text: "Bonos",
            value: { value: "71", text: "Bonos", type: "balances favor" }
        },
        {
            text: "Vales",
            value: { value: "72", text: "Vales", type: "balances favor" }
        },
        {
            text: "Instrumento no definido",
            value: { value: "1", text: "Instrumento no definido", type: "cash" }
        },
        {
            text: "Otro",
            value: { value: "ZZ", text: "Otro", type: "cash" }
        }
    ];


    // Utils functions

    const handleSelectPaymentMethod = (element)=>{
        setType(element.type)
        setFacturation_code(element.value)
    }

    // getters of info
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


    // Creation function
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
                console.log(formInfo)
                createPaymentMehtod();
            }}>
                <FormInput title={'Nombre'} action={setName} placeholder={'Nombra tu metodo de pago'} disabled={disabled}/>
                <FormInput title={'Codigo'} action={setCode} placeholder={'#...'} disabled={disabled}/>
                <SearchinList disabled={disabled} action={setAccount_id} title={'Cuenta'} list={accounts} placeHolder={'Seleccionar Cuenta'} specialOption={
                    <NewElementSelect title={'Crear nueva cuenta'} onClick={()=>{popInAlert(<span>Formulario nueva cuenta</span>)}}/>
                }/>
                <SearchinList title={'Tipo de metodo de pago'} placeHolder={'Seleccionar opción'} disabled={disabled} action={handleSelectPaymentMethod} list={paymentMethods}/>
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