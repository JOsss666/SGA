
import './CreateNewSubSection.css'
import { useAlert } from '../../../context/context';
import { FormNewSubCategory} from '../containers/forms/FormNewSubCategory';

export function CreateNewSubSection({father,reloadFun}){
    const {setOpenAlert,popInAlert} = useAlert();
    return(
        <div className="CreateNewSubSection">
            <div className="borderTreeIndicator"/>
            <strong onClick={()=>{
                setOpenAlert(true)
                popInAlert(<FormNewSubCategory father={father} reoladFunction={reloadFun} />)
            }}><i className="fa-solid fa-plus"/>Crear nueva sub-Categoria de {father.father_id != undefined? father.subCategory_name:father.category_name}</strong>
        </div>
    )
}