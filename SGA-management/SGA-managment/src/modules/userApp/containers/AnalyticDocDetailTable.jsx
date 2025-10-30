import './AnalyticDocDetailTable.css';

export function AnalyticDocDetailTable({tableData}) {
    return (
        <div className="AnalyticDocDetailTable">
            <table>
                <thead>
                    <tr>
                        {tableData.headers.map((header, index) => (
                            <th key={index}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody> 
                    {tableData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                            ))}
                        </tr>
                    ))} 
                </tbody>
            </table>
        </div>
    );
}