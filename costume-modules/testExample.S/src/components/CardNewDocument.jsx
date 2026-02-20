
import './CardNewDocument.css'

export function CardNewDocument({onCLick,title,description}){
    return(
        <div onClick={onCLick} className="CardNewDocument">
            <i title='Ver Tutorial' className="fa-brands fa-youtube tutorialCard"/>
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
    )
}