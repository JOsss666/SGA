import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { postInfo } from "../../../utils/functions";
import { SearchinList } from "../../components/SearchInList";
import { LoadingSpace } from "../LoadingSpace";
import './FormSelectMachine.css'

export function FormSelectMachine({appInfo,userInfo,userConfig,popOutAlert}){

    // Requirements
    const [assets,setAssets] = useState([]);
    const [services,setServices] = useState([]);
    const [processInstances,setProcessInstances] = useState([]);

    //Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    //formInfo
    const [instanceInfo,setInstanceInfo] = useState({});
    const formInfo = {
        document_type:"Machine use"
    }

    // getters of info

    const getInstances = async(allowedInstances,allowedTypes)=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/process/getProcessInstances',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.process_code}#${element.ownSerial}`,
                    value:element
                })
            });
            setProcessInstances(C);
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
        console.log(res)
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
                    value:element
                })
            });
            setAssets(C);
        }
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getAssets();
        getInstances();
    },[])

    useEffect(()=>{
        if(instanceInfo.id != undefined){
            console.log(instanceInfo.id)
            getServicesMovements();
        }
    },[instanceInfo])

    return(
        <div className="FormSelectMachine">
            <BoldTitle text={'Seleccion de maquinaria'}/>
            {!loading && (
                <>
                    {instanceInfo.id == undefined && (
                        <SearchinList title={'Proceso'} placeHolder={'Seleccione el proceso'} action={setInstanceInfo} list={processInstances} disabled={disabled}/>
                    )}
                    <form action="" disabled={disabled} onSubmit={(e)=>{
                        e.preventDefault();
                    }}>
                        {instanceInfo.id != undefined && (
                            <div className="gridServicesSelectMachine">
                                {services.map((element,index)=>(
                                    <div className="serviceSelectMCard" key={index}>
                                        <h5>{element.service_name}</h5>
                                        <span>Unidades <b>{element.units}</b></span>
                                        <span>Descripción <b>{element.description}</b></span>
                                        <SearchinList placeHolder={'Seleccione maquina'} list={assets} disabled={disabled}/>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>
                </>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho'}/>
            )}
        </div>
    )
}