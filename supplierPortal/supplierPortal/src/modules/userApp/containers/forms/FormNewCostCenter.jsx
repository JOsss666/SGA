import { useEffect, useState } from "react";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { FormButton } from "../../components/FormButton";
import './FormNewCostCenter.css'
import { postInfo } from "../../../../utils/functions";
import { SearchinList } from "../../components/SearchInList";

export function FormNewCostCenter({reloadFun,info}){
    if(info == undefined){
        info = {}
    }
    const {addNotification} = useNotifications();
    const {popOutAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false)
    const [costCenters,setCostCenters] = useState('');
    // Cost Center Info
    const [name,setName] = useState('');
    const [code,setCode] = useState('');
    const [description,setDescription] = useState('')
    const [parent_id,setParent_id] = useState(info.id != undefined? info.id:0);
    const [path,setPath] = useState(info.path != undefined? info.path:'/');

    let formInfo = {
        name,
        code,
        description,
        parent_id,
        company_id:appInfo.company_id,
        path:path + name
    }

    const getCostCenters = async()=>{
        setLoading(true);
        setDisabled(true);
        let res = await postInfo('/getCostCenters',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                let level = (element.path.split('/')).length -1;
                const indent = "\t".repeat(level);
                C.push({
                    text:`${indent}${element.name}`,
                    value:`${element.id}&&${element.path}/`
                })
            });
            setCostCenters(C)
        }
        setLoading(false);
        setDisabled(false);
    }

    const setIdentationAndId = (text)=>{
        let data = text.split('&&');
        if(data[0] == ''){
            if(info != undefined && info.id != undefined){
                setParent_id(info.id)
                setPath(`${info.path}/${info.name}/`);
            }else{
                setParent_id(0)
                setPath('/')
            }
        }else{
            setParent_id(data[0] != ''? data[0]:0);
            setPath(data[1] != undefined? data[1]:'/');
        }
    }

    async function createCostCenter(){
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createCostCenter',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Centro de costo ${formInfo.name} creado`,
                description:`El centro de costo ${formInfo.name} fue creado correctamente.`
            })
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al crear centro de costo`,
                description:`Hubo un problema al crear el centro de costo ${formInfo.name}, intentalo de nuevo`
            })
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getCostCenters();
    },[])

    return(
        <div className="FormNewCostCenter">
            <BoldTitle text={'Nuevo centro de costo'} />
            <form action="" onSubmit={(e)=>{
                e.preventDefault();
                createCostCenter();
            }}>
                <FormInput title={'Nombre'} action={setName} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <FormInput title={'Código'} action={setCode} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <FormInput title={'Descripción'} action={setDescription} textArea={true} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <SearchinList title={'Clasificación Centro de costo'} action={setIdentationAndId} placeHolder={path !='/' ? path:'/..'} list={costCenters}/>
                <FormButton text={'Crear centro de costo'} loading={loading}/>
            </form>
        </div>
    )
}