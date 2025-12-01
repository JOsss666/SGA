
import './NormalCard.css'

export function NormalCard({title,description,onClick}){
    return(
        <div className="NormalCard" onClick={onClick}>
                <strong>{title}</strong>
                <span>{description}</span>
        </div>
    )
}