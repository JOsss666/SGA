import './CardRankingAnalytics.css';

export function CardRankingAnalytics({ title, value, text, icon }) {
    return (
        <div className="CardRankingAnalytics">
            <div className="icon">{icon}</div>
            <h3>{title}</h3>
            <p className="value">{value}</p>
            <p className="text">{text}</p>
        </div>
    );
}
