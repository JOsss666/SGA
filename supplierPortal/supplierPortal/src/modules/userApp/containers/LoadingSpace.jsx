
import './LoadingSpace.css'

export function LoadingSpace({title,description}){
    return(
        <div className="LoadingSpace">
            <i className="fa-solid fa-spinner loadingIcon"/>
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
    )
}