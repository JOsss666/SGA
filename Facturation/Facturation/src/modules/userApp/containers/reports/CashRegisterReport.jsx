import { useEffect, useRef, useState } from "react";
import { parseToCsv, parseToXlsx, postInfo } from "../../../../utils/functions";
import './CashRegisterReport.css'
import { BoldTitle } from "../../components/BoldTitle";
import { useAlert, useAppInfo } from "../../../../context/context";
import { DescriptionSpan } from "../../components/DescriptionSpan";
import { TagIndicator } from "../../components/TagIndicator";
import { MoreOptions } from "../../components/MoreOptions";
import { LoadingSpace } from "../LoadingSpace";
import { FormInput } from "../../components/FormInput";
import { ButtonMenu } from "../../components/ButtonMenu";
import { useReactToPrint } from "react-to-print";
import { parseCashBoxeToXlsx } from "../../../../utils/functions";
import { useParams } from "react-router-dom";
import { ProcessStatusAlert } from "../Alerts/ProcessStatusAlert";

export function CashRegisterReport({shift_id}){

    const containerReport = useRef();

    // Requirements
    const params = useParams();
    const {popInAlert} = useAlert();
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const [reportInfo,setReportInfo] = useState([]);
    const [cashBoxInfo,setCashBoxInfo] = useState({});
    const [shiftInfo,setShiftInfo] = useState({});
    const nowDate = new Date();
    const offset = nowDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nowDate - offset).toISOString().slice(0, 19);
    const [total,setTotal] = useState(0);
    const [totalMinorExpenses,setTotalMinorExpenses] = useState(0);

    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [hiddeToPrint,setHideToPrint] = useState(false);
    
    // Utils functions

    const reportRef = useRef(null);

    const formatDate = (date)=>{
        if(date != undefined){
            let x = date.split('T');
            let newDate = `${x[0]}`;
            newDate += `    ${x[1].substring(0,5)}`
            return newDate;
        }
        return `--/--/--`
    }

    // 2. Configuramos el hook
    const handlePrint = useReactToPrint({
        // Aquí es donde la librería te pide el 'contentRef'
        contentRef: reportRef, 
        documentTitle: `SGA 360° Informe cierre de ${cashBoxInfo.name} - ${formatDate(localISOTime)}`,
    });

    useEffect(()=>{
        console.log(containerReport.current)
    },[containerReport.current])

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
        let res = await postInfo('/facturation/getRegisterShift',{
            company_id:appInfo.company_id,
            cashBox_id:shift_id,
            limit:1
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
        if(reportInfo.length > 0){
            let newttl = 0;
            let newMEttl = 0;
            reportInfo.forEach(element => {
                newttl += element.total_db;
                newMEttl += element.total_cr;
            });
            setTotal(newttl);
            setTotalMinorExpenses(newMEttl);
        }
    },[reportInfo])

    useEffect(()=>{
        generateReportCashRegister();
        getShiftInfo()
    },[])

    useEffect(()=>{
        console.log(reportInfo);
    },[reportInfo])

    return(
        <div className="CashRegisterReport" ref={reportRef}>
            {!loading && (
                <>
                    <div className="headReport">
                    <div className="ttlreport">
                        <BoldTitle text={`Cierre de ${cashBoxInfo.name}`}/>
                        <DescriptionSpan text={`SGA - ${appInfo.legal_name}`}/>
                    </div>
                    {!hiddeToPrint && (
                        <div className="printButton">
                            <MoreOptions children={<i className="fa-solid fa-print"/>} options={[
                                {
                                    text:'.pdf',
                                    icon:<i className="fa-solid fa-file-pdf"/>,
                                    action:handlePrint
                                },
                                {
                                    text:'.xlsx',
                                    icon:<i className="fa-solid fa-file-excel"/>,
                                    action:()=>parseCashBoxeToXlsx(
                                        reportInfo,
                                        `SGA 360° Informe cierre de ${cashBoxInfo.name} - ${formatDate(localISOTime)}`
                                    )
                                },
                                {
                                    text:'.csv',
                                    icon:<i className="fa-solid fa-file-csv"/>,

                                    // [CAMBIO] ahora se pasan los datos y el nombre del archivo
                                    action:()=>parseToCsv(
                                        reportInfo,
                                        true,
                                        `SGA 360° Informe cierre de ${cashBoxInfo.name} - ${formatDate(localISOTime)}`
                                    )
                                }
                            ]}/>
                            <ButtonMenu title={'Descargar'}>
                                <i className="fa-solid fa-file-arrow-down"/>
                            </ButtonMenu>
                            <ButtonMenu title={'Compartir'}>
                                <i className="fa-solid fa-arrow-up-from-bracket"/>
                            </ButtonMenu>
                        </div>
                    )}
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
                                <div className={`attachedTrsContainer`}>
                                    {element.attached_trs != undefined && element.attached_trs.map((element,index)=>(
                                        <div  className={`transactionLine ${element.nature == 'CR'? 'negativeTrans':''}`} key={index}>
                                            {element.process_code != undefined && (
                                                <strong className="idHolder" onClick={()=>{
                                                    popInAlert(<ProcessStatusAlert instance_id={element.instance_id}/>)
                                                }}>{`${element.process_code}#${element.instance_serial}`}</strong>
                                            )}
                                            <strong className="idHolder" onClick={()=>{
                                                window.open(`https://facturation.sga360.co/preview/Document/${params.company_key}/${element.doc_id}`,'_blank','noopener,noreferrer')
                                            }}>
                                                {`${element.doc_type}#${element.ownSerial}`}
                                            </strong>
                                            <span>{element.concept_name}</span>
                                            <strong>{element.thirdparty_name}</strong>
                                            <span>Sub-total: $ {element.nature == 'CR'? '-':''}{formatCurrency(element.subTotal)}</span>
                                            <span>Total: $ {element.nature == 'CR'? '-':''}{formatCurrency(element.subTotal)}</span>
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
                        <div className="signatureContainer">
                            <div className="resumeTotalsC">
                                {reportInfo != undefined && reportInfo.map((element,index)=>(
                                    <div key={index} className="signature">
                                        <span>{element.paymentMethod_name}:</span>
                                        <strong>$ {formatCurrency(element.net_balance)}</strong>
                                    </div>
                                ))}
                                <div className="signature">
                                    <h5>
                                        <i className="fa-solid fa-list-check"/>
                                        GASTOS MENORES
                                    </h5>
                                    <strong>$ {formatCurrency(totalMinorExpenses)}</strong>
                                </div>
                                <div className="signature">
                                    <h5>
                                        <i className="fa-solid fa-angles-right"/>
                                        ::. VALOR TOTAL
                                    </h5>
                                    <strong>$ {formatCurrency(total)}</strong>
                                </div>
                            </div>
                            
                            <div className="signature">
                                <span>Nombre de Cajero u operador:</span>
                                <strong>{shiftInfo.responsable}</strong>
                            </div>
                            <div className="signature">
                                <span>Firma</span>
                                <strong>__________________</strong>
                            </div>
                            <FormInput textArea={true} placeholder={'Observaciones del cierre'} title={'Observaciones'}/>
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