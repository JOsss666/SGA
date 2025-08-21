
import './WarningForm.css'

export function WarningForm({type,tittle,desc,val,children}){
    return(
        <div className={`WarningForm ${type}`}>
            <h5>{tittle}<i className="fa-solid fa-circle-info"/></h5> 
            <span>{desc}<strong>{val}</strong></span>
        </div>
    )
}