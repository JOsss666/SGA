import './CardTitleLogo.css'

export function CardTitleLogo({title,children}){
    return(
        <div className="CardTitleLogo">
            <h4>{title}</h4>
            {children}
        </div>
    )
}