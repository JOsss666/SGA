import './CashHistoryCard.css';

export function CashHistoryCard({ row, columns, onClick }) {
    
    const renderCell = (col, index) => {
        const value = row[col.key];

        switch (col.key) {
            case "fecha":
                const parts = value.split(' ');
                return (
                    <div key={index} className="elementRow col-fecha">
                        <div className="dateTimeContainer">
                            <span className="colValue dateMain">{parts.slice(0, 3).join(' ')}</span>
                            <span className="timeSub">{parts.slice(3).join(' ')}</span>
                        </div>
                    </div>
                );

            case "cajero":
                return (
                    <div key={index} className="elementRow col-cajero">
                        <div className="cajeroInfo">
                            <div className={`avatarCircle ${value.color}`}>{value.initials}</div>
                            <span className="colValue nameText">{value.nombre}</span>
                        </div>
                    </div>
                );

            case "diferencia":
                const isNeg = value.includes('-');
                const isPos = value.includes('+');
                const displayValue = value === "$0.00" ? "$0.00" : value;
                return (
                    <div key={index} className={`elementRow col-diferencia ${isNeg ? 'negative' : isPos ? 'positive' : ''}`}>
                        <span className="colValue">{displayValue}</span>
                    </div>
                );

            case "acciones":
                return (
                    <div key={index} className="elementRow col-acciones">
                        <span className="actionLink" onClick={(e) => {
                            e.stopPropagation();
                            if (row.action) row.action(row.id);
                        }}>
                            <i className="fa-solid fa-eye visibility" /> Ver Informe
                        </span>
                    </div>
                );

            case "id":
                return (
                    <div key={index} className="elementRow col-id">
                        <span className="colValue">#{value}</span>
                    </div>
                );

            default:
                return (
                    <div key={index} className={`elementRow col-${col.key}`}>
                        <span className="colValue">{value}</span>
                    </div>
                );
        }
    };

    return (
        <div className="CashHistoryCard row" onClick={() => {
            if (onClick) {
                onClick(row);
            } else if (row.action) {
                row.action(row.id);
            }
        }}>
            {columns.map((col, i) => renderCell(col, i))}
        </div>
    );
}