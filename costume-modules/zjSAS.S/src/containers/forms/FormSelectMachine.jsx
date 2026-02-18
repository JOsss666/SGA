import { BoldTitle } from "../../components/BoldTitle";


export function FormSelectMachine(){

    //formInfo
    const formInfo = {
        document_type:"Machine use"
    }

    return(
        <div className="FormSelectMachine">
            <BoldTitle text={'Seleccion de maquinaria'}/>
        </div>
    )
}