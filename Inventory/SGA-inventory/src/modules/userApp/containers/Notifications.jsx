
import { useState } from 'react'
import { NotificationCard } from '../components/NotificationCard'
import './Notifications.css'
import { SearchBar } from '../components/SearchBar'

export function Notifications({title,notifications}){

    const [searchValue,setSearchValue] = useState("");

    const hideNotification = (element)=>{
        let s = false;
        if(searchValue != ''){
            if((element.title.toLowerCase()).includes(searchValue) || (element.description.toLowerCase()).includes(searchValue)){
                s  = false
            }else{s = true;}
        }else{
            s = false;
        }
        return(s)
    }

    return(
        <div className="Notifications">
            {title &&(
                <>
                    <div className="headNotifications">
                        <strong>Centro de Notificaciones</strong>
                        <button title='Borrar todo' className='clearNotifications'>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    <SearchBar placeholder={'Buscar Notificación'} action={setSearchValue}/>
                </>
            )}
            <div className="NotiGrid">
                {notifications && notifications.map((element,index)=>(
                    <NotificationCard key={index} info={element} hidden={hideNotification(element)}/>
                ))}
            </div>
        </div>
    )
}