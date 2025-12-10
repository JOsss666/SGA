import { useEffect, useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import './Categories.css'
import { SubCategory } from "./SubCategory";
import { postInfo } from "../../../utils/functions";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormButton } from "../components/FormButton";
import { CardMyBussinesUnits } from "../components/CardMyBussinesUnits";
import { CardReport } from "../components/CardReport";
import { Route } from "react-router-dom";

export function Categories(){

    const [categories,setCategories] = useState([]);
    const getCategories = async()=>{
        let res = await postInfo('/getCategories',1);
        setCategories(res[1]);
    }

    useEffect(()=>{
        getCategories();
    },[])

    return(
        <div className="Categories">
            <div className="HeadCategories">
                <BoldTitle text={'Categorías'}/>
                <DescriptionSpan text={'Analiza, gestiona y parametriza los módulos de tu empresa'}/>
            </div>
            <div className="MenuBarCategories">
                <SearchBar placeholder={'Buscar'}/>
                <i className="fa-solid fa-bars IconList"/>
                <i className="fa-solid fa-table-cells-large IconList"/>
                <SelectOptions title={'Orden'} options={['Ascendente','Descendente']}/>
                <FormButton onClick={()=>{
                    popInAlert({/*<FormNewUser reloadFun={getUsers}/>*/})
                }} text={'Crear nuevo'} children={<i className="fa-solid fa-plus"/>}/>
            </div>
            <div className="GalleryCategories">
                {/* EJEMPLO PARA UNA REFERENCIA */}
                <CardReport title={'Categoría 1'} value={categories.length} icon={'fa-solid fa-tags'}/>
                {categories.length > 0 && categories.map((element,index)=>(
                    <SubCategory info={element} key={index} maxF={true}/>
                ))}
                {/*<Route path="/detail" element={<CategoriesDetail type={'Nombre Categoria'}/>}/>*/}
            </div>



            {/*
            <SectionTitle text={'Categorias'}/>
            <div className="categoriesSpace">
                {categories.length > 0 && categories.map((element,index)=>(
                    <SubCategory info={element} key={index} maxF={true}/>
                ))}
            </div>
            */}
        </div>
    )
}