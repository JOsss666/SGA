import { useEffect, useState } from "react";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { FormButton } from "../components/FormButton";
import { SearchBar } from "../components/SearchBar";
import { SelectOptions } from "../components/SelectOptions";
import './Products.css'
import { postInfo } from "../../../utils/functions";
import { useAlert, useAppInfo } from "../../../context/context";
import { LoadingSpace } from "./LoadingSpace";
import {FormNewProduct} from './forms/FormNewProduct'
import { ProductCard } from "../components/ProductCard";
import { useNavigate, useParams } from "react-router-dom";
import { ButtonMenu } from "../components/ButtonMenu";

export function Products(){
    const {popInAlert} = useAlert();
    const {appInfo} = useAppInfo();
    const navigate = useNavigate();
    const params = useParams();
    const [loading,setLoading] = useState(false);
    const [products,setProducts] = useState([]);
    const [displayGird,setDisplayGrid] = useState('grid');
    const [searchVal,setSearchVal] = useState('');

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
        <div className="Products">
            <BoldTitle text={'Productos'}/>
            <DescriptionSpan text={'Analiza, gestiona y parametriza los módulos de tu empresa'}/>
            <div className="searchOptions">
                <SearchBar action={setSearchVal} placeholder={'Buscar Producto'} />
                <SelectOptions title={'Filtro'} options={['ninguno']}/>
                <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']}/>
                <ButtonMenu noRotate={true} onClick={()=>{
                        displayGird == 'grid'? setDisplayGrid('line'):setDisplayGrid('grid')
                    }} title={'Cambiar distribución'}><i className={displayGird == 'grid'? 'fa-solid fa-border-all':'fa-solid fa-grip-lines'}/>
                </ButtonMenu>
                <FormButton onClick={()=>{
                    popInAlert(<FormNewProduct reloadFun={getProducts}/>)
                }} text={'Crear producto'} children={<i className="fa-solid fa-plus"/>}/>
            </div>
            <div className={`gridProducts gridP_${displayGird}`}>
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
    )
}