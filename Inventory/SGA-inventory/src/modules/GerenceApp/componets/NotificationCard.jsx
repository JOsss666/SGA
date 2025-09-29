import { useEffect, useState } from "react"
import './NotificationCard.css'
import { useNotifications } from "../../../context/context";

export function NotificationCard({type,title,description,index,fixed}){

    const [fixedNotification,setFixedNotification] = useState(fixed != undefined? fixed:false);
    const [visibleDescription,setVisibleDescription] = useState(true);
    const [desapearCard,setDesapearCard] = useState(false)
    const {deleteNotification} = useNotifications();
    const [timeNoti,setTimeNoti] = useState(5);
    const typeNotifications = {
        'aproved': 'fa-regular fa-circle-check aproved',
        'error': 'fa-regular fa-circle-xmark error',
        'info': 'fa-solid fa-circle-info info',
        'warning':'fa-solid fa-triangle-exclamation warning'
    }

    useEffect(() => {
        if (fixedNotification) return; // si está fijo, no programar desaparición

        const timer = setTimeout(() => {
            setDesapearCard(true);
        }, 5000);

        return () => clearTimeout(timer); // limpiar si cambia fixedNotification o desmonta
    }, [fixedNotification]);


    useEffect(()=>{
        setInterval(() => {
            setTimeNoti((prev) => prev - 0.5);
        }, 1000);
    },[])

    return(
        <div className={`NotificationCard ${desapearCard? 'despearNotificationCard':''}`}>
            <div className="headNotification">
                <i className={`indicatorNoti ${typeNotifications[type]}`}/>
                <strong>{title}</strong>
                <div className="optionsNoti">
                    {description != undefined && (
                        <i title="Ver descripción" onClick={()=>{setVisibleDescription(!visibleDescription)}} className={`fa-solid fa-angle-${visibleDescription? 'down':'up'}`}/>
                    )}
                    <i onClick={()=>{
                        setDesapearCard(true);
                    }} title="Eliminar notificación" className="fa-solid fa-xmark"/>
                </div>
            </div>
            {visibleDescription && (
                <span className="description">{description}</span>
            )}
            {!fixedNotification && (
                <>
                    <div className="timerIndicator">
                    <span>
                        Este mensaje se cerrara en {timeNoti} segundos <b onClick={()=>{setFixedNotification(true)}}>Click para parar.</b>
                    </span>
                    </div>
                    <div className="progressBar">
                        <div className="progress" style={{width:`${100-((timeNoti/5)*100)}%`}}></div>
                    </div>
                </>
            )}
        </div>
    )
}