import { useEffect, useState, useMemo } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import './ProcessStatusAlert.css'
import { postInfo, documentTypeName } from "../../../../utils/functions";
import { missingDocumentRequirements, requirementType } from "../../../../utils/processDocumentRequirements";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { FormInput } from "../../components/FormInput";
import { LoadingSpace } from "../LoadingSpace";
import { SelectTpeNewDoc } from "../forms/SelectTypeNewDoc";
import { PreviewDocument } from "../Preview/PreviewDocument";
import { FormNewThirdPartyDelegation } from "../forms/FormNewThirdPartyDelegation";

export function ProcessStatusAlert({instance_id,reloadFun,visibleMissing,visibleSupprocesses}){

    // requirements
    const {popOutAlert,popInAlert} = useAlert();
    const {addNotification} = useNotifications();
    const {appInfo,userInfo} = useAppInfo();
    const [info,setInfo] = useState({});
    const [processInfo, setProcessInfo] = useState({steps:[]});
    const [attachedDocuments,setAttachedDocuments] = useState([]);

    // control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
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

    const formatAdvancementDate = (advancement) => {
        if (!advancement?.created_at) return null;

        try {
            return new Intl.DateTimeFormat('es-CO', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: advancement.business_time_zone
            }).format(new Date(advancement.created_at));
        } catch {
            return advancement.created_at_local || advancement.created_at;
        }
    };

    // Getters of info
    const getInstanceInfo = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            id:instance_id
        })
        console.log('Información de procesos',res);
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
        const allowedTypes = userInfo.responsable_config.access.information.documents.overAll? undefined:userInfo.responsable_config.access.information.documents.enabled
        let res = await postInfo('/process/getAttachedDocuments',{
            company_id:appInfo.company_id,
            allowedTypes,
            instance_id:info.id
        })
        console.log('DDDDD ',res)
        if(res[0]){
            setAttachedDocuments(res[1])
        }else(
            setAttachedDocuments([])
        )
        setDisabled(false)
        setLoadingDocuments(false)
    }

    // Control functions

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

    
    const cancellProcess = async()=>{
        let res = await postInfo('/process/updateProcessInstanceStatus',{
            company_id:appInfo.company_id,
            id:info.id,
            status:'cancelled',
            user_id:userInfo.user_id
        });
        await popOutAlert();
        if(res[0]){
            addNotification({
                type:'error',
                title:`${info.process_code}#${info.ownSerial} cancelado`,
                description:`La instancia de proceso ${info.process_code}#${info.ownSerial} fue cancelada correctamente.`
            })
        }
    }

    // Funcion para ordenar los pasos
    const enrichedSteps = useMemo(() => {
        if (!processInfo.steps) return [];

        // Agrupar docs por step
        const docsByStep = attachedDocuments.reduce((acc, doc) => {
            if (!acc[doc.step_instance]) acc[doc.step_instance] = [];
            acc[doc.step_instance].push(doc);
            return acc;
        }, {});

        return processInfo.steps.map(step => {
            const attached = docsByStep[step.id] || [];

            const missingRequirements = missingDocumentRequirements(step.required_docs ?? [], attached);
            const checkDocs = missingRequirements.length === 0;

            return {
                ...step,
                attached_Docs: attached,
                checkDocs,
                missingRequirements,
                isCompleted: step.order < currentOrder,
                isPending: step.order > currentOrder,
                isActual: step.id == processInfo.step_id
            };
        });

    }, [processInfo.steps, attachedDocuments, currentOrder, processInfo.step_id]);


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

    // Final validation of required Documents
    const docsCompleted = useMemo(() => {
        const current = enrichedSteps.find(s => s.isActual);
        return current?.checkDocs ?? false;
    }, [enrichedSteps]);

    const canCancel = true;

    return(
        <div className="ProcessStatusAlert">
            <div className="headProcess">
                <div className="comercialView">
                    <img src={appInfo.img? appInfo.img:"https://cdnmain.sga360.co/static/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.webp"} alt="" />
                    <span>{appInfo.legal_name}</span>
                </div>
                <BoldTitle text={`${info.process_name} - ${info.process_code}#${info.ownSerial}`}/>
                <div className="instanceContainer">
                    {info.name != undefined && info.name != null && (
                        <span className="InstanceProceesIndicator">
                            {`"${info.name}"`}
                        </span>
                    ) }
                    <span className="InstanceProceesIndicator">
                        {info.thirdParty_name}
                    </span>
                    <i title={`Refescar ${info.process_name}`} className="fa-solid fa-arrow-rotate-right infoAbourProcess" onClick={()=>{
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
                            {enrichedSteps
                                    .sort((a, b) => a.order - b.order)
                                    .map((element) => (
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
                                            {visibleSupprocesses === true && element.subprocesses?.map(child => (
                                                <button type="button" className="subprocessLink" key={child.id} onClick={()=>{
                                                    popInAlert(<ProcessStatusAlert instance_id={child.id} reloadFun={getInstanceInfo}/>);
                                                }}>
                                                    <span>{child.process_code}#{child.ownSerial} · {child.thirdParty_name || 'Proveedor'}</span>
                                                    <span>{child.status === 'cancelled' ? 'Cancelado' : child.step_name}</span>
                                                </button>
                                            ))}
                                            {(element.isCompleted || element.isActual) && element.advancement && (
                                                <div className="responsableInfo">
                                                    <i className="fa-solid fa-angles-right" aria-hidden="true"/>
                                                    <span className="responsableName">
                                                        {element.advancement.user_name || `Usuario #${element.advancement.user_id}`}
                                                    </span>
                                                    <time
                                                        dateTime={element.advancement.created_at}
                                                        title={`Zona horaria: ${element.advancement.business_time_zone}`}
                                                    >
                                                        {formatAdvancementDate(element.advancement)}
                                                    </time>
                                                </div>
                                            )}
                                            {(element.isCompleted || element.isActual) && !element.advancement && (
                                                <span className="noAdvancementInfo">Sin registro de avance</span>
                                            )}
                                            {visibleMissing === true
                                                && element.required_roll?.includes(parseInt(userInfo.role))
                                                && element.order <= currentOrder && !element.checkDocs &&
                                                element.missingRequirements.map((req, i) => (
                                                    <button type="button" key={i} className="requiredDocAlert" onClick={()=>{
                                                        popInAlert(<SelectTpeNewDoc docType={requirementType(req)} paramdocId={req.paramdoc_id} reloadFun={getInstanceInfo} info={{
                                                            instance_id:info.id,
                                                            step_id: element.id,
                                                            thirdParty_id: info.thirdParty_id
                                                        }}/>)
                                                    }}>
                                                        <i className="fa-solid fa-triangle-exclamation"/>
                                                        Requiere al menos {req.min ?? 1} {documentTypeName(requirementType(req))}{req.paramdoc_id != null ? ` (plantilla #${req.paramdoc_id})` : ""}
                                                    </button>
                                                ))}
                                            {element.attached_Docs.map((doc, i) => (
                                                <span key={i} className="attachedDoc" onClick={()=>{
                                                    const isAssignedDocument = doc.document_type === 'ThirdParty Delegation';
                                                    popInAlert(isAssignedDocument
                                                        ? <FormNewThirdPartyDelegation
                                                            forUpdate
                                                            asignedDocument={doc.doc_id}
                                                            instnacePreInfo={{instance_id:info.id}}
                                                            reloadFun={getInstanceInfo}
                                                        />
                                                        : <PreviewDocument doc_id={doc.doc_id}/>
                                                    );
                                                }}>
                                                    <i className="fa-solid fa-file-circle-check"/>
                                                    {`${documentTypeName(doc.document_type, doc.name)} #${doc.ownSerial}`}
                                                </span>
                                            ))}
                                        </div>
                                    </li>
                                )
                            )}
                        </ul>
                    )}
                    {loadingDocuments && (
                        <LoadingSpace title={'Cargando documentos adjuntos'}/>
                    )}
                    {nextStepData != undefined && nextStepData.required_roll.includes(parseInt(userInfo.role)) && (
                        <div className="optionsProcessCotnainer">
                            <FormInput textArea={true} title={'Descripción'} disabled={disabled} value={description} action={setDescription} placeholder={'Descripción de la acción'}/>
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
                            {canCancel && (
                                <button className="passProcessStep cancelButton" disabled={disabled} onClick={()=>{
                                    cancellProcess();
                                }}>
                                    <strong>Cancelar proceso</strong>
                                    <i className="fa-solid fa-trash cancelIcon"/>
                                </button>
                            )}
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
