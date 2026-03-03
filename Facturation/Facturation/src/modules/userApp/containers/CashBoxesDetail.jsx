import { useEffect, useState } from "react"
import { useAlert, useAppInfo, useNotifications } from "../../../context/context";
import { postInfo } from "../../../utils/functions";
import { useParams } from "react-router-dom";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { PathLocation } from "../components/PathLocation";
import './CashBoxesDetail.css'
import { LabelValue } from "../components/LabelValue";
import { LoadingSpace } from "./LoadingSpace";
import { CashRegisterReport } from "./reports/CashRegisterReport";

export function CashBoxesDeetail(){

    // requierements
    const params = useParams();
    const {popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const [info,setInfo] = useState({});
    const [lastRegister,setLastRegister] = useState({});
    const {appInfo,userConfig,userInfo} = useAppInfo();
    
    // Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // utils functions
    
    const formatDate = (date)=>{
        if(date != undefined){
            let x = date.split('T');
            let newDate = `${x[0]}`;
            newDate += ` ${x[1].substring(0,5)}`
            return newDate;
        }
        return `--/--/--`
    }

    // getters of info
    
    const getCashBoxInfo = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/facturation/getCashBoxes',{
            company_id:appInfo.company_id,
            id:params.cashBox_id
        })
        if(res[0]){
            setInfo(res[1][0]);
            getLastRegisterShift();
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getCashBoxInfo();
    },[])


    const getLastRegisterShift= async()=>{
        let res = await postInfo('/facturation/getRegisterShift',{
            company_id:appInfo.company_id,
            cashBox_id:params.cashBox_id,
            limit:1
        })
        console.log(res);
        setLastRegister(res[1][0]);
    };

        // Functions for controll the status od the cash register
        
        const openCashRegister = async()=>{
            if(lastRegister.status == 'open'){
                console.warn('Ya esta abierta una instancia')
                addNotification({
                    type:'error',
                    title:`Error al abrir la caja ${info.name}`,
                    description:`Ya hay una instancia abierta para ${info.name}`
                });
                return;
            }
            setDisabled(true);
            setLoading(true);
            const nowDate = new Date();
            const offset = nowDate.getTimezoneOffset() * 60000;
            const localISOTime = new Date(nowDate - offset).toISOString().slice(0, 19);
            let res = await postInfo('/facturation/openCashRegister',{
                company_id:appInfo.company_id,
                cashBox_id:params.cashBox_id,
                user_id:userInfo.user_id,
                opening_time:localISOTime
            })
            if(res.status){
                addNotification({
                    type:'aproved',
                    title:`Se abrio la caja ${info.name} exitosamente`,
                    description:`Se abrio correctamente la caja ${info.name}`
                })
            }
            setLoading(false);
            setDisabled(false);
            getCashBoxInfo();
        }

        const closeCashRegister = async()=>{
            setDisabled(true);
            setLoading(true)
            let res = await postInfo('/facturation/closeCashRegister',{
                company_id:appInfo.company_id,
                id:lastRegister.id
            });
            if(res.status){
                addNotification({
                    type:'aproved',
                    title:`Se cerro la caja ${info.name} exitosamente`,
                    description:`Se cerro correctamente la caja ${info.name}`
                })
            }
            getCashBoxInfo();
            setLoading(false);
            setDisabled(false);
        }

        const generateReportCashRegister = ()=>{
            popInAlert(<CashRegisterReport shift_id={lastRegister.id} />);
        }

    return(
        <div className="CashBoxesDeetail">
                {!loading && (<div className="CashBoxesDeetailC">
                    <div className="headS">
                        <PathLocation/>
                        <BoldTitle text={info.name}/>
                        <DescriptionSpan text={info.description}/>
                    </div>
                    <div className="optionsCashBox">
                        <div className="CashBoxOption">
                            {lastRegister.id != undefined && (
                                <div className="lastInstanceInfo">
                                    <h5>Información</h5>
                                    <LabelValue title={'Saldo inicial'} value={<span>{lastRegister.initialBalance != undefined ? (lastRegister.initialBalance):0}</span>}/>
                                    <LabelValue title={'Saldo actual'} value={<span>{lastRegister.initialBalance != undefined? (lastRegister.actual_balance):0}</span>}/>
                                    <LabelValue title={'Diferencia'} value={<span>{lastRegister.initialBalance != undefined ? (lastRegister.diference):0}</span>}/>
                                    <LabelValue title={'Fecha de apertura'} value={<span>{formatDate(lastRegister.opening_time)}</span>}/>
                                    <LabelValue title={'Fecha de cierre'} value={<span>{formatDate(lastRegister.closing_time)}</span>}/>
                                    <LabelValue title={'Estado'} value={<span>{lastRegister.status}</span>}/>
                                </div>
                            )}
                            {lastRegister.id == undefined && (
                                <span>No hay info disponible</span>
                            )}
                        </div>
                        <div className={`CashBoxOption 
                            ${lastRegister.status == 'open'? 'DisabledCashCard':''}
                        `} onClick={()=>{
                            openCashRegister();
                        }}>
                            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1769627888/Gemini_Generated_Image_mjegonmjegonmjeg-2_nmyqul.png" alt="" />
                            <strong className="ttlImg">Abrir caja</strong>
                        </div>
                        <div className={`CashBoxOption 
                                ${lastRegister.status != 'open'? 'DisabledCashCard':''}
                            `} onClick={()=>{
                                closeCashRegister();
                            }}>
                            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1769628055/Gemini_Generated_Image_ddi13yddi13yddi1-2_cehfsk.png" alt="" />
                            <strong className="ttlImg">Cerrar caja</strong>
                        </div>
                        <div className={`CashBoxOption `} onClick={()=>{
                                generateReportCashRegister();
                            }}>
                            <img src="https://res.cloudinary.com/djjxugmni/image/upload/v1769628329/Gemini_Generated_Image_8f3lkr8f3lkr8f3l-2_awzvoa.png" alt="" />
                            <strong className="ttlImg">Generar informe de cierre de caja</strong>
                        </div>
                    </div>
                </div>)}
                {loading && (
                    <LoadingSpace title={'Cargando información de la caja'} description={'Esto no debe tardar mucho.'}/>
                )}
        </div>
    )
}