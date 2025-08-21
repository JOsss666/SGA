
import './UserCard.css'

export function UserCard({img,icon,name,roll,onClick}){
    return(
        <div className="UserCard" onClick={onClick}>
            {icon == undefined && (
                <img src="" alt="" />
            )}
            {icon != undefined && img == undefined && (
                <div className="iconContainer">
                    {icon}
                </div>
            )}
            <div className="userCardInfo">
                <strong>{name}</strong>
                <span>{roll}</span>
            </div>
        </div>
    )
}