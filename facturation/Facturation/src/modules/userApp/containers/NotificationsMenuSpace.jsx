import { useEffect, useState } from "react";
import { useAppInfo, useNotifications } from "../../../context/context"
import { BoldTitle } from "../components/BoldTitle";
import { NotificationCard } from "../components/NotificationCard";
import { TagIndicator } from "../components/TagIndicator";
import './NotificationsMenuSpace.css'
import { ButtonMenu } from "../components/ButtonMenu";
import {useRealtime} from '../../../utils/useRealTime.js'

export function NotificationsMenuSpace({visible}){
    const {appInfo} = useAppInfo();
    const {notifications,addNotification,clearNotifications} = useNotifications();
    const [notiList,setNotiList] = useState([]);
    const [actualType,setActualType] = useState(0);
    const [order,setOrder] = useState(true);

    const types = [
        {title:'Todas',value:notifications.length,types:'all'},
        {title:'Sistema',value:notifications.length,types:['info','aproved','error']},
        {title:'SGA - IA',value:notifications.length,types:['AI']}
    ]

    const filterNoti = ()=>{
        const notis = [...notifications].reverse();
        const filters = types[actualType].types
        if (filters !== 'all') {
            let C = []
            notis.forEach(element => {
                if(filters.includes(element.type)){
                    C.push(element)
                }
            });
            setNotiList(C);
        }else{
            setNotiList(notis)
        }
    }

    useRealtime(appInfo.company_id, (payload)=>{
        console.log(`Cambio en la base de datos --> ${payload}`)
    });

    useEffect(()=>{
        filterNoti()
    },[notifications,actualType])

    return(
        <div className={`NotificationsMenuSpace ${visible? 'visibleSpaceNoti':'hiddenSpaceNoti'}`}>
            <BoldTitle text={'Notificaciones'}/>
            <div className="optionsSpaceNoti">
                <ButtonMenu title={`Orden ${!order? 'Ascendente':'Descendente'}`} noRotate={true} onClick={()=>{setOrder(!order);}}>
                    <i className={`fa-solid fa-arrow-${!order? 'up':'down'}-short-wide`}/>
                </ButtonMenu>
                <ButtonMenu title={'Marcar como leidas'} noRotate={true} onClick={()=>{clearNotifications();}}>
                    <i className="fa-regular fa-envelope-open"/>
                </ButtonMenu>
                <ButtonMenu title={'Eliminar notificaciones'} noRotate={true} onClick={()=>{clearNotifications();}}>
                    <i className="fa-solid fa-trash" />
                </ButtonMenu>
                <ButtonMenu title={'Refrescar'} onClick={()=>{
                    addNotification({
                        type:'AI',
                        title:`Notificación de prueba ${notifications.length + 1}`,
                        description:'Esta es una notificatción de prueba'
                    })
                }}>
                    <i className="fa-solid fa-arrow-rotate-right" />
                </ButtonMenu>
            </div>
            <div className="switchTypes">
                {types.map((element,index)=>(
                    <div className={`typeNoti ${actualType == index? 'actualType':''}`} key={index} onClick={()=>{
                        setActualType(index)
                    }}>
                        <span>{element.title}</span>
                        <TagIndicator title={element.value}/>
                    </div>
                ))}
            </div>
            <div className="notiResGrid">
                {notiList.map((element,index)=>(
                    <NotificationCard key={index} title={element.title} type={element.type} description={element.description} fixed={true} onClick={element.onClick}/>
                ))}
            </div>
        </div>
    )
}