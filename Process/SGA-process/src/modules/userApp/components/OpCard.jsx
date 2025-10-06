import { useEffect, useState } from "react";
import { LabelValue } from "./LabelValue";
import './OpCard.css'
import { SwitchOption } from "./SwitchOption";
import { moneyFormat, postInfo } from "../../../utils/functions";
import { OcSimpleCard } from "./OcSimpleCard";
import { DocsSimpleCard } from "./DocsSimpleCard";
import { useAlert, useAppInfo } from "../../../context/context";
import { FormNewOc } from "../containers/forms/FormNewOc";
import { FormNewDC } from "../containers/forms/FormNewDC";
import { SelectTpeNewDoc } from "../containers/forms/SelectTypeNewDoc";
import { MoreOptions } from "./MoreOptions";

export function OpCard({data}){

    const [info,setInfo] = useState(data);
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const [attachedDocs,setAttachedDocs] = useState([]);
    const [visibleInfo,setVisibleInfo] = useState(true);

    const getAttachedDocuments = async()=>{
        let res = await postInfo('/process/getOpAttached',{op_id:info.op_id})
        if(res[0]){
            setAttachedDocs(res[1]);
        }
    }

    const reloadInfo = async()=>{
        console.log('Recargando OP info')
        let res = await postInfo('/process/getOp',{company_id:appInfo.company_id,op_id:info.op_id})
        if(res[0]){
            setInfo(res[1][0]);
        }
    }

    useEffect(()=>{
        if(info.user_id == undefined){
            reloadInfo();
        }
        if(info.op_id != undefined){
            getAttachedDocuments();
        }
    },[info]);

    useEffect(()=>{
        if(data.getData){
            reloadInfo();
        }
    },[])

    return(
        <div className="OpCard">
            <div className="headOP">
                <h3 onClick={()=>{reloadInfo()}}>OP#{info.op_id}</h3>
                <SwitchOption action={setVisibleInfo} state1={'Información'} state2={'Adjuntos'}/>
                <MoreOptions options={[
                    {text:'Descargar',icon:<i className="fa-solid fa-arrow-down"/>},
                    {text:'Compartir',icon:<i className="fa-solid fa-share-nodes"/>},
                    {text:'Bloquear',icon:<i className="fa-solid fa-lock"/>},
                    {text:'Ver actividad',icon:<i className="fa-solid fa-eye"/>},
                    {text:'Estadisticas',icon:<i className="fa-solid fa-chart-simple"/>},
                ]} />
            </div>
            {!visibleInfo && (
                <div className="bodyOP">
                    <LabelValue title={'Creado por:'} value={info.user_name}/>
                    <LabelValue title={'Cliente:'} value={info.names != null? info.names:'---'}/>
                    <LabelValue title={'Fecha entrega:'} value={info.expiration_date != null? info.expiration_date:'---'}/>
                    <LabelValue title={'Ingreso pres:'} value={info.budgetIncome != null? `$ ${moneyFormat(info.budgetIncome)}`:0}/>
                    <LabelValue title={'Costo pres:'} value={info.budgetCost != null? `$ ${moneyFormat(info.budgetCost)}`:0}/>
                    <LabelValue title={'Costo ejecutado:'} value={info.executedCost != null? `$ ${moneyFormat(info.executedCost)}`:0}/>
                    <LabelValue title={'Valor facturado:'} value={info.invoicedValue != null? `$ ${moneyFormat(info.invoicedValue)}`:0}/>
                    <LabelValue title={'Utilidad Actual:'} value={`${((info.budgetIncome/info.budgetCost)*100).toFixed(1)}%`}/>
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
                                    if(element.type == 'OC'){
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
                                if(element.type != 'OC'){
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