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
import { NewElementSelect } from "../../components/NewElementSelect";
import { FormNewThirdParties } from "./FormNewThirdParties";

let creationLock = {
    isTriggered: false,
    lastInstanceId: null
};

export function FormSelectNewProcess (){

    // Requierements
    const {popInAlert,popOutAlert} = useAlert();
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const [aviableProcess,setAviableProcess] = useState([]);
    const [thirdparties,setThirdParties] = useState([]);

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
    const [thirdParty_id,setThirdParty_id] = useState();
    
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
            if(res[1].length === 1 && !creationLock.isTriggered) {
                creationLock.isTriggered = true; // Bloqueo global inmediato
                await createProcessInstance(res[1][0]);
            }
        }
        setLoading(false);
        setDisabled(false);
    }

     const getThirdParties = async()=>{
        let res = await postInfo('/getThirdParties',{company_id:appInfo.company_id});
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.names}  ${element.indentification_type}_${element.indentification_number}`,
                    value:element.id
                })
            });
            setThirdParties(C);
        }
    }

    const createProcessInstance = async(element)=>{
        setDisabled(true);
        setLoading(true);
        // Doble verificación por seguridad
        if (creationLock.lastInstanceId) return;
        let res = await postInfo('/process/createProcessInstace',{
            company_id:appInfo.company_id,
            process_id:element.id,
            step_id:element.steps[0].id,
            status:'pending', 
            parent_id:undefined, 
            parent_step:undefined,
            thirdParty_id
        });
        console.log(res)
        if(res.id != undefined){
            console.log('Estancia de proceso creado');
            creationLock.lastInstanceId = res.id;
            let getInfoNewInstance = await postInfo('/process/getProcessState',{
                company_id:appInfo.company_id,
                id:res.id
            });
            console.log(getInfoNewInstance);
            if(getInfoNewInstance[0]){
                setNewInstanceInfo(getInfoNewInstance[1][0]);
                await getThirdParties();
            }
            setFormStep(1);
        }else{
            creationLock.isTriggered = false;
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
            id:newInstanceInfo.id,
            thirdParty_id
        });
        await popOutAlert();
        if(res[0]){
            console.log('Intancia de proceso confirmada');
            if(newInstanceInfo.steps[0].required_docs.length > 0){
                console.log('Abriendo con tipo',newInstanceInfo.steps[0].required_docs[0].docType)
                popInAlert(<SelectTpeNewDoc info={
                    {   instance_id:newInstanceInfo.id,
                        step_id:newInstanceInfo.step_id,
                        thirdParty_id
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
                        <SearchinList action={setThirdParty_id} title={'Cliente'} placeHolder={'Seleccione el cliente'} list={thirdparties} disabled={disabled} specialOption={
                            <NewElementSelect title={'Crear nuevo'} onClick={()=>{
                                popInAlert(<FormNewThirdParties reloadFun={getThirdParties}/>)
                            }}/>
                        }/>
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