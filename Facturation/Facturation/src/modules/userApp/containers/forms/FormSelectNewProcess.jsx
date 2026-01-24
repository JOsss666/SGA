import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo } from "../../../../context/context";
import './FormSelectNewProcess.css'
import { LoadingSpace } from "../LoadingSpace";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import { FormButton } from "../../components/FormButton";
import { SelectTpeNewDoc } from "./SelectTypeNewDoc";

export function FormSelectNewProcess (){

    // Requierements
    const {popInAlert,popOutAlert} = useAlert();
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const [aviableProcess,setAviableProcess] = useState([]);

    //control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [formStep,setFormStep] = useState(0);
    const [newInstanceInfo,setNewInstanceInfo] = useState({});

    // formInfo stage 2
    const today = new Date().toISOString().split('T')[0];
    const [start_date,setStart_date] = useState(today);
    const [delivery_date,setDelivery_date] = useState();
    const [statusNewInstance,setStatusNewInstance] = useState('active');
    
    const getAviableProcess = async()=>{
        setDisabled(true)
        setLoading(true);
        let res = await postInfo('/process/getAviableProceses',{
            company_id:appInfo.company_id,
            alloweProcesses:undefined
        })
        console.log(res);
        if(res[0]){
            setAviableProcess(res[1]);
        }
        setLoading(false);
        setDisabled(false);
    }

    const createProcessInstance = async(element)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/createProcessInstace',{
            company_id:appInfo.company_id,
            process_id:element.id,
            step_id:element.steps[0].id,
            status:'pending', 
            parent_id:undefined, 
            parent_step:undefined
        });
        console.log(res)
        if(res.id != undefined){
            console.log('Estancia de proceso creado');
            let getInfoNewInstance = await postInfo('/process/getProcessState',{
                company_id:appInfo.company_id,
                id:res.id
            });
            console.log(getInfoNewInstance);
            if(getInfoNewInstance[0]){
                setNewInstanceInfo(getInfoNewInstance[1][0]);
            }
            setFormStep(1);
        }
        setLoading(false);
        setDisabled(false);
    }

    const updateProcessInstance = async()=>{
        let res = await postInfo('/process/updateProcessInstanceStatus',{
            company_id:appInfo.company_id,
            start_date,
            delivery_date,
            status:statusNewInstance,
            id:newInstanceInfo.id
        });
        console.log(res)
        if(res[0]){
            console.log('Intancia de proceso confirmada');
            if(newInstanceInfo.steps[0].required_docs.length > 0){
                console.log('Abriendo con tipo',newInstanceInfo.steps[0].required_docs[0].docType)
                popInAlert(<SelectTpeNewDoc info={
                    {instance_id:
                        newInstanceInfo.id,
                        step_id:newInstanceInfo.step_id
                    }
                } docType={
                    newInstanceInfo.steps[0].required_docs[0].docType
                }/>)
            }
        }
    }

    useEffect(()=>{
        getAviableProcess();
    },[]);

    return(
        <div className="FormSelectNewProcess">
            {!loading && formStep == 0 && (
                <>
                    <BoldTitle text={'Seleccione el proceso'}/>
                    <div className="aviableProcessGrid">
                        {aviableProcess.map((element,index)=>(
                            <div onClick={()=>{
                                createProcessInstance(element)
                            }} key={index} className="aviableProcessCard">
                                <img src={element.img} alt="" />
                                <div className="infoProcess">
                                    <strong>{element.name}</strong>
                                    <span>{element.description}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {!loading && formStep == 1 && (
                <>
                    <BoldTitle text={`Confirmación de ${newInstanceInfo.process_code}#${newInstanceInfo.ownSerial}`}/>
                    <form className="formProcessConfirmartion" action="" onSubmit={(e)=>{
                        e.preventDefault();
                    }}>
                        <FormInput title={'Fecha de inicio'} type={'date'} disabled={disabled} value={start_date} action={setStart_date} />
                        <FormInput title={'Fecha de entrega'} type={'date'} disabled={disabled} value={delivery_date} action={setDelivery_date} />
                        <SearchinList title={'Estado'} placeHolder={'Seleccione el estado'} action={setStatusNewInstance} disabled={disabled} list={[
                            {text:'Activo',value:'active'},
                            {text:'Pendiente',value:'pending'},
                            {text:'Cancelado',value:'cancelled'},
                            {text:'Bloqueado',value:'blocked'},
                            {text:'Reportado',value:'reported'}
                        ]}/>
                        <FormButton text={`Confirmar ${newInstanceInfo.process_code}#${newInstanceInfo.ownSerial}`} onClick={()=>{
                            updateProcessInstance();
                        }}/>
                    </form>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}