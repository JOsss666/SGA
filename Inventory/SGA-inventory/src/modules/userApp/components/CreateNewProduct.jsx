
import { useAlert } from '../../../context/context'
import { FormNewProduct } from '../containers/forms/FormNewProduct';
import './CreateNewProduct.css'

export function CreateNewProduct({father,reloadFun}){
    const {setOpenAlert,popInAlert} = useAlert();

    console.log(reloadFun)

    return(
        <div onClick={()=>{
            popInAlert(<FormNewProduct father={father} reloadFun={reloadFun}/>)
            setOpenAlert(true)
        }} className="CreateNewProduct">
            <div className="indicator"/>
            <i className="fa-solid fa-boxes-packing"/>
            <strong>Añadir nuevo producto a {father.father_id != undefined? father.subCategory_name:father.category_name}</strong>
        </div>
    )
}