import { useEffect, useState } from "react";
import { useAlert, useAppInfo, useNotifications } from "../../../../context/context"
import { SearchinList } from "../../components/SearchInList";
import { BoldTitle } from "../../components/BoldTitle";
import { FormInput } from "../../components/FormInput";
import { postInfo } from "../../../../utils/functions";
import { FormButton } from "../../components/FormButton";
import './FormNewCategory.css'
import { FileInput } from "../../components/FileInput";

export function FormNewCategory({info,reloadFun}){

    //Reuqirements
    const {appInfo} = useAppInfo();
    const {addNotification} = useNotifications();
    const {popOutAlert} = useAlert();
    const [categories,setCategories] = useState([]);

    // Control
    const [disabled,setDisabled] = useState();
    const [loading,setLoading] = useState();

    // FormInfo
    const [photo,setPhoto] = useState('https://res.cloudinary.com/djjxugmni/image/upload/v1764620093/ChatGPT_Image_1_dic_2025_15_04_38_3_hcdqxl.png');
    const [name,setName] = useState('');
    const [description,setDescription] = useState('');
    const [parent_id,setParent_id] = useState(0);
    const [path,setPath] = useState('');
    const [slug,setSlug] = useState('');
    const [status,setStatus] = useState('active');

    const formInfo = {
        photo,
        company_id:appInfo.company_id,
        name,
        description,
        parent_id,
        path,
        slug,
        status
    }

    // Creation function

    const createCategory = async()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/inventory/createCategory',formInfo);
        if(res[0]){
            addNotification({
                type:'aproved',
                title:`Categoría "${name}" creada`,
                description:`La categoría ${name} fue creada correctamente.`
            });
            popOutAlert();
            if(reloadFun != undefined){
                reloadFun();
            }
        }else{
            addNotification({
                type:'error',
                title:`Error al crear la Categoría "${name}"`,
                description:`Hubo un problema al crear la ctegoría ${name}, intentelo de nuevo.`
            });
        }
        setLoading(false);
        setDisabled(false);
        popOutAlert();
    }


    // Preload Functions
    const getCategories = async()=>{
        setLoading(true);
        setDisabled(true);
        let res = await postInfo('/inventory/getCategories',{
            company_id:appInfo.company_id
        });
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                C.push({
                    text:`${element.name}`,
                    value:element.id
                })
                setCategories(C)
            });
        }
        setLoading(false)
        setDisabled(false)
    }


    // Preload Events
    useEffect(()=>{
        getCategories();
    },[])

    return(
        <div className="FormNewCategory">
            <BoldTitle text={'Nueva Categoria'}/>
            <form action="" disabled={disabled} onSubmit={(e)=>{
                e.preventDefault();
                createCategory();
            }}>
                <div className="userPhoto">
                    <div className="actualPhoto">
                        <img src={photo} alt="" />
                    </div>
                    <FileInput action={setPhoto} placeholder={'Seleccionar nueva foto'}>
                        <i className="fa-solid fa-camera"/>
                    </FileInput>
                </div>
                <FormInput action={setName} title={'Nombre'} placeholder={'Nombre de la categoria'} disabled={disabled}/>
                <FormInput action={setDescription} title={'Descripción'} placeholder={'Que agrupa tu categoria'} disabled={disabled}/>
                <SearchinList title={'Categorias'} action={setParent_id} placeHolder={'Seleccine una o varias'} list={categories} disabled={disabled}/>
                <SearchinList action={setStatus} value={'Activo'} title={'Estado de la categoría'} placeHolder={'Seleccioe el estado de la categoría'} list={[
                    {text:'Activo',value:'active'},
                    {text:'Desactivado',value:'disabled'},
                    {text:'Bloqueado',value:'blocked'},
                    {text:'Reportado',value:'reported'}
                ]}/>
                <FormButton text={loading? 'Creando categoría':'Crear categoría'} loading={loading} disabled={disabled}/>
            </form>
        </div>
    )
}