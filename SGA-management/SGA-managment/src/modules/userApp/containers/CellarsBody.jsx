import { useState } from "react";
import { NormalCard } from "../components/NormalCard";
import './CellarsBody.css'
import { FormNewCellar } from "./forms/FormNewCellar";
import { NoResults } from "./NoResults";
import { ButtonMenu } from "../components/ButtonMenu";
import { FormButton } from "../components/FormButton";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { useAlert } from "../../../context/context";

export function CellarsBody({cellars,storeInfo,reloadFun,onClick}){
    
    const {popInAlert} = useAlert();
    const [searchValue,setSearchVal]  = useState('');
    const [displayGird,setDisplayGrid] = useState('');

    const filterOptions = (value) => {
        if (!searchValue) return true; 
            return value.toLowerCase().includes(searchValue.toLowerCase());
    }

    return(
        <div className="CellarsBody">
            {cellars != undefined && cellars.length > 0 && (
                <>
                    <div className="searchOptions">
                        <SearchBar placeholder={'Buscar'} action={setSearchVal} />
                        <SelectOptions title={'Filtro'} options={['ninguno']}/>
                        <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']}/>
                        <ButtonMenu noRotate={true} onClick={()=>{
                                displayGird == 'grid'? setDisplayGrid('line'):setDisplayGrid('grid')
                            }} title={'Cambiar distribución'}><i className={displayGird == 'grid'? 'fa-solid fa-border-all':'fa-solid fa-grip-lines'}/>
                        </ButtonMenu>
                        <FormButton text={'Crear nueva'} onClick={()=>{
                            popInAlert(<FormNewCellar info={storeInfo} reloadFun={reloadFun}/>)
                        }} children={<i className="fa-solid fa-plus"/>}/>
                    </div>
                    <div className="CellarsGird">
                        {cellars != undefined && cellars.map((element,index)=>(
                            <NormalCard onlyTitle={true} title={element.name} key={index} onClick={()=>{onClick?.(element.id)}}
                                img={'https://res.cloudinary.com/djjxugmni/image/upload/v1764620093/ChatGPT_Image_1_dic_2025_15_04_38_3_hcdqxl.png'}
                            />
                        ))}
                    </div>
                </>
            )}
            {cellars == undefined || cellars.length == 0 && (
                <NoResults title={'No se encontro ninguna bodéga,'} newOption={'crea tu primera bodéga'}>
                    <FormNewCellar info={storeInfo} reloadFun={reloadFun}/>
                </NoResults>
            )}
        </div>
    )
}