

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
import { useNavigate, useParams } from 'react-router-dom';
import { NoResults } from './NoResults';
import { FormNewProduct } from './forms/FormNewProduct';

export function CategoriesDetail(){
    const navigate = useNavigate();
    const params = useParams();
    const [displayGird,setDisplayGrid] = useState('grid');
    const [searchVal,setSearchVal] = useState('');
    const {appInfo} = useAppInfo();
    const [products,setProducts] = useState([]);
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
    
    const getProducts = async()=>{
        setLoading(true);
        let res = await postInfo('/inventory/getProducts',{
            company_id:appInfo.company_id,
            category_id:params.category_id
        })
        setProducts(res[1])
        setLoading(false);
    }

    const handleNavigate = (path)=>{
        navigate(`/SGA_INVENTORY/${params.company_key}/${params.user_key}/Categories/${path}`);
    }

    const handleNavigateProducts = (path)=>{
        navigate(`/SGA_INVENTORY/${params.company_key}/${params.user_key}/Categories/${path}`);
    }

    const filterOptions = (value) => {
        if (!searchVal) return true; 
            return value.toLowerCase().includes(searchVal.toLowerCase());
    }

    useEffect(()=>{
        getCategories();
    },[])

    useEffect(()=>{
        getProducts();
    },[params.category_id])

    return( 
        <div className="CategoriesDetail">
            <ul className="ContentPanel">
                    {categories.map((element,index)=>(
                        <li onClick={()=>{
                            console.log('Redirigiendo categoría')
                            handleNavigate(element.id)
                        }} key={index} className='CategoriList'>
                            {element.name}
                        </li>
                    ))}
            </ul>
            <div className="ContentMain">
                <div className="HeadCategoriesDetail">
                    <div className="TitlePath">
                        <BoldTitle text={'Categorias'}/>
                        <PathLocation/>
                    </div>
                    <DescriptionSpan text={'Esta es la descripción de la categoría actual' }/>
                </div>
                <div className="MenuBarCategories">
                    <SearchBar placeholder={'Buscar'} action={setSearchVal}/>
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
                            handleNavigateProducts(element.id)
                        }}/>
                    ))}
                    {!loading && products.length == 0 && (
                        <NoResults 
                            title={`La categoria ${params.category_id} no tiene productos asociados`}
                            newOption={'Crear nuevo producto'}
                            children={
                                <FormNewProduct/>
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    )
}