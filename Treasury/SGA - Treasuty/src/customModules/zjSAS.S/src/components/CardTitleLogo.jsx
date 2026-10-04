import './CardTitleLogo.css'

export function CardTitleLogo({onClick,title,children}){
    return(
        <div onClick={onClick} className="CardTitleLogo">
            <h4>{title}</h4>
            {children}
        </div>
    )
}