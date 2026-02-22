import './TransactionsCard.css';

export function TransactionsCard({ row, columns, formatCurrency, isLast }) {
    
    const renderCell = (col, index) => {
        const value = row[col.key];

        switch (col.key) {
            case "id":
                return (
                    <div key={index} className="elementRow col-id">
                        <span className="colValue">{value}</span>
                    </div>
                );

            case "transaction":
                return (
                    <div key={index} className="elementRow col-transaction">
                        <span className="colValue">{value}</span>
                    </div>
                );

            case "thirdParty":
                return (
                    <div key={index} className="elementRow col-thirdParty">
                        <span className="colValue">{value}</span>
                    </div>
                );

            case "category":
                return (
                    <div key={index} className="elementRow col-category">
                        <span className="colValue categoryBadge">{value}</span>
                    </div>
                );

            case "responsible":
                return (
                    <div key={index} className="elementRow col-responsible">
                        <span className="colValue">{value}</span>
                    </div>
                );

            case "status":
                let statusClass = '';
                if (value === 'PAGADO') statusClass = 'status-paid';
                else if (value === 'PENDIENTE') statusClass = 'status-pending';
                else if (value === 'VENCIDO') statusClass = 'status-overdue';
                return (
                    <div key={index} className="elementRow col-status">
                        <span className={`statusBadge ${statusClass}`}>{value}</span>
                    </div>
                );

            case "value":
                const isNegative = value < 0;
                const sign = isNegative ? '-' : '+';
                const className = isNegative ? 'negative' : 'positive';
                return (
                    <div key={index} className={`elementRow col-value ${className}`}>
                        <span className="colValue">{sign} ${formatCurrency(value)}</span>
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
        <div className={`TransactionsCard row ${isLast ? 'last-row' : ''}`} onClick={() => row.action && row.action(row.id)}>
            {columns.map((col, i) => renderCell(col, i))}
        </div>
    );
}