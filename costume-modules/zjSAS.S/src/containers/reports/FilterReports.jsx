import { useEffect, useState } from "react"
import './FilterReports.css'
//import { NoResults } from "../NoResults";
import { SelectOptions } from "../../components/SelectOptions";

export function FilterReports({hidden,columns,filters}){

    const [visibleFilterDetail,setVisibleFilterDetail] = useState(false);
    const [filterView,setFilterView] = useState(0)

    useEffect(()=>{
        setVisibleFilterDetail(false)
    },[hidden])

    return(
        <div className={`FilterReports ${hidden? 'FilterReports_openSettings':'FilterReports_hiddenSettings'}`}>
                <div className="filtersTitle">
                    <h6 onClick={()=>{
                        setVisibleFilterDetail(false)
                    }}>Filtros</h6>
                    {visibleFilterDetail && (
                        <span className="filterRoute">
                            <i className="fa-solid fa-angle-right"/>
                            {columns[filterView]}
                        </span>
                    )}
                </div>
                {!visibleFilterDetail && columns.map((element,index)=>(
                    <span className="columFilterOption" key={index} onClick={()=>{
                        setVisibleFilterDetail(true)
                        setFilterView(index)
                    }}>
                        {element}
                        <i className="fa-solid fa-angle-right"/>
                    </span>
                ))}
                {visibleFilterDetail && (
                    <span className="spaceFilters">
                        {filters[columns[filterView]] != undefined && filters[columns[filterView]].map((element,index)=>(
                            <SelectOptions key={index} title={element.title} objectC={true} defaultValue={false} options={element.options} action={element.action}/>
                        ))}
                        {filters[columns[filterView]] == undefined && (
                            <span>No hay filtro disponibles</span>
                        )}
                    </span>
                )}
        </div>
    )
}