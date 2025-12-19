import './MessagesCard.css';
import { useState, useEffect, useMemo } from 'react';

// Función para formatear la hora (PERMANECE IGUAL)
const formatMessageTime = (timestamp) => {
    if (!timestamp) return 'Nuevo';
    
    try {
        const now = new Date();
        const messageDate = new Date(timestamp);
        
        if (isNaN(messageDate.getTime())) return 'Nuevo';
        
        const diffMs = now - messageDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffDays === 0) {
            if (diffMins < 1) return 'Ahora';
            if (diffMins < 60) return `Hace ${diffMins} min`;
            return messageDate.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            });
        }
        
        if (diffDays === 1) return 'Ayer';
        
        if (diffDays < 7) {
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return days[messageDate.getDay()];
        }

        const currentYear = now.getFullYear();
        const messageYear = messageDate.getFullYear();
        
        if (messageYear === currentYear) {
            return messageDate.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit'
            });
        } else {
            return messageDate.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }
        
    } catch (error) {
        return 'Nuevo';
    }
};

export function MessagesCard({ user, isSelected, onClick }) {
    const [currentTime, setCurrentTime] = useState(Date.now());
    
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);
        
        return () => clearInterval(intervalId);
    }, []);
    
    const formattedTime = useMemo(() => {
        return formatMessageTime(user.last_message_time);
    }, [user.last_message_time, currentTime]);
    
    return (
        <div 
            className={`MessagesCard ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <div className="AvatarSection">
                <img 
                    src={user.profile_picture || 'https://i.pinimg.com/736x/fc/55/78/fc557891f4587e03e4eaaea18a4bc9c3.jpg'}
                    alt={user.name}
                    className="UserAvatar"
                />
                
                <div className={`OnlineIndicator ${user.is_online ? 'online' : 'offline'}`} />
                
                {user.unread_count > 0 && (
                    <div className="UnreadBadge">
                        <span>{user.unread_count}</span>
                    </div>
                )}
            </div>

            <div className="CardContent">
                <div className="CardHeader">
                    <div className="NameSection">
                        <h4 className="UserName">{user.name}</h4>
                    </div>
                    
                    <div className="TimeSection">
                        <span className="MessageTime">{formattedTime}</span>
                    </div>
                </div>

                <div className="CardFooter">
                    <p className="LastMessage">
                        {user.last_message || 'Haz clic para empezar a chatear'}
                    </p>
                </div>
            </div>
        </div>
    );
}