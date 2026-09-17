import { useNotifications } from "../../../context/context"
import { NotificationCard } from "../components/NotificationCard";
import './NotificationsApp.css'

export function NotificationsApp(){

    const {notifications} = useNotifications();

    return(
        <div className="NotificationsApp">
            {notifications.length >0 && notifications.map((element,index)=>(
                <NotificationCard key={`noti_${index}`} type={element.type} title={element.title} description={element.description} index={index} fixed={element.fixed} onClick={element.onClick}/>
            ))}
        </div>
    )
}