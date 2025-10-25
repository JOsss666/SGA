import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { moneyFormat, postInfo } from "../../../../utils/functions";
import { BoldTitle } from "../../components/BoldTitle";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { FormButton } from "../../components/FormButton";
import { LabelValue } from "../../components/LabelValue";
import { TagIndicator } from "../../components/TagIndicator";
import { UserCard } from "../../components/UserCard";
import './FormNewOperation.css'
import { LoadingSpace } from "../LoadingSpace";

export function FormNewOperation({info}){
    const {addNotification} = useNotifications();
    const {popOutAlert} = useAlert();
    const {appInfo,userInfo} = useAppInfo();
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [transaction_id,setTransId] = useState()
    const [taxes,setTaxes] = useState([false]);
    const [total,setTotal] = useState(0)
    const [transactionDetails,setTransactionDetails] = useState([]);
    const [doc_date,setdocDate] = useState('2025/09/23')
    const [conceptInfo,setConceptinfo] = useState({});
    const [loadingCractionTransaction,setloadingCractionTransaction] = useState(false);

    const formInfo = {
            user_id:userInfo.user_id,
            company_id:appInfo.company_id,
            store_id:1,
            concept_id:info.concept_id,
            doc_date,
            transactionDetails,
            doc_type:info.doc_type,
            doc_id:info.doc_id,
            subtotal:info.value,
            total
    }

    const getConceptInfo = async()=>{
        let res  = await postInfo('/getConcepts',{
            id:info.concept_id,
            company_id:appInfo.company_id,
            typePlanAccount:appInfo.accountPlanType
        })
        console.log(res);
        if(res[0]){
            setConceptinfo(res[1][0])
        }else{
            setConceptinfo({})
        }
    }

    const getAttachedTaxes = async()=>{
        console.log('Cargando Impuestos');
        let res = await postInfo('/getTaxes',{
            company_id:appInfo.company_id,
            attached:true,
            typePlanAccount:appInfo.account_type,
            concept_id:info.concept_id
        })
        console.log(res);
        if(res[0]){
            setTaxes(res[1])
        }else{
            setTaxes([])
        }
    }

    const createTransaction = async()=>{
        console.log('Creando transacción -->')
        setloadingCractionTransaction(true)
        setDisabled(true);
        console.log('Creando nueva transacción',formInfo);
        let res = await postInfo('/createTransaction',formInfo);
        if(res[0]){
            setTransId(res[1])
            setDisabled(false);
        }
        setloadingCractionTransaction(true)
        setLoading(false);
    }

    const pushDetailsTrans = ()=>{
        const dicNatureDocs = {'DC':'DB','FV':'CR','FE':'CR','NC':'CR','ND':'DB'}
        let newTransDetails = [];
        console.log(info)
        console.log(taxes)
        console.log(conceptInfo)
        newTransDetails.push({
                account_id:conceptInfo.account_id,
                account_type:appInfo.accountPlanType,
                type:'operation',
                subtotal:info.value,
                total:info.value,
                nature:dicNatureDocs[info.doc_type]
        })
        taxes.forEach(element => {
                newTransDetails.push({
                account_id:element.account_id,
                account_type:appInfo.accountPlanType,
                type:'tax',
                subtotal:info.value,
                total: info.value * Number(((element.rate/100)).toFixed(2)),
                nature:element.nature
            })
        });
        let paymentMethod = info.paymentMethod;
        newTransDetails.push({
            account_id:paymentMethod.account_id,
            account_type:appInfo.accountPlanType,
            type:'payment',
            subtotal:info.value,
            total:total,
            nature:paymentMethod.nature == 'D' || paymentMethod.nature == 'DB' ? 'DB':'CR'
        })
        console.log(newTransDetails);
        setTransactionDetails(newTransDetails);
    }

    const getFormData = async()=>{
        setLoading(true);
        setDisabled(true);
        getConceptInfo();
        await getAttachedTaxes();
    }

    const updateStateTransasction = async(newStatus)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/updateTransactionState',{
            status:newStatus,
            transaction_id
        })
        if(res[0] && res[1]){
            if(newStatus != 'cancelled'){
                addNotification({
                    type:'aproved',
                    title:`Transacción TR#${transaction_id} aprovada`,
                    description:`La transacción TR#${transaction_id} por un valor de $ ${moneyFormat(formInfo.total)} fue guardada exitosamente.`
                })
            }else{
                addNotification({
                    type:'error',
                    title:`Transacción TR#${transaction_id} cancelada`,
                    description:`Se cancelo la transacción TR#${transaction_id} por un valor de $ ${moneyFormat(formInfo.total)}.`
                })
            }
            popOutAlert();
        }else{
            addNotification({
                type:'error',
                title:`Error al aprovar Transacción TR#${transaction_id} `,
                description:`No se puedo aprovar la transacción TR#${transaction_id} por un valor de $ ${moneyFormat(formInfo.total)}, actualmente es un borrador, intentelo de nuevo.`
            })
        }
        setLoading(false)
        setDisabled(false)
    }

    useEffect(()=>{
        if(taxes[0] != false){
            let newTotal = info.value;
            taxes.forEach(element => {
                newTotal += info.value * Number((element.rate/100).toFixed(2));
            });
            pushDetailsTrans();
            setTotal(newTotal);
        }
    },[taxes])

    useEffect(()=>{
        if(transactionDetails.length >0 && !loadingCractionTransaction){
            createTransaction();
        }
    },[transactionDetails])

    useEffect(()=>{
        getFormData();
    },[])

    if(!loading){
        return(
                <div className="FormNewOperation">
                    <div className="headForm">
                        <BoldTitle text={'COMPROBANTE'}/>
                        <TagIndicator title={`#${transaction_id}`} type={'indicator'}/>
                        <span className="dateDoc">22/09/2025</span>
                    </div>
                    <div className="bodyForm">
                        <section className="FormSec flex_valuesSec">
                            <h4 className="secFormTtl">Información documento</h4>
                            <LabelValue title={'Cliente / Proveedor'} value={
                                <UserCard name={'José murillo'} desc={'Cliente'} />
                            }/>
                            <LabelValue title={'Tipo Documento'} value={`Compra (${info.doc_type})`}/>
                            <LabelValue title={'Estado'} value={'Pendiente de aprovación'}/>
                            <LabelValue title={'Concepto'} value={`SGA#${conceptInfo.id} - ${conceptInfo.name}`}/>
                        </section>
                        <section className="FormSec ">
                            <h4 className="secFormTtl">Información movimiento</h4>
                            <LabelValue title={'Sub Total'} value={`$ ${moneyFormat(info.value)}`}/>
                            {taxes[0] != false && taxes.map((element,index)=>(
                                <LabelValue title={element.name} value={`$ ${moneyFormat((info.value * (element.rate/100).toFixed(2)))}`} key={index}/>
                            ))}
                        </section>
                        <section className="FormSec submitSec">
                            <LabelValue title={'Total'} value={`$ ${moneyFormat(total)}`}/>
                            <FormButton disabled={disabled} onClick={()=>{
                                updateStateTransasction('posted');
                            }} text={'Guardar Documento'}/>
                            <FormButton disabled={disabled} onClick={()=>{
                                updateStateTransasction('cancelled');
                            }} negative={true} text={'Cancelar'}/>
                        </section>
                    </div>
                </div>
            )
    }else{
        return(
            <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho...'} />
        )
    }
}