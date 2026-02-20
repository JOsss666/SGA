import { useEffect, useState } from 'react'
import {BoldTitle} from '../../components/BoldTitle'
import {FormInput} from '../../components/FormInput'
import {FileInput} from '../../components/FileInput'
import {SearchinList} from '../../components/SearchInList'
import {FormButton} from '../../components/FormButton'
import {postInfo} from '../../../utils/functions'
import {UserCard} from '../../components/UserCard'
import {LoadingSpace} from '../LoadingSpace'
import './FormClicksControl.css'

export function FormClicksControl({appInfo,userInfo,userConfig,action,popOutAlert}){

    // control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(true)
    const [type,setType] = useState('')
    const [lastInstanceInfo,setLastInstanceInfo] = useState({})
    const [assets,setAssets] = useState([]);

    // formInfo
    const [selectedAsset,setSelectedAsset] = useState({});
    const [initialClicks,setInitialClicks] = useState(0);
    const [finalClicks,setFinalClicks] = useState(0);
    const [attached,setAttached] = useState([]);
    const [description,setDescription] = useState('')

    const formInfo = {
        asset_id:selectedAsset.id,
        company_id:appInfo.company_id,
        user_id:userInfo.user_id,
        initialClicks,
        finalClicks,
        attached,
        description,
        id:lastInstanceInfo.id
    }

    // Getters of info

    const getLastInstance = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/zj852/getlastClickControl',{
            company_id:appInfo.company_id,
            asset_id:selectedAsset.id
        })
        console.log(res);
        if(res[0]){
            setLastInstanceInfo(res[1][0]);
        }
        setLoading(false);
        setDisabled(false);
    };

    const getAssets = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/assets/getAssets',{
            company_id:appInfo.company_id
        });
        console.log(res);
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

    // utils functions

    const openClickControl = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/zj852/openClickControl',formInfo);
        console.log(res);
        setLoading(false);
        setDisabled(false);   
        popOutAlert?.();
    }

    const closeClickControl = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/zj852/closeClickControl',formInfo);
        console.log(res);
        setLoading(false);
        setDisabled(false);
        popOutAlert?.();
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
        if(selectedAsset.id != undefined){
            getLastInstance();
        }
    },[selectedAsset])

    useEffect(()=>{
        getAssets();
    },[])

    useEffect(()=>{
        console.log(lastInstanceInfo)
        if(lastInstanceInfo.status == undefined || lastInstanceInfo.status == 'closed')
            {setType('open'); 
            return;
        }else{
            setType('close');
            let newIniC = parseFloat(lastInstanceInfo.initialClicks).toFixed(2)
            setInitialClicks(lastInstanceInfo.initialClicks)
        }
    },[lastInstanceInfo])

    useEffect(()=>{
        console.log(initialClicks)
    },[initialClicks])

    return(
        <div className="FormClicksControl">
            <BoldTitle text={`${type == 'open'? 'Nuevo registro':'Cierre'} de clicks`}/>
            {!loading && selectedAsset.id == undefined && (
                <SearchinList title={'Maquina'} action={setSelectedAsset} noActVal={true} placeHolder={'Seleccione la maquina'} list={assets}/>
            )}
            {!loading && selectedAsset.id != undefined &&(
                <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                    handleFormAction();
                }}>
                    <UserCard name={selectedAsset.name} imgSrc={selectedAsset.img} desc={selectedAsset.model} />
                    {type == 'open' && (
                        <FormInput type={'number'} step={0.01} action={setInitialClicks} title={'No. Clicks inciales'} disabled={type != 'open'? true:disabled} placeholder={initialClicks}/>
                    )}
                    {type != 'open' && (
                        <FormInput min={initialClicks} type={'number'} step={0.01} action={setFinalClicks} title={'No. Clicks finales'} disabled={type == 'open'? true:disabled} placeholder={finalClicks}/>
                    )}
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