import { useState } from "react";
import { AppIcon } from "../components/AppIcon";
import { SearchBar } from "../components/SearchBar";
import './HomeSearch.css'
import { useAppInfo } from "../../../context/context";

export function HomeSearch(){

    const [searchValue,setSearchValue] = useState('');
    const {routesApp} = useAppInfo();
    
    const filterOptions = (value) => {
        if (!searchValue) return true; 
            return value.toLowerCase().includes(searchValue.toLowerCase());
    }

    return(
        <div className="HomeSearch">
            <SearchBar placeholder={'Buscar'} action={setSearchValue}/>
            <div className="resultsContainer">
                {searchValue != "" && routesApp.map((element,index)=>(
                    <AppIcon onClick={()=>{
                        if(element.action != undefined){
                            element.action(element.path);
                        }
                    }} hidden={!filterOptions(element.text)} key={index} title={element.text} visibleTitle={true}>
                        {element.icon}
                    </AppIcon>
                ))}
            </div>
        </div>
    )
}