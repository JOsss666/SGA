import './KpiCard.css'

/**
 * KpiCard — tarjeta de indicador clave para el módulo de Tesorería.
 *
 * @param {string}    title       - Título del indicador
 * @param {string}    value       - Valor principal formateado
 * @param {string}    description - Descripción o contexto del indicador
 * @param {string}    type        - 'positive' | 'warning' | 'danger' | 'neutral'
 * @param {ReactNode} icon        - Ícono JSX
 * @param {function}  onClick     - Acción al hacer click (convierte la card en botón)
 */
export function KpiCard({ title, value, description, type = 'neutral', icon, onClick }) {
    return (
        <div
            className={`KpiCard KpiCard--${type}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="KpiCard__header">
                <div className="KpiCard__icon">
                    {icon}
                </div>
                <span className="KpiCard__title">{title}</span>
            </div>

            <strong className="KpiCard__value">{value}</strong>

            {description && (
                <span className="KpiCard__description">{description}</span>
            )}
        </div>
    )
}
