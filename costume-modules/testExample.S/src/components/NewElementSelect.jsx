
import './NewElementSelect.css'

export function NewElementSelect({title,onClick}){

    
    return(
        <div className="NewElementSelect" onClick={onClick}>
            <i className="fa-solid fa-plus"/>
            <strong>{title}</strong>
        </div>
    )
}