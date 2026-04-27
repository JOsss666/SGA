import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { postInfo } from "../../../utils/functions";
import { SearchinList } from "../../components/SearchInList";
import { LoadingSpace } from "../LoadingSpace";
import {DescriptionSpan} from '../../components/DescriptionSpan'
import {FormButton} from '../../components/FormButton'
import {FormInput} from '../../components/FormInput'
import './FormSelectMachine.css'

export function FormSelectMachine({appInfo,userInfo,userConfig,popOutAlert,instance_id}){

    // Requirements
    const [assets,setAssets] = useState([]);
    const [services,setServices] = useState([]);
    const [processInstances,setProcessInstances] = useState([]);

    //Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);
    const [selectedAll,setSelectedAll] = useState(false);
    const [description,setDescription] = useState('');

    //formInfo
    const [instanceInfo,setInstanceInfo] = useState({});
    const formInfo = {
        instance_id:instanceInfo.id,
        document_type:"Machine use",
        company_id:appInfo.company_id,
        user_id:userInfo.user_id,
        services:services,
        description:description,
        instances:[{id:instanceInfo.id,step_id:instanceInfo.step_id}]
    }

    // getters of info

    const getInstances = async(allowedInstances,allowedTypes)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id,
            id:instance_id
        })
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.process_code}#${element.ownSerial}`,
                    value:element,
                    id:element.id
                })
            });
            setProcessInstances(C);
            if(C.length == 1){
                setInstanceInfo(C[0]);
            }
        }
        setLoading(false);
        setDisabled(false);
    }

    const getServicesMovements = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/getServiceMovements',{
            company_id:appInfo.company_id,
            instance_id:instanceInfo.id
        })
        if(res[0]){
            setServices(res[1])
        }
        setLoading(false);
        setDisabled(false);
    }
    
    const getAssets = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/assets/getAssets',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.internal_code} - ${element.name}`,
                    value:element.id,
                })
            });
            setAssets(C);
        }
        setLoading(false);
        setDisabled(false);
    }

    // Utils functions

    const verifySelection = ()=>{
        let s = true;
        services.forEach(element => {
            if(element.asset_id == undefined){
                s = false;
            }
        });
        setSelectedAll(s);
    }

    const setAssetid = (id, asset_id) => {
        setServices(prev => 
            prev.map(item => 
                item.id === id && asset_id != ""
                    ? { ...item, ["asset_id"]: asset_id } 
                    : item
            )
        );
    };

    // Creation function
    
    const registerServiceActions = async()=>{
        if(!selectedAll) return;
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/zj852/registerServiceMachine',formInfo);
        setLoading(false);
        setDisabled(false);
        popOutAlert?.();
    }

    // Event listeners

    useEffect(()=>{
        getAssets();
        getInstances();
    },[])

    useEffect(()=>{
        verifySelection();
    },[services])

    useEffect(()=>{
        if(instanceInfo.id != undefined){
            getServicesMovements();
        }
    },[instanceInfo])

    return(
        <div className="FormSelectMachine">
            <BoldTitle text={'Seleccion de maquinaria'}/>
            <DescriptionSpan text={'Seleccione la maquina utilizada en cada servicio'}/>
            {!loading && (
                <>
                    {instanceInfo.id == undefined && (
                        <SearchinList title={'Proceso'} placeHolder={'Seleccione el proceso'} action={setInstanceInfo} list={processInstances} disabled={disabled}/>
                    )}
                    <form action="" disabled={disabled? !selectedAll:disabled} onSubmit={(e)=>{
                        e.preventDefault();
                        console.log(formInfo)
                        registerServiceActions();
                    }}>
                        {instanceInfo.id != undefined && (
                            <div className="gridServicesSelectMachine">
                                {services.map((element,index)=>(
                                    <div className={`serviceSelectMCard ${element.asset_id == undefined? 'alertCard':''}`} key={index}>
                                        <h5>{element.service_name}</h5>
                                        <span>Unidades <b>{element.units}</b></span>
                                        <span>Descripción <b>{element.description}</b></span>
                                        <SearchinList placeHolder={'Seleccione maquina'} list={assets} disabled={disabled} action={(selectedOption)=>{
                                            console.log(selectedOption)
                                            setAssetid(element.id,selectedOption)
                                        }}/>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!selectedAll && (
                            <span className="alertComplete">
                                <i className="fa-solid fa-triangle-exclamation"/>
                                Selecione una maquina en cada servicio para continuar
                            </span>
                        )}
                        <FormInput textArea={true} title={'Descripcion'} placeholder={'Observaciones (Opcoinal)'} action={setDescription} disabled={disabled}/>
                        <FormButton text={'Guardar registro'} disabled={disabled? selectedAll:disabled}/>
                    </form>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}