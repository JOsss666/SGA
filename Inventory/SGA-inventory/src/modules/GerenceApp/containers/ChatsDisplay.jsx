import { useEffect, useState } from "react";
import { SearchBar } from "../componets/SearchBar";
import { ChatCard } from "../componets/ChatCard";
import './ChatsDisplay.css'
import { ChatActive } from "./ChatActive";

export function ChatDisplay(){
    const [openChat,setOpenChat] = useState({});
    const [searchChat,setSearchChat] = useState('')
    const testChat = {
        chatName:'Nombre del chat',
        lastMessage:'Prueba de ultimo mensaje',
        lastUpdate:'3/06/2025',
        noRead:12,
        chat_id:1
    }
    const testChat3 = {
            chatName:'José Miguel Murillo Romero',
            lastMessage:'Por favor enviar factura a mi correo',
            lastUpdate:'4/06/2025',
            noRead:2,
            chat_id:3
        }
    const testChat2 = {
        chatName:'Chat No 2',
        lastMessage:'Prueba de ultimo mensaje',
        lastUpdate:'3/06/2025',
        noRead:5,
        chat_id:2
    }

    const FilterChats = (info)=>{
        if(searchChat != ''){
            return (
                !((info.chatName.toLowerCase()).includes(searchChat.toLowerCase()) || 
                (info.chatName.toLowerCase()) == searchChat.toLowerCase())
            )
        }else{return false}
    }

    useEffect(()=>{
        setSearchChat('');
    },[openChat])

    return(
        <div className="ChatDisplay">
            {openChat.chat_id == undefined && (
                <div className="homeChats">
                    <SearchBar action={setSearchChat} placeholder={'Buscar Chat'}/>
                    <div className="chatsGrid">
                        <ChatCard setActiveChat={setOpenChat} info={testChat3} hidden={FilterChats(testChat)}/>
                        <ChatCard setActiveChat={setOpenChat} info={testChat2} hidden={FilterChats(testChat2)}/>
                        <ChatCard setActiveChat={setOpenChat} info={testChat} hidden={FilterChats(testChat)}/>
                        <ChatCard setActiveChat={setOpenChat} info={testChat2} hidden={FilterChats(testChat2)}/>
                        <ChatCard setActiveChat={setOpenChat} info={testChat} hidden={FilterChats(testChat)}/>
                        <ChatCard setActiveChat={setOpenChat} info={testChat2} hidden={FilterChats(testChat2)}/>
                        <ChatCard setActiveChat={setOpenChat} info={testChat} hidden={FilterChats(testChat)}/>
                        <ChatCard setActiveChat={setOpenChat} info={testChat2} hidden={FilterChats(testChat2)}/>
                    </div>
                </div>
            ) }
            {openChat.chat_id != undefined && (
                <ChatActive info={openChat} setOpenChat={setOpenChat}/>
            )}
        </div>
    )
}