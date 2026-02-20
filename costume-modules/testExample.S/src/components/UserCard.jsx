
import './UserCard.css'

export function UserCard({name,desc,imgSrc,onClick}){
    return(
        <div className="UserCard" onClick={onClick}>
            <img src={imgSrc} alt="" />
            <div className="infoUser">
                <strong>{name}</strong>
                <span>{desc}</span>
            </div>
        </div>
    )
}