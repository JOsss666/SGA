import { useEffect, useState } from 'react'
import { BoldTitle } from '../../components/BoldTitle'
import { FormInput } from '../../components/FormInput'
import { SearchinList } from '../../components/SearchInList';
import { useAlert, useAppInfo, useNotifications } from '../../../../context/context';
import { postInfo } from '../../../../utils/functions';
import './FormNewCellar.css'
import { FormButton } from '../../components/FormButton';

export function FormNewCellar({info,reloadFun}){

    if(info == undefined){
        info = {}
    }

    // Requirements
    const {popOutAlert} = useAlert();
    const {addNotification} = useNotifications();
    const {appInfo} = useAppInfo();
    const [stores,setStores] = useState([])

    //Control
    const [loading,setLoading] = useState(false);
    const [disabled,setDisabled] = useState(false);

    // Form info
    const [name,setName] = useState('');
    const [store_id,setStore_id] = useState(info.id != undefined? info.id:null);
    const [address,setAddress] = useState('');

    const formInfo = {
        company_id:appInfo.company_id,
        store_id,
        name,
        address
    }

    // Functions
    const getStores = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/getStores',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:element.name,
                    value:element.id
                })
            });
            setStores(C)
        }
        setLoading(false);
        setDisabled(false);
    }

    const createCellar = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/inventory/createCellar',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Bodéga ${name} creada`,
                description:`la bodéga ${name} fue creada correctamente.`
            })
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al crea la bodéga ${name}`,
                description:`Hubo unproblema al crear la bodéga ${name}, intentelo nuevamente.`
            })
        }
        popOutAlert();
        setLoading(false)
        setDisabled(false)
    }

    useEffect(()=>{
        if(info.store_id == undefined){
            getStores();
        }
    },[])


    return(
        <div className="FormNewCellar">
            <BoldTitle text={'Nueva bodéga'}/>
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                createCellar();
            }}>
                {info.id == undefined && (
                    <SearchinList title={'Tienda'} action={setStore_id} disabled={disabled} list={stores} placeHolder={'Seleccione una tienda'}/>
                )}
                <FormInput title={'Nombre'} action={setName} disabled={disabled} placeholder={'Nombra tu bodéga'}/>
                <FormInput title={'Dirección'} action={setAddress} disabled={disabled} placeholder={'Cll ...'}/>
                <FormButton text={loading? 'Creando bodéga...':'Crear bodéga'} loading={loading} disabled={disabled}/>                
            </form>
        </div>
    )
}