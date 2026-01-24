import './ChartCard.css';

export function ChartCard({ title = "Indicador", children }) {
    return (
        <div className="ChartCard">
            <div className="ChartHeader">
                <h4>{title}</h4>
            </div>

            <div className="ChartContent">
                {children ?? <span className="ChartPlaceholder">Gráfica</span>}
            </div>
        </div>
    );
}
