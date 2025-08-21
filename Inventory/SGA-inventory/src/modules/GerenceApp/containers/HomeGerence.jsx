
import { SectionTitle } from '../componets/SectionTitle'
import { SubSectionTitle } from '../componets/SubSectionTitle'
import { ChatDisplay } from './ChatsDisplay'
import './HomeGerence.css'
import { Notifications } from './Notifications'

export function HomeGerence({userInfo,notifications}){
    return(
        <div className="HomeGerence appSection">
            <div className="newsHome">
                <SectionTitle text={'Bienvenido José Murillo'}/>
                <div className="spaceNews"></div>
            </div>
            <div className="NotificationsPanel">
                <SubSectionTitle text={'Notificaciones'}/>
                <Notifications notifications={notifications}/>
            </div>
            <div className="chatDisplay">
                <SubSectionTitle text={'Chats'}/>
                <ChatDisplay/>
            </div>
            <div className='quickStadistics'>
                
            </div>
        </div>
    )
}