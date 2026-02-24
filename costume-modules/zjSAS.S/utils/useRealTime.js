
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import {urlSer} from './functions'

export const useRealtime = (companyId, onUpdate) => {
    
    useEffect(() => {
        if (!companyId) return;

        const socket = io(urlSer, {
            query: { companyId }
        });

        socket.on('db_change', (payload) => {
            onUpdate(payload);
        });

        return () => socket.disconnect();
    }, [companyId]);
};