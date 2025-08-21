
import { useAlert } from '../../../context/context'
import './AlertContainer.css'

export function AlertContainer({children}){

    const {popOutAlert} = useAlert();

    return(
        <div className="AlertContainer">
            <div className="optionsAlert">
                <i title='Cerrar' onClick={()=>{
                    popOutAlert();
                }} className="fa-solid fa-xmark"/>
            </div>
            {children}
        </div>
    )
}