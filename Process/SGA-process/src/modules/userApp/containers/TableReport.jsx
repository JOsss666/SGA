import { CheckSquare } from "../components/CheckSquare";
import { RowTableReport } from "../components/RowTableReport";
import './TableReport.css'

export function TableReport({columns,info,type}){

    
    return(
        <div className="TableReport">
            <div className="headTable">
                <span><CheckSquare/></span>
                {columns.map((element,index)=>(
                    <span className="headColumn" key={index}>{element}</span>
                ))}
            </div>
            <div className="bodyTable">
                {info.length >0 && info.map((element,index)=>(
                    <RowTableReport type={type} columns={columns} info={element} key={index}/>
                ))}
            </div>
        </div>
    )
}