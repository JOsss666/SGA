
import './UserCard.css'

export function UserCard({name,desc,imgSrc}){
    return(
        <div className="UserCard">
            <img src={imgSrc} alt="" />
            <div className="infoUser">
                <strong>{name}</strong>
                <span>{desc}</span>
            </div>
        </div>
    )
}