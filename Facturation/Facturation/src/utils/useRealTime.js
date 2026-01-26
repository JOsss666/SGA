
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { urlSer } from '../App';
import { useNotifications } from '../context/context';

export const useRealtime = (companyId, onUpdate) => {
    const {addNotification} = useNotifications()
    
    useEffect(() => {
        if (!companyId) return;

        const socket = io(urlSer, {
            query: { companyId }
        });

        socket.on('db_change', (payload) => {
            console.log('Cambio detectado en base de datos:', JSON.stringify(payload));
            socket.on('db_change',()=>{
                addNotification({
                    type:'info',
                    title:'Cambio en la base de datos',
                    description:'Se detecto un cambio en la base de datos'
                })
            })
            onUpdate(payload);
        });

        return () => socket.disconnect();
    }, [companyId]);
};