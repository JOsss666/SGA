// El agente tiene instrucción de cerrar cada respuesta con "CC__(company_id)"
// y el agente utilizado. Es una marca de depuración: se conserva en el backend
// pero no se le muestra al usuario. El id real de la empresa y el modelo
// llegan en el payload `done` del stream.
export const stripAgentDebugMarker = text => (
    typeof text === 'string' ? text.replace(/\n*\s*CC__.*$/s, '') : text
);
