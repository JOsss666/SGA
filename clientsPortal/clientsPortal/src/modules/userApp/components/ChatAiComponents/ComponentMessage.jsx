import { resolveChatComponent } from './chatComponents';
import './ComponentMessage.css';

/**
 * Renderiza el bloque ```component que emite el agente. Acepta un objeto
 * {component, props} o un arreglo de ellos para componer una fila de tarjetas.
 * Lo que no esté en el catálogo simplemente no se pinta.
 */
export function ComponentMessage({ spec }) {
    const entries = (Array.isArray(spec) ? spec : [spec])
        .map(resolveChatComponent)
        .filter(Boolean);

    if (!entries.length) return null;

    return (
        <div className="ComponentMessage">
            {entries.map((entry, index) => {
                // Como variable y no como parámetro destructurado: el
                // varsIgnorePattern '^[A-Z_]' del repo solo cubre variables.
                const { Component, props, iconName } = entry;
                return (
                    <Component
                        key={index}
                        {...props}
                        // El registro solo valida el nombre; el elemento se crea aquí.
                        {...(iconName ? { icon: <i className={`fa-solid fa-${iconName}`}/> } : {})}
                    />
                );
            })}
        </div>
    );
}
