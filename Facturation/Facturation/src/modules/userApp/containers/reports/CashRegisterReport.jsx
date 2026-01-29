import { useEffect, useState } from "react";
import { postInfo } from "../../../../utils/functions";
import './CashRegisterReport.css'
import { BoldTitle } from "../../components/BoldTitle";
import { useAppInfo } from "../../../../context/context";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { TagIndicator } from "../../components/TagIndicator";
import { LoadingSpace } from "../LoadingSpace";
import { FormInput } from "../../components/FormInput";

export function CashRegisterReport({shift_id}){

    // Requirements
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const [reportInfo,setReportInfo] = useState([]);
    const [cashBoxInfo,setCashBoxInfo] = useState({});
    const [shiftInfo,setShiftInfo] = useState({});
    const nowDate = new Date();
    const offset = nowDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nowDate - offset).toISOString().slice(0, 19);

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    
    // Utils functions

    const formatCurrency = (value) =>
            new Intl.NumberFormat("es-CO").format(value);

    const iconDictionary = {
        cash:<i className="fa-solid fa-money-bill-wave"/>,
        bank_transfer:<i className="fa-solid fa-building-columns"/>,
        debit_card:<i className="fa-regular fa-credit-card"/>,
        credit_card:<i className="fa-regular fa-credit-card"/>,
        digital_wallet:<i className="fa-solid fa-wallet"/>,
        check:<i className="fa-solid fa-file-signature"/>,
        cash_onDelivery:<i className="fa-solid fa-hand-holding-dollar"/>,
        crypto_currency:<i className="fa-brands fa-bitcoin"/>,
        "balances favor":<i className="fa-solid fa-id-card"/>
    }

    const formatDate = (date)=>{
        if(date != undefined){
            let x = date.split('T');
            let newDate = `${x[0]}`;
            newDate += `    ${x[1].substring(0,5)}`
            return newDate;
        }
        return `--/--/--`
    }

     const updatePaymentValue = (id, attTrs) => {
        setReportInfo(prev => 
            prev.map(item => 
                item.paymentMethod_id === id 
                    ? { ...item, ["attached_trs"]: attTrs } 
                    : item
            )
        );
    };

    // Getters of info
    const generateReportCashRegister = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/facturation/getCashRegisterReport',{
            shift_id
        });
        if(res[0]){
            setReportInfo(res[1]);
        }
        console.log(res)
        setLoading(false);
        setDisabled(false);
    }

    const getCashBoxInfo = async(idCashBox)=>{
        let res = await postInfo('/facturation/getCashBoxes',{
            company_id:appInfo.company_id,
            id:idCashBox
        })
        if(res[0]){
            setCashBoxInfo(res[1][0]);
        }
    }

     const getShiftInfo= async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/facturation/getLastRegisterShift',{
            company_id:appInfo.company_id,
            cashBox_id:shift_id
        })
        if(res[0]){
            setShiftInfo(res[1][0]);
            await getCashBoxInfo(res[1][0].cashBox_id)
        }
        setLoading(false);
        setDisabled(false);
    };

    const getAttachedTransactions = async(paymentMethod_id)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/facturation/getTransactionsOfCashRecord',{
            company_id:appInfo.company_id,
            shift_id,
            paymentMethod_id
        })
        console.log(res);
        if(res[0]){
            updatePaymentValue(paymentMethod_id,res[1]);
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        generateReportCashRegister();
        getShiftInfo()
    },[])

    useEffect(()=>{
        console.log(reportInfo);
    },[reportInfo])

    return(
        <div className="CashRegisterReport">
            {!loading && (
                <>
                    <div className="headReport">
                    <div className="ttlreport">
                        <BoldTitle text={`Cierre de ${cashBoxInfo.name}`}/>
                        <DescriptionSpan text={`SGA - ${appInfo.legal_name}`}/>
                    </div>
                    <div className="datesContainer">
                        <div className="dateReport">
                            <span>Feha de inicio</span>
                            <strong>{formatDate(shiftInfo.opening_time)}</strong>
                        </div>
                        <div className="dateReport">
                            <span>Feha de cierre</span>
                            <strong>{formatDate(shiftInfo.closing_time)}</strong>
                        </div>
                    </div>
                    <div className="datesContainer">
                        <div className="dateReport">
                            <span>Responsable</span>
                            <strong>{shiftInfo.responsable}</strong>
                        </div>
                    </div>
                    <div className="datesContainer">
                        <div className="dateReport">
                            <span>Feha de generación</span>
                            <strong>{formatDate(localISOTime)}</strong>
                        </div>
                        <div className="dateReport">
                            <span>Ultima modificación</span>
                            <strong>{formatDate(shiftInfo.updated_at)}</strong>
                        </div>
                    </div>
                </div>
                <div className="contentReport">
                    <div className="movementTotals">
                        {reportInfo.map((element,index)=>(
                            <div className="cardTotalPaymentType" key={index}>
                                <h6>
                                    {iconDictionary[element.paymentMethod_type]}
                                    {element.paymentMethod_name}
                                </h6>
                                <div className="mainInfoOfPayment">
                                    <i className="fa-solid fa-arrow-right-long"/>
                                    
                                    <span>Total esperado 
                                        <b>$ {formatCurrency(element.net_balance)}</b>
                                    </span>
                                </div>
                                {element.attached_trs == undefined && (
                                    <h5 className="loadTransactions" onClick={()=>{getAttachedTransactions(element.paymentMethod_id)}}>
                                        <i className="fa-solid fa-eye"/>
                                        Ver transacciones
                                    </h5>
                                )}
                                <div className="attachedTrsContainer">
                                    {element.attached_trs != undefined && element.attached_trs.map((element,index)=>(
                                        <div  className={'transactionLine'} key={index}>
                                            <strong>{element.doc_type}</strong>
                                            <span>{element.concept_name}</span>
                                            <strong>{element.thirdparty_name}</strong>
                                            <span>Sub-total: $ {formatCurrency(element.subTotal)}</span>
                                            <span>Total: $ {formatCurrency(element.subTotal)}</span>
                                            <span>{formatDate(element.created_at)}</span>
                                            {element.voucher != undefined && (
                                                <span>Voucher/ref: {element.voucher}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="authAndDetails">
                    <div className="authC">
                        <FormInput textArea={true} placeholder={'Observaciones del cierre'} title={'Observaciones'}/>
                        <div className="signatureContainer">
                            <div className="signature">
                                <span>Nombre de Cajero u operador:</span>
                                <strong>{shiftInfo.responsable}</strong>
                            </div>
                            <div className="signature">
                                <span>Firma</span>
                                <strong>__________________</strong>
                            </div>
                        </div>
                    </div>
                </div>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando informe'} description={'Esto no debe tardar mucho...'}/>
            )}
        </div>
    )
}