import {FormButton} from '../components/FormButton'
import {useAlert} from '../../../context/context'

export function BussinesUnits(){
    const {popInAlert} = useAlert();

    return(
        <div className="BussinesUnits">
            Unidades de negocio
            <FormButton text={'Crear nueva unidad de negoció'} onClick={()=>{
                popInAlert(<span>
                    Formulario para nueva unidad de negocio
                </span>)
            }}/>
        </div>
    )
}