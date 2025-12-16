import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context";
import { BoldTitle } from "../../components/BoldTitle";
import { postInfo } from "../../../../utils/functions";
import { FormButton } from "../../components/FormButton";
import { FormInput } from "../../components/FormInput";
import { SearchinList } from "../../components/SearchInList";
import './FormNewCategoryTaxes.css'

export function FormNewCategoryTaxes({reloadFun,info}){
    if(info == undefined){
        info = {}
    }

    //requirements
    const {appInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const [categories,setCategories] = useState([]);
    const {popOutAlert} = useAlert();

    // Control
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false)

    // FormInfo
    const [name,setName] = useState('');
    const [code,setCode] = useState('');
    const [parent_id,setParent_id] = useState(info.id != undefined? info.id:0);
    const [path,setPath] = useState(info.path != undefined? info.path:'/');

    let formInfo = {
        name,
        code,
        parent_id,
        company_id:appInfo.company_id,
        path:path + name
    }

    const getCategories = async()=>{
        setLoading(true);
        setDisabled(true);
        let res = await postInfo('/getTaxCategories',{
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
            setCategories(C)
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

    async function createTaxCategory(){
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/createTaxCategory',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Categoria ${formInfo.name} creada`,
                description:`La catégoria de impuestos ${formInfo.name} fue creada correctamente.`
            })
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al crear la categoría`,
                description:`Hubo un problema al crear la categoría ${formInfo.name}, intentalo de nuevo`
            })
        }
        popOutAlert();
        setLoading(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getCategories();
    },[])

    return(
        <div className="FormNewCategoryTaxes">
            <BoldTitle text={'Nueva categoria impuestos'}/>
            <form action="" onSubmit={(e)=>{
                    e.preventDefault();
                    console.log(formInfo);
                    createTaxCategory();
            }}>
                <FormInput title={'Nombre'} action={setName} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <FormInput title={'Código'} action={setCode} placeholder={'Nombre de tu centro de costo'} disabled={disabled}/>
                <SearchinList title={'Categoria'} action={setIdentationAndId} placeHolder={path !='/' ? path:'/..'} list={categories}/>
                <FormButton text={'Crear centro de costo'} loading={loading}/>
            </form>
        </div>
    )
}