import { BoldTitle } from "../../componets/BoldTitle"
import { FormButton } from "../../componets/FormButton"
import { FormInput } from "../../componets/FormInput"
import { useEffect, useState } from "react"
import { postInfo } from "../../../../utils/functions"
import { useAlert } from "../../../../context/context"
import { useAppInfo } from "../../../../context/context"
import './FormNewSubCategory.css'
import { SearchinList } from "../../componets/SearchInList"


export function FormNewSubCategory({reoladFunction}){

    const {appInfo} = useAppInfo();
    const {setOpenAlert,popOutAlert} = useAlert();
    const [categories,setCategories] = useState();
    const [category_name,setName] = useState('');
    const [category_description,setDescription] = useState('')
    const [category_color,setColor] = useState('#D9D9D9')
    const [category_code,setCategoryCode] = useState();
    const [loading,setLoading] = useState(false)
    const [disabled,setDisabled] = useState(false)

        const formInfo = {
        category_code,
        category_name,
        category_description,
        category_color,
        company_id: appInfo.company_id
    }

    
    const createForm = async()=>{
        setDisabled(true);
        setLoading(true);
        console.log(formInfo);
        let response = await postInfo('/createSubCategory',formInfo);
        console.log(response)
        setLoading(false)
        setDisabled(false)
        setOpenAlert(false)
        if(reoladFunction != undefined){
            reoladFunction();
            popOutAlert();
        }
    }

    const getCategories = async()=>{
        let res = await postInfo('/getSubCategories',{company_id:appInfo.company_id});
        if(res[0]){
            let C = [];
            res[1].forEach(element => {
                let tabs = (element.category_code).split(";");
                C.push({
                    text:`${" ".repeat(tabs.length)}${element.category_name}`,
                    value:element.category_id,
                })
            });
            setCategories(C)
        }
        
    }

    useEffect(()=>{
        getCategories();
    })

    return(
        <div className="FormNewSubCategory">
            <BoldTitle text={`Nueva Categoria`}/>
            <form action="">
                <SearchinList action={setCategoryCode} title={"Agregar a "} placeHolder={'Categoria existente o nueva'} list={categories!= null? categories:[
                    {text:"Crear nueva categoria raiz",value:0}
                ]}/>
                <FormInput action={setName} disabled={disabled} title={'Nombre'} placeholder={'Nombre de la sub-categoria'} type={'text'}/>
                <FormInput action={setDescription} disabled={disabled} title={'Descripción'} textArea={true} placeholder={'Descipción de la sub-categoria (Opcional)'} type={'text'}/>
                <FormButton onClick={(e)=>{e.preventDefault();createForm()}} disabled={disabled} text={'Crear categoria'}/>
            </form>
            {loading && (
                <span>Enviando Información ...</span>
            )}
        </div>
    )
}