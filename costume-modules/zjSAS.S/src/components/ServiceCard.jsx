import './ServiceCard.css'

export function ServiceCard({info,onClick}){
    return(
        <div onClick={onClick} className={`ServiceCard ${info.className}`}>
            <img src={info.img} alt="" />
            <strong>{info.title}</strong>
        </div>
    )
}