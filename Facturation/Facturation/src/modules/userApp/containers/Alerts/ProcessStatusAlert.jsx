import { use, useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import './ProcessStatusAlert.css'
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { FormInput } from "../../components/FormInput";
import { LoadingSpace } from "../LoadingSpace";
import { useEffectEvent } from "react";

export function ProcessStatusAlert({instance_id,reloadFun}){

    // requirements
    const {popOutAlert} = useAlert();
    const {addNotification} = useNotifications();
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const [info,setInfo] = useState({});
    const [processInfo, setProcessInfo] = useState({steps:[]});
    const [attachedDocuments,setAttachedDocuments] = useState([]);

    // control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [docsCompleted,setDocsCompleted] = useState(false);
    const [loadingDocuments,setLoadingDocuments] = useState(false);

    // Form Content
    const [description,setDescription] = useState('');

    // Identificar paso en el cual se encuentra el usuario.
    
    const currentStepData = processInfo.steps?.find(s => s.id == processInfo.step_id);
    const nextStepData = processInfo.steps
        ?.filter(s => s.order > (currentStepData?.order ?? -1)) // Filtramos los que siguen
        .sort((a, b) => a.order - b.order)[0];
    const currentOrder = currentStepData ? currentStepData.order : 0;

    // Ordenar los pasos de cada secuencia
    const sortedSteps = [...(processInfo.steps || [])].sort((a, b) => a.order - b.order);
    const progressPercentage = ((currentOrder+ .5) / (sortedSteps.length)) * 100;


    // Getters of info
    const getInstanceInfo = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            id:instance_id
        })
        console.log(res);
        if(res[0]){
            setInfo(res[1][0])
            await getProcessState();
        }
        setLoading(false);
        setDisabled(false);
    }

    const getProcessState = async()=>{
        let res  = await postInfo('/process/getProcessState',{
            company_id:appInfo.company_id,
            id:instance_id
        });
        console.log(res)
        if(res[0]){
            setProcessInfo(res[1][0])
        }
    }

    const getAttachedDocuments = async()=>{
        setDisabled(true)
        setLoadingDocuments(true)
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            //allowedTypes:types,
            instance_id:info.id
        })
        if(res[0]){
            setAttachedDocuments(res[1])
        }else(
            setAttachedDocuments([])
        )
        setDisabled(false)
        setLoadingDocuments(false)
    }

    // Control functions

    const validateStepDocuments = (step) => {
        // Si el paso no tiene requerimientos, se considera habilitado por defecto
        if (!step.required_docs || step.required_docs.length === 0) {
            console.log('No tiene requerimeintos')
            return true;
        }

        // Verificamos que cada requerimiento se cumpla
        const allRequirementsMet = step.required_docs.every(req => {
            // Contamos cuántos documentos adjuntos coinciden con el docType requerido
            const attachedCount = step.attached_Docs?.filter(
                attached => attached.document_type === req.docType
            ).length || 0;

            // El requerimiento se cumple si la cantidad adjunta es >= al mínimo
            console.log(step.required_docs)
            console.log(step.attached_Docs)
            console.log(attachedCount);
            return attachedCount >= req.min;
        });
        
        if (allRequirementsMet) {
            console.log('Docs validados')
            return true;
        } else {
            console.log('No cumple')
            return false;
        }
    };

    const reviewSteps = (steps,currentOrder,currentStepId)=>{
        let newSteps = [];
        steps.map((element)=>{
            let nStep = element;
            console.log(`${element.id} --- ${currentStepId}`)
            nStep.isCompleted = element.order < currentOrder;
            nStep.isPending = element.order > currentOrder;
            let checkDocs = validateStepDocuments(element);
            element.checkDocs = checkDocs;
            if(element.id == currentStepId){
                setDocsCompleted(checkDocs)
                nStep.isActual = true;
            }
            newSteps.push(nStep)
            console.log('XX ',nStep)
        })
        console.log('---> ',newSteps);
        return newSteps
    }

    // Advance to next Step
    const advanceNextStep = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/nextProcessStep',{
            company_id:appInfo.company_id,
            user_id:userInfo.user_id,
            instance_id:info.id,
            previous_step:currentStepData.id,
            next_step:nextStepData.id,
            user_roll:userInfo.role,
            description
        })
        if(res.success){
            addNotification({
                type:'aproved',
                title:`${info.process_code}#${info.ownSerial} actualizado correctamente`,
                description:res.message
            })
            getInstanceInfo();
        }else{
            addNotification({
                type:'error',
                title:`Erorr al actualiza ${info.process_code}#${info.ownSerial}`,
                description:res.error
            })
            popOutAlert();
        }
        setLoading(false);
        setDisabled(false);
        reloadFun?.();
    }

    useEffect(()=>{
        console.log(`cambio en el sortedSteps`,sortedSteps)
    },[sortedSteps])

    useEffect(() => {
        console.log('Intentando solucionar los problemas')
        if (attachedDocuments.length != undefined && processInfo.steps) {
            // 1. Agrupamos los documentos por step_id para no iterar de más
            const docsByStep = attachedDocuments.reduce((acc, doc) => {
                if (!acc[doc.step_instance]) acc[doc.step_instance] = [];
                acc[doc.step_instance].push(doc);
                return acc;
            }, {});
            const stepsWithDocs = processInfo.steps.map(step => ({
                ...step,
                attached_Docs: docsByStep[step.id] || []
            }));

            // 3. Ahora que tienen docs, pasamos esos pasos por la revisión de lógica
            const verifiedSteps = reviewSteps(stepsWithDocs, currentOrder,  processInfo.step_id,);
            // 2. Actualizamos el estado una sola vez mapeando los pasos
            console.log(verifiedSteps)
            setProcessInfo(prev => ({
                ...prev,
                steps: verifiedSteps
            }));
        }
    }, [attachedDocuments]);


    useEffect(()=>{
        console.log(processInfo);
    },[processInfo])

    useEffect(()=>{
        if(info.id != undefined){
            getAttachedDocuments();
        }
    },[info])

    useEffect(()=>{
        getInstanceInfo();
    },[])

    return(
        <div className="ProcessStatusAlert">
            <div className="headProcess">
                <BoldTitle text={'Estado Proceso'}/>
                <div className="instanceContainer">
                    <span className="InstanceProceesIndicator">
                        {`${info.process_name} - `}
                        <b>{`${info.process_code}#${info.ownSerial}`}</b>
                    </span>
                    <span className="InstanceProceesIndicator">
                        {info.thirdParty_name}
                    </span>
                    <i title={`Mas información de ${info.process_name}`} className="fa-solid fa-arrow-rotate-right infoAbourProcess" onClick={()=>{
                        getInstanceInfo();
                    }}/>
                </div>
            </div>
            {!loading && (
                <>
                    {!loadingDocuments && (
                        <ul className="gridStepsProces">
                            {/* Barra de progreso dinámica */}
                            <div className="leftBarProgress" style={{ height: `${progressPercentage}%` }} />
                            
                            {sortedSteps.map((element) => {
                                console.log('--- ',element)
                                return (
                                    <li 
                                        key={element.id} 
                                        className={`
                                            step_item
                                            ${element.isActual ? 'ActualStep' : ''}
                                            ${element.isCompleted ? 'CompletedStep' : ''}
                                            ${element.isPending ? 'PendingStep' : ''}
                                        `}
                                    >
                                        <div className={`steepIndicator ${element.isCompleted? 'completedStep':''}`}>
                                            {element.isCompleted && <i className="fa-solid fa-check" />}
                                        </div>
                                        <span className="stepName">
                                            {element.name}
                                        </span>
                                        <div className="attachedDocsC">
                                            {element.order <= currentStepData.order && !element.checkDocs && element.required_docs?.map((attReqDoc,index)=>(
                                                (
                                                    <span key={index}className="requiredDocAlert">
                                                        <i className="fa-solid fa-triangle-exclamation"/>
                                                        Requiere al menos {attReqDoc.min} {attReqDoc.docType}
                                                    </span>
                                                )
                                            ))}
                                            {element.attached_Docs != undefined && element.attached_Docs?.map((attDoc,index)=>(
                                                <span key={index} className="attachedDoc">
                                                    <i className="fa-solid fa-file-circle-check"/>
                                                    {`${attDoc.document_type} #${attDoc.ownSerial}`}
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {loadingDocuments && (
                        <LoadingSpace title={'Cargando documentos adjuntos'}/>
                    )}
                    {nextStepData != undefined && nextStepData.required_roll.includes(parseInt(userInfo.role)) && (
                        <div className="optionsProcessCotnainer">
                            <FormInput textArea={true} title={'Descripción'} disabled={disabled} placeholder={'Descripción de la acción'}/>
                            <button className={`nextStepProcess ${!docsCompleted? 'pendingDocBtn':''}`} disabled={disabled} onClick={()=>{
                                    advanceNextStep();
                                }}>
                                <div className="infoNextStep">
                                    <strong>
                                        {docsCompleted? 'Avanzar a siguiente etapa':'Pendiente de documentación'}
                                    </strong>
                                    {processInfo.steps != undefined && (
                                        <span>
                                            {sortedSteps[currentOrder].name}
                                            <i className="fa-solid fa-arrow-right-long"/>
                                            {sortedSteps[currentOrder +1].name}
                                        </span>
                                    )}
                                </div>
                                <i className="fa-solid fa-circle-arrow-up iconProcessC"/>
                            </button>
                            <button className="passProcessStep" disabled={disabled} onClick={()=>{
                                popOutAlert();
                            }}>
                                <strong>Permanecer en esta etapa</strong>
                                <i className="fa-solid fa-pause"/>
                            </button>
                        </div>
                    )}
                    {nextStepData != undefined && !nextStepData.required_roll.includes(parseInt(userInfo.role)) && (
                        <div className="NoAviableRoll">
                            <h5>
                                <i className="fa-solid fa-triangle-exclamation"/>
                                No esta habilitado para continuar con el proceso
                            </h5>
                        </div>
                    )}
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando la información del proceso'}/>
            )}
        </div>
    )
}