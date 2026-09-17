
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { urlSer } from '../App';

export const useRealtime = (companyId, onUpdate) => {
    const onUpdateRef = useRef(onUpdate);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);
    
    useEffect(() => {
        if (!companyId) return;

        const socket = io(urlSer, {
            query: { companyId }
        });

        socket.on('db_change', (payload) => {
            onUpdateRef.current(payload);
        });

        return () => socket.disconnect();
    }, [companyId]);
};