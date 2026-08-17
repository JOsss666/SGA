import { isValidElement, useEffect } from 'react';
import { useAlert } from '../../../context/context'
import './AlertsHolder.css'
import { AlertContainer } from './AlertContainer';

export function AlertsHolder(){

    const {tailAlerts, popOutAlert} = useAlert();

    useEffect(() => {
        if (tailAlerts.length === 0) return undefined;

        const handleKeyDown = (event) => {
            if (event.key !== 'Escape' || event.defaultPrevented) return;
            event.preventDefault();
            popOutAlert();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tailAlerts.length, popOutAlert]);

    useEffect(() => {
        if (tailAlerts.length === 0) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [tailAlerts.length]);

    if (tailAlerts.length === 0) return null;

    const renderAlert = (alert) => {
        if (isValidElement(alert) || typeof alert !== 'object' || alert == null) return alert;

        return (
            <div className={`fallbackAlertMessage ${alert.type ?? 'info'}`}>
                <i aria-hidden="true" className="fa-solid fa-circle-info"/>
                <div>
                    {alert.title && <h2>{alert.title}</h2>}
                    <p>{alert.message ?? alert.description ?? 'No hay información adicional disponible.'}</p>
                </div>
            </div>
        );
    };

    return(
        <section
            className="AlertsHolder"
            aria-label="Paneles abiertos"
            style={{ '--alert-count': tailAlerts.length }}
        >
            {tailAlerts.map((element,index)=>{
                const isActive = index === tailAlerts.length - 1;
                return (
                <div
                    className={`AlertLayer ${isActive ? 'active' : 'inactive'}`}
                    style={{ '--alert-layer': index + 1 }}
                    key={element.id}
                >
                    <AlertContainer
                        fullScale={element.fullScale}
                        closeLabel={element.closeLabel}
                        isActive={isActive}
                        depth={tailAlerts.length - 1 - index}
                    >
                        {renderAlert(element.alert)}
                    </AlertContainer>
                </div>
            )})}
            <div className="alertStackIndicator" aria-live="polite">
                {tailAlerts.length > 1 && `${tailAlerts.length} paneles abiertos`}
            </div>
        </section>
    )
}
