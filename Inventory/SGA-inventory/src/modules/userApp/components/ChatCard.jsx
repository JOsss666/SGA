import './ChatCard.css'

export function ChatCard({info,hidden,setActiveChat}){
    return(
        <div onClick={()=>{setActiveChat(info)}} className="ChatCard" style={{display:hidden? 'none':''}}>
            <div className="chatInfo">
                <strong>{info.chatName}</strong>
                <span>{info.lastMessage}</span>
            </div>
            <div className="chatAditionalData">
                <span>{info.lastUpdate}</span>
                <div className="newMessages">
                    {info.noRead}
                </div>
            </div>
        </div>
    )
}
