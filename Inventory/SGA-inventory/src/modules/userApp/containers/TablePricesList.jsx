import { CheckSquare } from "../components/CheckSquare";
import { RowPricesList } from "../components/RowPricesList";
import { SearchinList } from "../components/SearchInList";
import './TablePricesList.css'

export function TablePricesList({columns,info,type,searchValue,products}){

    const filterOptions = (value) => {
        if (!searchValue) return true; 
            return value.toLowerCase().includes(searchValue.toLowerCase());
    }
    
    return(
        <div className="TablePricesList">
            <div className="headTable">
                <span><CheckSquare/></span>
                {columns.map((element,index)=>(
                    <span className="headColumn" key={index}>{element}</span>
                ))}
            </div>
            <div className="addNewProduct">
                <SearchinList noActVal={true} placeHolder={'+ Agregar nuevo producto'} list={products}/>
            </div>
            <div className="bodyTable">
                {info.length >0 && info.map((element,index)=>(
                    <RowPricesList hidden={!filterOptions(JSON.stringify(element))} type={type} columns={columns} info={element} key={index}/>
                ))}
            </div>
        </div>
    )
}