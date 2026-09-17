import { createContext, useContext } from 'react';

// Puente entre el panel del chat y los botones que el agente pueda proponer.
// Va por contexto porque ActionButton vive anidado dentro del markdown de un
// mensaje, varios niveles por debajo de quien posee el estado del chat.
export const ChatActionsContext = createContext({});

export const useChatActions = () => useContext(ChatActionsContext);
