import './Messages.css';
import { useState, useEffect, useRef } from 'react';
import { BoldTitle } from '../components/BoldTitle';
import { SearchBar } from '../components/SearchBar';
import { MessagesCard } from '../components/MessagesCard';
import { FormButton } from '../components/FormButton';
import { postInfo } from '../../../utils/functions';
import { useAppInfo } from '../../../context/context';

export function Messages() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    
    const [messages, setMessages] = useState({});
    
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { appInfo } = useAppInfo();

    const getUsers = async () => {
        setLoading(true);
        try {
            let res = await postInfo('/getUsers', {
                company_id: appInfo.company_id
            });
            
            console.log('🔍 RESPUESTA DE LA API:', res);
            
            if (res[0] && Array.isArray(res[1])) {
                console.log(`${res[1].length}`);
                
                const chatUsers = res[1].map((apiUser, index) => {
                    let userName = apiUser.user_name || 'Usuario';
                    
                    return {
                        id: apiUser.user_id || apiUser.id || index,
                        name: userName,
                        email: apiUser.user_mail || apiUser.email || '',
                        originalUser: apiUser,

                        last_message: "Haz clic para empezar a chatear",
                        last_message_time: new Date().toISOString(),
                        unread_count: 0,
                        is_online: Math.random() > 0.5,
                        
                        profile_picture: apiUser.profile_picture || 
                                       apiUser.avatar || 
                                       'https://i0.wp.com/digitalhealthskills.com/wp-content/uploads/2022/11/3da39-no-user-image-icon-27.png?fit=500%2C500&ssl=1'
                    };
                });
                
                console.log('👥 Usuarios cargados:', chatUsers);

                const initialMessages = {};
                chatUsers.forEach(user => {
                    initialMessages[user.id] = [];
                });
                
                setMessages(initialMessages);
                setUsers(chatUsers);
                setFilteredUsers(chatUsers);
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        getUsers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    useEffect(() => {
        scrollToBottom();
    }, [selectedUser, messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setNewMessage(''); 

        if (user.unread_count > 0) {
            const updatedUsers = users.map(u => {
                if (u.id === user.id) {
                    return { ...u, unread_count: 0 };
                }
                return u;
            });
            setUsers(updatedUsers);
        }
    };

    const handleSendMessage = () => {
        if (newMessage.trim() === '' || !selectedUser) return;

        const timestampISO = new Date().toISOString();
        const timestampReadable = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const newMsg = {
            id: Date.now(), 
            text: newMessage,
            sender: 'me',
            time: timestampReadable,
            timestamp: timestampISO
        };

        setMessages(prevMessages => ({
            ...prevMessages,
            [selectedUser.id]: [...(prevMessages[selectedUser.id] || []), newMsg]
        }));
        
        setUsers(prevUsers => {
            return prevUsers.map(user => {
                if (user.id === selectedUser.id) {
                    return {
                        ...user,
                        last_message: newMessage,
                        last_message_time: timestampISO,
                        unread_count: 0
                    };
                }
                return user;
            });
        });
        
        setSelectedUser(prev => ({
            ...prev,
            last_message: newMessage,
            last_message_time: timestampISO,
            unread_count: 0
        }));
        
        setNewMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getCurrentMessages = () => {
        if (!selectedUser) return [];
        return messages[selectedUser.id] || [];
    };

    return (
        <div className="Messages appSection">
            <div className="usersPanel">
                <div className="panelHeader">
                    <BoldTitle text={'Mensajes'} />
                    <div className="searchContainer">
                        <SearchBar 
                            placeholder={'Buscar chat...'}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="usersList">
                    {loading ? (
                        <div className="loadingState">
                            <span>Cargando usuarios...</span>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <MessagesCard
                                key={user.id}
                                user={user}
                                isSelected={selectedUser?.id === user.id}
                                onClick={() => handleSelectUser(user)}
                            />
                        ))
                    ) : (
                        <div className="emptyState">
                            <span>No hay usuarios disponibles</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="chatPanel">
                {selectedUser ? (
                    <div className="ChatWindow">
                        <div className="chatHeader">
                            <div className="chatUserInfo">
                                <img 
                                    src={selectedUser.profile_picture}
                                    alt={selectedUser.name}
                                    className="chatAvatar"
                                />
                                <div className="chatUserDetails">
                                    <h3 className="chatUserName">{selectedUser.name}</h3>
                                    <span className="userStatus">
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="messagesArea">
                            {getCurrentMessages().map((message) => (
                                <div 
                                    key={message.id} 
                                    className={`messageBubble ${message.sender}`}
                                >
                                    <div className="messageContent">
                                        <p>{message.text}</p>
                                        <span className="messageTime">{message.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="messageInputContainer">
                            <textarea
                                className="messageInput"
                                placeholder={`Escribe un mensaje a ${selectedUser.name}...`}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                rows="1"
                            />
                            <FormButton
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                text="Enviar"
                                className="sendButton debug-button-border"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="noChatSelected">
                        <div className="welcomeMessage">
                            <i className="fa-solid fa-comments" />
                            <h3>Selecciona una conversación</h3>
                            <p>Elige un usuario de la lista para comenzar a chatear</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}