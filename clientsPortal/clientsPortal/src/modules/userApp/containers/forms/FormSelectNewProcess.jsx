import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import './FormSelectNewProcess.css'
import { LoadingSpace } from "../LoadingSpace";
import { FormInput } from "../../components/FormInput";
import { FormButton } from "../../components/FormButton";
import { SelectTpeNewDoc } from "./SelectTypeNewDoc";

let creationLock = {
    isTriggered: false,
    lastInstanceId: null
};

export function FormSelectNewProcess (){

    // Requierements
    const {addNotification} = useNotifications();
    const {popInAlert,popOutAlert} = useAlert();
    const {appInfo,userInfo} = useAppInfo();
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
    const [name,setName] = useState('');
    const thirdParty_id = userInfo.user_id;
    
    const getAviableProcess = async()=>{
        setDisabled(true)
        setLoading(true);
        let res = await postInfo('/process/getAviableProceses',{
            company_id:appInfo.company_id,
            // En el portal externo el rol/config vienen del responsable interno
            // (el tercero no tiene users_config), así que resolvemos el filtro con su id.
            user_id:userInfo.responsable,
            alloweProcesses:undefined
        })
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

    const createProcessInstance = async(element)=>{
        setDisabled(true);
        setLoading(true);
        try {
            let res = await postInfo('/process/createProcessInstace',{
                company_id:appInfo.company_id,
                process_id:element.id,
                step_id:element.steps[0].id,
                status:'pending', 
                parent_id:undefined, 
                parent_step:undefined,
                thirdParty_id,
                user_id:userInfo.responsable,
                external_access:true,
                company_key:appInfo.company_key,
                access_key:userInfo.user_key
            });
            if(res.id != undefined){
                creationLock.lastInstanceId = res.id;
                let getInfoNewInstance = await postInfo('/process/getProcessState',{
                    company_id:appInfo.company_id,
                    id:res.id
                });
                if(getInfoNewInstance[0]){
                    setNewInstanceInfo(getInfoNewInstance[1][0]);
                }
                setFormStep(1);
                creationLock.isTriggered =false;
            }else{
                creationLock.isTriggered = false;
            }
        } catch (error) {
            addNotification({ type:'error', title:'No se pudo crear la instancia', description:error.message ?? error.error ?? 'Revisa el responsable del acceso externo.' });
        } finally {
            creationLock.isTriggered = false;
            setLoading(false);
            setDisabled(false);
        }
    }

    const updateProcessInstance = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/updateProcessInstanceStatus',{
            company_id:appInfo.company_id,
            start_date,
            name,
            delivery_date,
            status:'active',
            id:newInstanceInfo.id,
            user_id:userInfo.responsable,
            external_access:true,
            company_key:appInfo.company_key,
            access_key:userInfo.user_key,
            thirdParty_id
        });
        creationLock.isTriggered = false;
        await popOutAlert();
        if(res[0]){
            openRequiredDocsQueue(newInstanceInfo.steps?.[0]?.required_docs, {
                instance_id: newInstanceInfo.id,
                step_id: newInstanceInfo.step_id,
                thirdParty_id
            });
        }
        setLoading(false);
        setDisabled(false);
    }

    // Abre en cola los documentos requeridos del paso inicial: al completar uno
    // (endProcess -> reloadFun), se abre el siguiente hasta agotar la lista.
    const openRequiredDocsQueue = (docs, baseInfo) => {
        const queue = Array.isArray(docs) ? docs.filter(Boolean) : [];
        if (queue.length === 0) return;

        const openAt = (index) => {
            if (index >= queue.length) return; // cola completada
            const reqDoc = queue[index];
            popInAlert(
                <SelectTpeNewDoc
                    info={baseInfo}
                    docType={reqDoc.docType}
                    paramdocId={reqDoc.paramdoc_id}
                    reloadFun={() => openAt(index + 1)}
                />
            );
        };

        openAt(0);
    }

    const cancellProcess = async()=>{
        let res = await postInfo('/process/updateProcessInstanceStatus',{
            company_id:appInfo.company_id,
            start_date,
            delivery_date,
            status:'cancelled',
            id:newInstanceInfo.id,
            user_id:userInfo.responsable,
            external_access:true,
            company_key:appInfo.company_key,
            access_key:userInfo.user_key,
            thirdParty_id
        });
        creationLock.isTriggered = false;
        creationLock.lastInstanceId = null;
        await popOutAlert();
        if(res[0]){
            addNotification({
                type:'error',
                title:`${newInstanceInfo.process_code}#${newInstanceInfo.ownSerial} cancelado`,
                description:`La instancia de proceso ${newInstanceInfo.process_code}#${newInstanceInfo.ownSerial} fue cancelada correctamente.`
            })
        }
    }


    useEffect(()=>{
        getAviableProcess();
    },[]);

    useEffect(()=>{
    },[creationLock])

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
                        <FormInput title={'Fecha de inicio'} type={'datetime-local'} disabled={disabled} value={start_date} action={setStart_date} />
                        <FormInput title={'Fecha de entrega'} type={'datetime-local'} disabled={disabled} value={delivery_date} action={setDelivery_date} />
                        <FormInput title={'Nombre o referencia del proceso'} placeholder={'Nombre o descripción para identificar proceso'} disabled={disabled} action={setName}/>
                        <FormButton text={`Confirmar ${newInstanceInfo.process_code}#${newInstanceInfo.ownSerial}`} onClick={()=>{
                            updateProcessInstance();
                        }}/>
                        <FormButton text={`Cancelar`} negative={true} onClick={()=>{
                            cancellProcess();
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