import { useEffect, useState } from "react";
import { useAppInfo } from "../../../../context/context";
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

    const {appInfo,userInfo} = useAppInfo();
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [taxes,setTaxes] = useState([]);
    const [total,setTotal] = useState(0)
    const [doc_date,setdocDate] = useState('')
    const [conceptInfo,setConceptinfo] = useState({});

    const formInfo = {
            user_id:userInfo.user_id,
            company_id:appInfo.company_id,
            store_id:1,
            concept_id:info.concept_id,
            doc_date,
            doc_type:info.doc_type,
            doc_id:info.doc_id,
            subtotal:info.value,
            total
    }

    const getConceptInfo = async()=>{
        setLoading(true);
        setDisabled(true);
        let res  = await postInfo('/getConcepts',{
            id:info.concept_id,
            company_id:appInfo.company_id
        })
        console.log(res);
        if(res[0]){
            setConceptinfo(res[1][0])
        }else{
            setConceptinfo({})
        }
        setDisabled(false);
        setLoading(false);
    }

    const getAttachedTaxes = async()=>{
        console.log('Cargando Impuestos');
        let res = await postInfo('/getTaxes',{
            company_id:appInfo.company_id,
            attached:true,
            typePlanAccount:appInfo.account_type,
            concept_id:info.concept_id
        })
        console.log(res)
        if(res[0]){
            setTaxes(res[1])
        }else{
            setTaxes([])
        }
    }

    const getFormData = async()=>{
        getConceptInfo();
        getAttachedTaxes();
    }

    useEffect(()=>{
        let newTotal = info.value;
        taxes.forEach(element => {
            newTotal += info.value * (element.rate/100).toFixed(2)
        });
        setTotal(newTotal);
    },[taxes])

    useEffect(()=>{
        getFormData();
    },[])

    if(!loading){
        return(
                <div className="FormNewOperation">
                    <div className="headForm">
                        <BoldTitle text={'COMPROBANTE'}/>
                        <TagIndicator title={'#3016'} type={'indicator'}/>
                        <span className="dateDoc">22/09/2025</span>
                    </div>
                    <div className="bodyForm">
                        <section className="FormSec flex_valuesSec">
                            <h4 className="secFormTtl">Información documento</h4>
                            <LabelValue title={'Cliente / Proveedor'} value={
                                <UserCard name={'José murillo'} desc={'Cliente'} />
                            }/>
                            <LabelValue title={'Tipo Documento'} value={'Compra (DC)'}/>
                            <LabelValue title={'Estado'} value={'Pendiente de aprovación'}/>
                            <LabelValue title={'Concepto'} value={`SGA#${conceptInfo.id} - ${conceptInfo.name}`}/>
                        </section>
                        <section className="FormSec ">
                            <h4 className="secFormTtl">Información movimiento</h4>
                            <LabelValue title={'Sub Total'} value={`$ ${moneyFormat(info.value)}`}/>
                            {taxes.map((element,index)=>(
                                <LabelValue title={element.name} value={`$ ${moneyFormat((info.value * (element.rate/100).toFixed(2)))}`} key={index}/>
                            ))}
                        </section>
                        <section className="FormSec submitSec">
                            <LabelValue title={'Total'} value={`$ ${moneyFormat(total)}`}/>
                            <FormButton text={'Guardar Documento'}/>
                            <FormButton negative={true} text={'Cancelar'}/>
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