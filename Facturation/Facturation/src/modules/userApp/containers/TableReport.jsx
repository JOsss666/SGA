import { CheckSquare } from "../components/CheckSquare";
import { RowTableReport } from "../components/RowTableReport";
import { NoResults } from "./NoResults";
import './TableReport.css'

export function TableReport({columns,info,type,searchValue,navigation}){

    const filterOptions = (value) => {
        if (!searchValue) return true; 
            return value.toLowerCase().includes(searchValue.toLowerCase());
    }
    
    return(
        <div className="TableReport">
            <div className="headTable">
                <span><CheckSquare/></span>
                {columns.map((element,index)=>(
                    <span className={`headColumn headColum_${element}`} key={index}>{element}</span>
                ))}
            </div>
            <div className="bodyTable">
                {info.length >0 && info.map((element,index)=>(
                    <RowTableReport hidden={!filterOptions(JSON.stringify(element))} type={type} columns={columns} info={element} key={index} navigation={navigation}/>
                ))}
                {info.length == 0 && (
                    <NoResults title={'No hay resultados disponibles'}/>
                )}
            </div>
        </div>
    )
}