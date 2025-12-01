import './ServiceCard.css'

export function ServiceCard({info,onClick}){
    return(
        <div onClick={onClick} className={`ServiceCard ${info.className}`}>
            <strong>{info.title}</strong>
        </div>
    )
}