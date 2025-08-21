
import './NotificationCard.css'

export function NotificationCard({info,hidden}){

    console.log('--->',hidden);

    return(
        <div className="NotificationCard" style={{display:`${hidden? 'none':''}`}}>
            <i className="notificationIcon fa-solid fa-boxes-packing"></i>
            <div className="detaislNoti">
                <strong>{info.title}</strong>
                <span>{info.description}</span>
            </div>
            <div className="optionsNoti">
                <i className="fa-solid fa-envelope"></i>
                <i className="fa-solid fa-ellipsis-vertical"></i>
            </div>
        </div>
    )
}