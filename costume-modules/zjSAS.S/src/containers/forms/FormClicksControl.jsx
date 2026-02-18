import { useState } from 'react'
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

    // formInfo
    const [initialClicks,setInitialClicks] = useState(0);
    const [finalClicks,setFinalClicks] = useState(0);
    const [attached,setAttached] = useState('-');
    const [description,setDescription] = useState('')

    const formInfo = {
        company_id:appInfo.company_id,
        initialClicks,
        finalClicks,
        attached,
        description
    }

    const getLastInstance = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('')
        setLoading(false);
        setDisabled(false);
    }

    return(
        <div className="FormClicksControl">
            <BoldTitle text={'Registro de clicks'}/>
            {!loading && (
                <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                    action?.(formInfo)
                }}>
                    <FormInput type={'number'} action={setInitialClicks} title={'No. Clicks inciales'} disabled={disabled} placeholder={'0'}/>
                    <FormInput type={'number'} action={setFinalClicks} title={'No. Clicks finales'} disabled={disabled} placeholder={'0'}/>
                    <FileInput placeholder={'Adjuntar comprobante'} disabled={disabled} setDisabled={setDisabled} action={setAttached} userInfo={userInfo} appInfo={appInfo} />
                    <FormInput textArea={true} title={'Observación'} action={setDescription} disabled={disabled}/>
                    <FormButton text={`Registrar ${type == 'open'? 'inicio':'cierre'}`}/>
                </form>
            )}
            {loading && (
                <LoadingSpace title={'Cargando información'} description={'Esto no debe tardar mucho...'}/>
            )}
        </div>
    )
}