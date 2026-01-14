import { NoResults } from "../containers/NoResults";
import "./TableDetailTreasury.css";

export function TableDetailTreasury({ columns = [], data = [], search, headTable}) {

    const filteredData = data.filter(row =>
        Object.values(row).some(value =>
            String(value).toLowerCase().includes(search.toLowerCase())
        )
    );

    const renderCell = (row, col, index) => {
        let value = row[col.key];

        if (col.key === "card") {
            return (
                <div key={index} className="bankCell">
                    <img src={row.img? row.img:"https://invimedic.com/wp-content/uploads/2022/10/no-photo-available.png"} alt="" />
                    <div className="infoBankCell">
                        <div className="bankCellName">
                            <strong>{row.name}</strong>
                            {row.icon != undefined?   row.icon:<i className="fa-solid fa-lock PrivateIcon"/>}   
                        </div>
                        <div className="bankCellDescription">
                            <i className="fa-solid fa-arrow-turn-up SubCategory"/>
                            {row.description}
                        </div>
                    </div>
                </div>
            );
        }

        /* VALIDAMOS EL COLOR DEL VALOR */
        if (col.key === "balance") {
            return (
                <div
                    key={index}
                    className={`balanceCell  elementRow ${value < 0 ? "negative" : "positive"}`}
                >
                    <span className="statusDot"></span>
                    <h5>$ {Number(value).toLocaleString()}</h5>
                </div>
            );
        }

        return <div className="elementRow colvalC" key={index}>
            <span className="colValue">{value}</span>
        </div>;
    };

    return (
        <div className="TableDetailTreasury">
                {headTable && (
                    <div className="headTable">
                        {columns.map((col, i) => (
                                <strong className="TitleColumns" style={{
                                    width:`${col.key == 'card'? '20vw':'10vw'}`
                                }} key={i}>{col.label}</strong>
                            ))}
                    </div>
                )}
                <div className={`roundedBottom ${!headTable? 'roundedList':''}`}>
                    {filteredData.length > 0 ?  (
                        filteredData.map((row, i) => (
                            <div className="row" onClick={()=>{
                                if(row.action != undefined){
                                    row.action(row.id)
                                }
                            }} key={i}>
                                    {columns.map((col, j) => renderCell(row, col, j))}
                            </div>
                        ))
                    ) : (
                        <NoResults title={search == ""?'No hay resultados disponibles':`No hay resultados para "${search}"`}/>
                    )}
                </div>
        </div>
    );
}
