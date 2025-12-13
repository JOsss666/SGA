import { useEffect, useState } from "react";
import { postInfo } from "../../../utils/functions";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import { FormButton } from "../components/FormButton";
import { useAlert, useAppInfo } from "../../../context/context";
import { useNavigate,useParams } from "react-router-dom";
import { NormalCard } from "../components/NormalCard";
import './Categories.css'
import { LoadingSpace } from "./LoadingSpace";
import { FormNewCategory } from "./forms/FormNewCategory";

export function Categories(){
    const navigate = useNavigate();
    const params = useParams();
    const {appInfo} = useAppInfo();
    const {popInAlert} = useAlert();
    const [loading,setLoading] = useState(false);
    const [categories,setCategories] = useState([]);
    const getCategories = async()=>{
        setLoading(true)
        let res = await postInfo('/inventory/getCategories',{
            company_id:appInfo.company_id
        });
        setCategories(res[1]);
        setLoading(false)
    }

    const handleNavigate = (path)=>{
        navigate(`/SGA_INVENTORY/${params.company_key}/${params.user_key}/Categories/${path}`);
    }

    const filterOptions = (value) => {
        if (!searchVal) return true; 
            return value.toLowerCase().includes(searchVal.toLowerCase());
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
                    popInAlert(<FormNewCategory reloadFun={getCategories}/>)
                }} text={'Crear nuevo'} children={<i className="fa-solid fa-plus"/>}/>
            </div>
            {!loading && (
                <div className="GalleryCategories">
                    {/* EJEMPLO PARA UNA REFERENCIA */}
                    {categories.length > 0 && categories.map((element,index)=>(
                        <NormalCard title={element.name} img={element.img} onlyTitle={true} key={index} onClick={()=>{
                            handleNavigate(element.id)
                        }}/>
                    ))}
                    {/*<Route path="/detail" element={<CategoriesDetail type={'Nombre Categoria'}/>}/>*/}
                </div>
            )}
            {loading && (
                <LoadingSpace title={'Cargando categorías'} description={'Esto no bede tardar mucho...'}/>
            )}



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