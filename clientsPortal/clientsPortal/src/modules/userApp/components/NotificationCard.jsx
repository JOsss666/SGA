import { useEffect, useState } from "react"
import './NotificationCard.css'
import { useNotifications } from "../../../context/context";

export function NotificationCard({type,title,description,id,fixed,onClick}){
    const [fixedNotification,setFixedNotification] = useState(fixed != undefined? fixed:false);
    const [visibleDescription,setVisibleDescription] = useState(true);
    const [desapearCard,setDesapearCard] = useState(false)
    const {deleteNotification} = useNotifications();
    const [timeNoti,setTimeNoti] = useState(5);
    const typeNotifications = {
        'aproved': <i className="fa-regular fa-circle-check aproved"/>,
        'error': <i className="fa-regular fa-circle-xmark error"/>,
        'AI':<img src="https://i.pinimg.com/1200x/c0/1a/9c/c01a9c2c1663ee8e03632fa7e11571aa.jpg" alt="" />,
        'info': <i className="fa-solid fa-circle-info info"/>,
        'warning':<i className="fa-solid fa-triangle-exclamation warning"/>
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
        <div className={`NotificationCard ${desapearCard? 'despearNotificationCard':''}`} onClick={onClick} >
            <div className="headNotification">
                <div className="iconC">
                    {typeNotifications[type]}
                </div>
                <strong>{title}</strong>
                <div className="optionsNoti">
                    {description != undefined && (
                        <i title="Ver descripción" onClick={()=>{setVisibleDescription(!visibleDescription)}} className={`fa-solid fa-angle-${visibleDescription? 'down':'up'}`}/>
                    )}
                    <i onClick={()=>{
                        setDesapearCard(true);
                        deleteNotification(id)
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