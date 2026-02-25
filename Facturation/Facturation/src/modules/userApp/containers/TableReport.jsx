import { CheckSquare } from "../components/CheckSquare";
import { RowTableReport } from "../components/RowTableReport";
import { NoResults } from "./NoResults";
import { useMemo } from "react";
import './TableReport.css'

export function TableReport({columns,info,type,searchValue,navigation}){

    const filteredInfo = useMemo(() => {
        if (!searchValue?.trim()) return info;

        const lower = searchValue.toLowerCase();

        return info.filter(row =>
            Object.values(row).some(val =>
                val?.toString().toLowerCase().includes(lower)
            )
        );
    }, [info, searchValue]);
    
    return(
        <div className="TableReport">
            <div className="headTable">
                <span><CheckSquare/></span>
                {columns.map((element,index)=>(
                    <span className={`headColumn headColum_${element}`} key={index}>{element}</span>
                ))}
            </div>
            <div className="bodyTable">
                {info.length >0 && filteredInfo.map((element,index)=>(
                    <RowTableReport type={type} columns={columns} info={element} key={index} navigation={navigation}/>
                ))}
                {info.length == 0 && (
                    <NoResults title={'No hay resultados disponibles'}/>
                )}
            </div>
        </div>
    )
}