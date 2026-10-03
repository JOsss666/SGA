import './AttachedDocuments.css'
import { useState } from "react";
import { FileInput } from "../../components/FileInput";
import { FormButton } from "../../components/FormButton";
import { useAppInfo, useNotifications } from "../../../../context/context";
import { postInfo } from "../../../../utils/functions";

export function AttachedDocuments({info,reloadFun}){

    // Requirements
    const {appInfo,userConfig} = useAppInfo();
    const {addNotification} = useNotifications();

    // Control
    const can_edit = userConfig?.access?.sections?.thirdparties?.can_edit
    const [disabled,setDisabled] = useState(false);
    const [attachedRut,setAttachedRut] = useState(info?.attachedRut ?? '');

    const handleRutAttachmentChange = (elements)=>{
        const firstElement = elements?.[0];
        const firstUrl = firstElement?.url ?? firstElement;
        if(firstUrl != undefined){
            setAttachedRut(firstUrl);
        }
    }

    // Solo enviamos el campo editado; el servicio preserva el resto de datos.
    const saveAttachedRut = async()=>{
        setDisabled(true);
        try{
            const res = await postInfo('/updateThirdParty',{
                company_id:info?.company_id ?? appInfo.company_id,
                id:info?.id,
                attachedRut
            });
            if(res?.[0]){
                addNotification({
                    type:'aproved',
                    title:'Documento guardado',
                    description:'El soporte RUT se guardó correctamente.'
                });
                reloadFun?.();
            }else{
                addNotification({
                    type:'error',
                    title:'No fue posible guardar',
                    description:'Hubo un problema al guardar el documento, inténtalo de nuevo.'
                });
            }
        }catch(error){
            addNotification({
                type:'error',
                title:'No fue posible guardar',
                description:error?.message ?? 'Error al guardar el documento.'
            });
        }
        setDisabled(false);
    }

    return(
        <div className="AttachedDocuments">
            <div className="attachedDocsGrid">
                <div className="docItem">
                    <h6>RUT</h6>
                    <div className="RutContainer">
                        <div className="actualRut">
                            {!attachedRut && (
                                <div className="noRutAttached">
                                    <i className="fa-solid fa-ghost"/>
                                    <h6>
                                        No has adjuntado ningun Rut
                                    </h6>
                                </div>
                            )}
                        </div>
                        {can_edit && (
                            <FileInput category="thirdPartiesDocs" action={handleRutAttachmentChange} placeholder={'Seleccionar nuevo RUT'}/>
                        )}
                    </div>
                    {attachedRut && (
                        <a className="viewRutLink" href={attachedRut} target="_blank" rel="noreferrer">
                            Ver soporte RUT actual
                        </a>
                    )}
                    {can_edit && attachedRut !== (info?.attachedRut ?? '') && (
                        <div className="optionsRow">
                            <FormButton text={'Guardar documento'} disabled={disabled} onClick={saveAttachedRut}/>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
