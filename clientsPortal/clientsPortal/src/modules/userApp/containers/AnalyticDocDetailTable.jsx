import './AnalyticDocDetailTable.css';

export function AnalyticDocDetailTable({ tableData }) {
    
    if (!tableData || tableData.length === 0) {
        return <p>No hay datos para mostrar</p>;
    }

    // Obtiene las columnas del primer registro
    const columns = Object.keys(tableData[0]);

    return (
        <div className="AnalyticDocDetailTable">
            <table>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col}>{col}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {tableData.map((row, index) => (
                        <tr key={index}>
                            {columns.map((col) => (
                                <td key={col}>{row[col]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
