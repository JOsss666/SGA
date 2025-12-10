

import './CategoriesDetail.css';
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { PathLocation } from '../components/PathLocation';
import { SearchBar } from '../components/SearchBar';
import { SelectOptions } from '../components/SelectOptions';
import { FormButton } from '../components/FormButton';
import { ProductCard } from '../components/ProductCard';
import { useAppInfo } from '../../../context/context';
import { useEffect, useState } from 'react';
import { postInfo } from '../../../utils/functions';
import { LoadingSpace } from './LoadingSpace';

export function CategoriesDetail(){
    const [displayGird,setDisplayGrid] = useState('grid');
    const [searchVal,setSearchVal] = useState('');
    const {appInfo} = useAppInfo();
    const [products,setProducts] = useState([]);
    const [loading,setLoading] = useState(false);

    const getProducts = async()=>{
        setLoading(true);
        let res = await postInfo('/inventory/getProducts',{
            company_id:appInfo.company_id
        })
        if(res[0]){
            setProducts(res[1])
        }
        setLoading(false);
    }

    const handleNavigate = (path)=>{
        navigate(`/SGA_INVENTORY/${params.company_key}/${params.user_key}/Products/${path}`);
    }

    const filterOptions = (value) => {
        if (!searchVal) return true; 
            return value.toLowerCase().includes(searchVal.toLowerCase());
    }

    useEffect(()=>{
        getProducts();
    },[])

    return( 
        <div className="CategoriesDetail">
            <div className="ContentPanel">
                <div className="list">
                    <ul className="CategoriList">
                        <li className="Categori">
                            Categoría 1
                            <ul className="SubcategoriList">
                                <li>Sub-categoría</li>
                                <li>Sub-categoría</li>
                                <li>Sub-categoría</li>
                                <li>Sub-categoría</li>
                            </ul>
                        </li>

                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                        <li className="Categori">Categoría 1</li>
                    </ul>
                </div>
            </div>
            <div className="ContentMain">
                <div className="HeadCategoriesDetail">
                    <div className="TitlePath">
                        <BoldTitle text={'Categorias'}/>
                        <PathLocation/>
                    </div>
                    <DescriptionSpan text={'Esta es la descripción de la categoría actual' }/>
                </div>
                <div className="MenuBarCategories">
                    <SearchBar placeholder={'Buscar'}/>
                    <i className="fa-solid fa-bars IconList"/>
                    <i className="fa-solid fa-table-cells-large IconList"/>
                    <SelectOptions title={'Orden'} options={['Ascendente','Descendente']}/>
                    <FormButton onClick={()=>{
                        popInAlert({/*<FormNewUser reloadFun={getUsers}/>*/})
                    }} text={'Añadir producto'} children={<i className="fa-solid fa-plus"/>}/>
                </div>
                <div className="DetailsCategoriesDetail">
                        {loading && (
                    <LoadingSpace title={'Cargando productos'} description={'Esto no bede tardar mucho...'}/>
                )}
                    {!loading && products.map((element,index)=>(
                        <ProductCard info={element} key={index} hidden={!filterOptions(JSON.stringify(element))} display={displayGird} onClick={()=>{
                            handleNavigate(element.id)
                        }}/>
                    ))}
                </div>
            </div>
        </div>
    )
}