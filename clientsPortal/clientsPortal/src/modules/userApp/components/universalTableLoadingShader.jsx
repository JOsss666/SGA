import './universalTableLoadingShader.css';

export function UniversalTableLoadingShader({ columns = [], rows = 7 }) {
    const visibleColumns = columns.filter((column) => column.visible !== false);

    return (
        <div className="universalTableLoadingShader" role="status" aria-live="polite">
            <span className="universalTableLoadingText">Cargando resultados de la tabla</span>
            {Array.from({ length: rows }, (_, rowIndex) => (
                <div className="universalTableLoadingRow" aria-hidden="true" key={`loading-row-${rowIndex}`}>
                    {visibleColumns.map((column, columnIndex) => (
                        <span
                            className="universalTableLoadingCell"
                            key={`${column.key}-${columnIndex}`}
                            style={{
                                flex: column.flex ?? '1 1 10rem',
                                minWidth: column.minWidth ?? '8rem'
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
