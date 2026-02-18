import { useEffect, useState } from 'react'
import {BoldTitle} from '../../components/BoldTitle'
import {FormInput} from '../../components/FormInput'
import {FileInput} from '../../components/FileInput'
import {FormButton} from '../../components/FormButton'
import {postInfo} from '../../../utils/functions'
import {LoadingSpace} from '../LoadingSpace'
import './FormClicksControl.css'

export function FormClicksControl({appInfo,userInfo,userConfig,action}){

    // control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true)
    const [type,setType] = useState('')
    const [lastInstanceInfo,setLastInstanceInfo] = useState({})

    // formInfo
    const [initialClicks,setInitialClicks] = useState(0);
    const [finalClicks,setFinalClicks] = useState(0);
    const [attached,setAttached] = useState('[]');
    const [description,setDescription] = useState('')

    const formInfo = {
        company_id:appInfo.company_id,
        user_id:userInfo.user_id,
        initialClicks,
        finalClicks,
        attached,
        description,
        id:lastInstanceInfo.id
    }

    const getLastInstance = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/getlastClickControl',{
            company_id:appInfo.company_id
        })
        console.log(res);
        if(res[0]){
            setLastInstanceInfo(res[1][0]);
        }
        setLoading(false);
        setDisabled(false);
    };

    const openClickControl = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/openClickControl',formInfo);
        console.log(res);
        setLoading(false);
        setDisabled(false);   
    }

    const closeClickControl = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/closeClickControl',formInfo);
        console.log(res);
        setLoading(false);
        setDisabled(false);
    }

    const handleFormAction = async()=>{
        console.log(formInfo);
        if(type == 'open'){
            await openClickControl();
        }else{
            await closeClickControl();
        }
    }

    useEffect(()=>{
        getLastInstance();
    },[])

    useEffect(()=>{
        console.log(lastInstanceInfo)
        if(lastInstanceInfo.status == undefined || lastInstanceInfo.status == 'closed')
            {setType('open'); 
            return;
        }else{
            setType('close');
            setInitialClicks(lastInstanceInfo.initialClicks != undefined ? parseFloat(lastInstanceInfo.initialClicks).toFixed(2):0)
        }
    },[lastInstanceInfo])

    return(
        <div className="FormClicksControl">
            <BoldTitle text={`${type == 'open'? 'Nuevo registro':'Cierre'} de clicks`}/>
            {!loading && (
                <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                    handleFormAction();
                }}>
                    <FormInput type={'number'} step={0.01} action={setInitialClicks} title={'No. Clicks inciales'} disabled={type != 'open'? true:disabled} placeholder={'0'} value={initialClicks}/>
                    <FormInput min={initialClicks} type={'number'} step={0.01} action={setFinalClicks} title={'No. Clicks finales'} disabled={type == 'open'? true:disabled} placeholder={'0'} value={finalClicks}/>
                    <FileInput placeholder={'Adjuntar comprobante'} disabled={disabled} setDisabled={setDisabled} action={setAttached} userInfo={userInfo} appInfo={appInfo} />
                    <FormInput textArea={true} title={'Observación'} action={setDescription} disabled={disabled} placeholder={'(Opcional)'}/>
                    <FormButton text={`Registrar ${type == 'open'? 'inicio':'cierre'}`}/>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho...'}/>
            )}
        </div>
    )
}