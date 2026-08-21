import { useNavigate, useParams } from 'react-router-dom';
import { resolveChatAction } from './chatActions';
import { useChatActions } from './chatActionsContext';
import './ActionButton.css';

/**
 * Botón propuesto por el agente. Recibe un id de acción y sus parámetros; el
 * texto y el comportamiento salen del catálogo, nunca del modelo.
 */
export function ActionButton({ action, params }) {
    const navigate = useNavigate();
    const routeParams = useParams();
    const chatActions = useChatActions();

    const resolved = resolveChatAction(action, params);
    if (!resolved) return null;

    const context = {
        // Mismo destino que el menú lateral de la app.
        navigate: section => navigate(
            `/SGA_management/${routeParams.company_key}/${routeParams.user_key}/${section}`
        ),
        fillPrompt: chatActions.fillPrompt ?? (() => {})
    };

    return (
        <button type="button" className="ActionButton" onClick={()=>resolved.run(context)}>
            <i className={`fa-solid fa-${resolved.icon}`}/>
            {resolved.label}
        </button>
    );
}
