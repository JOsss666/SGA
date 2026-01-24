import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import './ProcessStatusAlert.css'
import { postInfo } from "../../../../utils/functions";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { FormInput } from "../../components/FormInput";
import { LoadingSpace } from "../LoadingSpace";

export function ProcessStatusAlert({instance_id}){

    // requirements
    const {popOutAlert} = useAlert();
    const {addNotification} = useNotifications();
    const {appInfo,userInfo,userConfig} = useAppInfo();
    const [info,setInfo] = useState({});
    const [processInfo, setProcessInfo] = useState({});
    const [attachedDocuments,setAttachedDocuments] = useState([]);
    let checkDocs;

    // control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);

    // Form Content
    const [description,setDescription] = useState('');

    // Buscamos el objeto del paso donde está el usuario actualmente
    const currentStepData = processInfo.steps?.find(s => s.id == processInfo.step_id);
    const nextStepData = processInfo.steps
        ?.filter(s => s.order > (currentStepData?.order ?? -1)) // Filtramos los que siguen
        .sort((a, b) => a.order - b.order)[0];
    const currentOrder = currentStepData ? currentStepData.order : 0;
    // Es vital ordenar los pasos por 'order' antes de mapear para que la lista sea lógica
    const sortedSteps = [...(processInfo.steps || [])].sort((a, b) => a.order - b.order);
    const progressPercentage = ((currentOrder+ .5) / (sortedSteps.length)) * 100;

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
        console.log(res);
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
    }

    const getAttachedDocuments = async()=>{
        let res = await postInfo('/getDocuments',{
            company_id:appInfo.company_id,
            //allowedTypes:types,
            instance_id:info.id
        })
        console.log(res);
        if(res[0]){
            setAttachedDocuments(res[1])
        }
    }

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

    useEffect(() => {
        if (attachedDocuments.length > 0 && processInfo.steps) {
            // 1. Agrupamos los documentos por step_id para no iterar de más
            const docsByStep = attachedDocuments.reduce((acc, doc) => {
                if (!acc[doc.step_instance]) acc[doc.step_instance] = [];
                acc[doc.step_instance].push(doc);
                console.log(acc)
                return acc;
            }, {});

            // 2. Actualizamos el estado una sola vez mapeando los pasos
            setProcessInfo(prev => ({
                ...prev,
                steps: prev.steps.map(step => ({
                    ...step,
                    // Si hay documentos para este ID, los asignamos; si no, array vacío
                    attached_Docs: docsByStep[step.id] || []
                }))
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
                    <i title={`Mas información de ${info.process_name}`} className="fa-solid fa-circle-info infoAbourProcess"/>
                </div>
            </div>
            {!loading && (
                <>
                    <ul className="gridStepsProces">
                        {/* Barra de progreso dinámica */}
                        <div className="leftBarProgress" style={{ height: `${progressPercentage}%` }} />
                        
                        {sortedSteps.map((element) => {
                            // Lógica de estados
                            const isActual = element.id == processInfo.step_id;
                            const isCompleted = element.order < currentOrder;
                            const isPending = element.order > currentOrder;
                            
                            if(isActual){
                                checkDocs = validateStepDocuments(element)
                            }

                            return (
                                <li 
                                    key={element.id} 
                                    className={`
                                        step_item
                                        ${isActual ? 'ActualStep' : ''}
                                        ${isCompleted ? 'CompletedStep' : ''}
                                        ${isPending ? 'PendingStep' : ''}
                                    `}
                                >
                                    <div className={`steepIndicator ${isCompleted? 'completedStep':''}`}>
                                        {isCompleted && <i className="fa-solid fa-check" />}
                                    </div>
                                    <span className="stepName">
                                        {element.name}
                                    </span>
                                    <div className="attachedDocsC">
                                        {isActual && !checkDocs && element.required_docs.map((attReqDoc,index)=>(
                                            (
                                                <span key={index}className="requiredDocAlert">
                                                    <i className="fa-solid fa-triangle-exclamation"/>
                                                    Requiere al menos {attReqDoc.min} {attReqDoc.docType}
                                                </span>
                                            )
                                        ))}
                                        {element.attached_Docs != undefined && element.attached_Docs.map((attDoc,index)=>(
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
                    {nextStepData != undefined && nextStepData.required_roll.includes(parseInt(userInfo.role)) && (
                        <div className="optionsProcessCotnainer">
                            <FormInput textArea={true} title={'Descripción'} disabled={disabled} placeholder={'Descripción de la acción'}/>
                            <button className="nextStepProcess" disabled={disabled? true:!checkDocs} onClick={()=>{
                                advanceNextStep();
                            }}>
                                <div className="infoNextStep">
                                    <strong>
                                        {checkDocs? 'Avanzar a siguiente etapa':'Pendiente de documentación'}
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