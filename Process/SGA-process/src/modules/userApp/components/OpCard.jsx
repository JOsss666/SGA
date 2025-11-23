import { useEffect, useRef, useState } from "react";
import { LabelValue } from "./LabelValue";
import './OpCard.css'
import { SwitchOption } from "./SwitchOption";
import { moneyFormat, postInfo, ScreenShotElement } from "../../../utils/functions";
import { OcSimpleCard } from "./OcSimpleCard";
import { DocsSimpleCard } from "./DocsSimpleCard";
import { useAlert, useAppInfo } from "../../../context/context";
import { FormNewOc } from "../containers/forms/FormNewOc";
import { FormNewDC } from "../containers/forms/FormNewDC";
import { SelectTpeNewDoc } from "../containers/forms/SelectTypeNewDoc";
import { MoreOptions } from "./MoreOptions";
import { AiButton } from "./ChatAiComponents/AiButton";

export function OpCard({data}){

    const container = useRef()
    const [info,setInfo] = useState(data);
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const [attachedDocs,setAttachedDocs] = useState([]);
    const [visibleInfo,setVisibleInfo] = useState(true);

    const getAttachedDocuments = async()=>{
        let res = await postInfo('/process/getOpAttached',{id:info.id})
        console.log(res)
        if(res[0]){
            setAttachedDocs(res[1]);
        }
    }

    const reloadInfo = async()=>{
        console.log('Recargando OP info')
        let res = await postInfo('/process/getOp',{company_id:appInfo.company_id,id:info.id})
        if(res[0]){
            setInfo(res[1][0]);
        }
    }

    useEffect(()=>{
        console.log(info);
    },[info])

    /*
    useEffect(()=>{
        if(info.user_id == undefined){
            reloadInfo();
        }
        if(info.op_id != undefined){
            getAttachedDocuments();
        }
    },[info]);

    */

    useEffect(()=>{
        if(data.getData){
            reloadInfo();
        }
        getAttachedDocuments();
    },[])

    const donwloadElement = async()=>{
        await ScreenShotElement(container.current,`Orden de Producción #${info.op_id}.png`);
    }

    return(
        <div ref={container} className="OpCard">
            <div className="headOP">
                <h3 onClick={()=>{reloadInfo()}}>OP#{info.ownSerial}</h3>
                <SwitchOption action={setVisibleInfo} state1={'Información'} state2={'Adjuntos'}/>
                <AiButton attached={{info,attachedDocs}} sugerence={[
                {text:'Resume el estado de esta orden de producción',context:`Procesos - Orden de producción ${info.op_id}`},
                {text:'Realiza un analisis de este informe',context:`Procesos - Orden de producción ${info.op_id}`},
                {text:'¿Que acciones me recomiendas basado en este informe?',context:`Procesos - Orden de producción ${info.op_id}`}
            ]}/>
                <MoreOptions options={[
                    {text:'Descargar',icon:<i className="fa-solid fa-arrow-down"/>,action:donwloadElement},
                    {text:'Compartir',icon:<i className="fa-solid fa-share-nodes"/>},
                    {text:'Bloquear',icon:<i className="fa-solid fa-lock"/>},
                    {text:'Ver actividad',icon:<i className="fa-solid fa-eye"/>},
                    {text:'Estadisticas',icon:<i className="fa-solid fa-chart-simple"/>},
                ]} />
            </div>
            {!visibleInfo && (
                <div className="bodyOP">
                    <LabelValue title={'Creado por:'} value={info.user_name}/>
                    <LabelValue title={'Cliente:'} value={info.thirdparty_names != null? info.thirdparty_names:'---'}/>
                    <LabelValue title={'Fecha entrega:'} value={info.expiration_date != null? info.expiration_date:'---'}/>
                    <LabelValue title={'Ingreso pres:'} value={info.budgetIncome != null? `$ ${moneyFormat(parseInt(info.budgetIncome))}`:0}/>
                    <LabelValue title={'Costo pres:'} value={info.budgetCost != null? `$ ${moneyFormat(parseInt(info.budgetCost))}`:0}/>
                    <LabelValue title={'Costo ejecutado:'} value={info.executedCost != null? `$ ${moneyFormat(parseInt(info.executedCost))}`:0}/>
                    <LabelValue title={'Valor facturado:'} value={info.invoicedValue != null? `$ ${moneyFormat(parseInt(info.invoicedValue))}`:0}/>
                    <LabelValue title={'Utilidad Actual:'} value={`${((parseInt(info.budgetIncome)/parseInt(info.budgetCost))*100).toFixed(1)}%`}/>
                    <LabelValue title={'Estado:'} value={info.status}/>
                </div>
            )}{visibleInfo && (
                <div className="attachedDocuments">
                    <div className="ocsContainer">
                        <h4>Ordenes de cliente: <strong>{info.names}</strong></h4>
                        <div className="gridOcs">
                            <div onClick={()=>{
                                popInAlert(<FormNewOc info={info} reloadFun={reloadInfo}/>)
                            }} className="newOcCD"><i className="fa-solid fa-plus"/> Añadir nueva Orden de Cliente</div>
                                {attachedDocs.length >0 && attachedDocs.map((element,index)=>{
                                    if(element.document_type == 'Client Order'){
                                        return(
                                            <OcSimpleCard info={element} key={index}/>
                                        )
                                    }
                                })}
                        </div>
                    </div>
                    <div className="ocsContainer">
                        <h4>Documentos proceso:</h4>
                        <div className="gridAttached">
                            <div onClick={()=>{
                                popInAlert(<SelectTpeNewDoc info={info} reloadFun={reloadInfo}/>)
                            }} className="newOcCD"><i className="fa-solid fa-plus"/> Añadir nuevo documento</div>
                            {attachedDocs.length>0 && attachedDocs.map((element,index)=>{
                                if(element.document_type != 'Client Order'){
                                    return(
                                        <DocsSimpleCard info={element} key={index}/>
                                    )
                                }
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}