import { useNotifications } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle";
import { NotificationCard } from "../components/NotificationCard";
import './NotificationsMenuSpace.css'

export function NotificationsMenuSpace({visible}){

    const {notifications} = useNotifications();

    return(
        <div className={`NotificationsMenuSpace ${visible? 'visibleSpaceNoti':'hiddenSpaceNoti'}`}>
            <BoldTitle text={'Notificaciones'}/>
            <div className="notiResGrid">
                {notifications.map((element,index)=>(
                    <NotificationCard key={index} title={element.title} type={element.type} description={element.description} fixed={true}/>
                ))}
            </div>
        </div>
    )
}