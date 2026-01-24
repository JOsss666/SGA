import './CentralPanelCard.css';

export function CentralPanelCard({ title, value, delta }) {
    const isPositive = delta?.startsWith('+');

    return (
        <div className="CentralPanelCard">
            <span className="card-title">{title}</span>

            <div className="card-info">
                <span className="card-value">{value}</span>

                {delta && (
                    <span
                        className={`card-delta ${
                            isPositive ? 'positive' : 'negative'
                        }`}
                    >
                        {delta}
                    </span>
                )}
            </div>
        </div>
    );
}
