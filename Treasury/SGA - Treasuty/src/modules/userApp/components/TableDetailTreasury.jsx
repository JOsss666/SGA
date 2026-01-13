import "./TableDetailTreasury.css";

export function TableDetailTreasury({ columns = [], data = [], search = "" }) {

    const filteredData = data.filter(row =>
        Object.values(row).some(value =>
            String(value).toLowerCase().includes(search.toLowerCase())
        )
    );

    const renderCell = (row, col, index) => {
        let value = row[col.key];

        if (col.key === "bank_name") {
            return (
                <td key={index} className="bankCell">
                    <div className="bankCellName">
                        {value}
                        {row.is_private && <i className="fa-solid fa-lock PrivateIcon"/>}   
                    </div>
                    <div className="bankCellDescription">
                        {row.is_private && <i className="fa-solid fa-arrow-turn-up SubCategory"/>}   
                        {value}
                    </div>
                </td>
            );
        }

        /* VALIDAMOS EL COLOR DEL VALOR */
        if (col.key === "balance") {
            return (
                <td
                    key={index}
                    className={`balanceCell ${value < 0 ? "negative" : "positive"}`}
                >
                    <span className="statusDot"></span>
                    ${Number(value).toLocaleString()}
                </td>
            );
        }

        return <td key={index}>{value}</td>;
    };

    return (
        <div className="TableDetailTreasury">
            <table>
                <thead>
                    <tr className="TitleColumns">
                        {columns.map((col, i) => (
                            <th key={i}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length > 0 ? (
                        filteredData.map((row, i) => (
                            <tr key={i}>
                                {columns.map((col, j) => renderCell(row, col, j))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: "center" }}>
                                No hay datos disponibles
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
