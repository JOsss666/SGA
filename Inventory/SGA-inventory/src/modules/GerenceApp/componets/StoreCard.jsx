
import './StoreCard.css'

export function StoreCard({info,onClick}){
    return(
        <div className="StoreCard" onClick={onClick}>
            <img src="https://i.pinimg.com/1200x/44/b1/4a/44b14a8b2fc649b18b3671f878af65c9.jpg" alt="" />
            <div className="StoreInfo">
                <strong>{info.name}</strong>
                <span>{info.location}</span>
            </div>
        </div>
    )
}