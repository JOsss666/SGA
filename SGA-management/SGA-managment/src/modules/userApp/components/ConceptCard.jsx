import { TagIndicator } from "./TagIndicator";
import { ButtonMenu } from "./ButtonMenu";
import { MoreOptions } from "./MoreOptions";
import { useEffect, useState } from "react";
import { postInfo } from "../../../utils/functions";
import './ConceptCard.css'
import { useAlert, useAppInfo } from "../../../context/context";
import { FormNewConcept } from "../containers/forms/FormNewConcept";

export function ConceptCard({info,hidden,reloadFun}){    

    const {popInAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const [visibleConceptData,setVisibleConceptData] = useState(false);
    const [attachetTaxes,setAttachedTaxes] = useState([]);
    const [loadedChildren,setLoadedChildren] = useState(false);

    const getAttachedTaxes = async()=>{
        console.log('Cargando Impuestos');
        let res = await postInfo('/getConceptTaxes',{
            concept_id:info.id,
        })
        console.log(res);
        if(res[0]){
            setAttachedTaxes(res[1])
        }else{
            setAttachedTaxes([])
        }
    }

    const deleteConcept = async()=>{
        let res = await postInfo('/deleteConcept',{
            concepts:[info.id]
        })
        if(reloadFun != undefined){
            reloadFun();
        }
    }

    const editConcept = ()=>{
        popInAlert(
            <FormNewConcept update={true} updateInfo={info}/>
        )
    }

    useEffect(()=>{
        if(attachetTaxes.length == 0){
            if(!loadedChildren && visibleConceptData){
                getAttachedTaxes();
            }
        }
    },[visibleConceptData])

    if(!hidden){
        return(
            <div className="ConceptCard">
                <div className="headConceptCard">
                    <TagIndicator title={`SGA#${info.id}`} type={'indicator'}/>
                    <h6>{info.name}</h6>
                    <TagIndicator title={info.status} type={info.status}/>
                    <ButtonMenu onClick={()=>{
                        setVisibleConceptData(!visibleConceptData)
                    }} noRotate={true} title={'Mostrar más información'}>
                        <i className={`fa-solid fa-angle-${visibleConceptData? 'up':'down'}`}></i>
                    </ButtonMenu>
                    <MoreOptions options={[
                        {text:'Editar',icon:<i className="fa-solid fa-pencil"/>,action:editConcept},
                        {text:'Eliminar',icon:<i class="fa-solid fa-trash"></i>,action:deleteConcept},
                        {text:'Ver estadisticas',icon:<i className="fa-solid fa-chart-column"/>},
                        {text:'Ver movimientos',icon:<i className="fa-solid fa-eye"/>}
                    ]}/>
                </div>
                {visibleConceptData && (
                    <div className="bodyConceptCard">
                        <div className="textVal">
                            <span className="topicBody">Cuenta contable</span>
                            <strong className="account_Concept">{info.code} - {info.account_name}</strong>
                        </div>
                        <div className="textVal">
                            <span className="topicBody">{info.description??'--'}</span>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}