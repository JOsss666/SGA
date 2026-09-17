
import { useAlert } from '../../../context/context'
import './AlertContainer.css'

export function AlertContainer({children, fullScale = false, isActive = false, depth = 0, closeLabel = 'Cerrar alerta'}){

    const {popOutAlert} = useAlert();
    return(
        <div
            className={`AlertContainer ${fullScale ? 'fullScale' : ''} ${isActive ? 'active' : 'inactive'}`}
            style={{ '--alert-depth': Math.min(depth, 3) }}
            role={isActive ? 'dialog' : undefined}
            aria-modal={isActive ? 'true' : undefined}
            aria-hidden={!isActive}
            inert={!isActive ? '' : undefined}
        >
            <div className="optionsAlert">
                <button type="button" aria-label={closeLabel} title={closeLabel} onClick={()=>{
                    popOutAlert();
                }} className="closeAlertButton">
                    <i aria-hidden="true" className="fa-solid fa-xmark"/>
                </button>
            </div>
            {children}
        </div>
    )
}
