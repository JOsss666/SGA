
import { useParams } from 'react-router-dom'
import { SectionTitle } from '../components/SectionTitle'
import './PricesListDetails.css'
import { PathLocation } from '../components/PathLocation';
import { ListPriceProducts } from './ListPriceProducts';
import { useState, useEffect } from 'react';
import { BoldTitle } from '../components/BoldTitle';
import { postInfo } from '../../../utils/functions';
import { useAppInfo } from '../../../context/context';
import { LoadingSpace } from './LoadingSpace';
import { formatDate } from '../../../utils/functions';
import { DescriptionSpan } from '../components/DescriptionSpan';
import { SearchBar } from '../components/SearchBar';
import { ButtonDownload } from '../components/ButtonDownload';
import { ButtonMenu } from '../components/ButtonMenu';
import { MoreOptions } from '../components/MoreOptions';
import { SelectOptions } from '../components/SelectOptions';
import { TablePricesList } from './TablePricesList';
import { AiButton } from '../components/ChatAiComponents/AiButton';

export function PricesListDetails(){

    // Requierements
    const {appInfo, userConfig} = useAppInfo();
    const params = useParams();
    const [listPriceInfo, setListPriceInfo] = useState({});

    // Control
    const [searchVal,setSearchVal] = useState('');
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    
    // info
    const [products,setProducts] = useState([]);

    // Utils
    const columns = [
        'SKU',
        'Producto',
        'Descripción',
        'Costo',
        'Valor venta',
        'Unidades min',
        "Unidades max",
        'Descuento %',
        'Margen',
        'Disponible desde',
        'Disponible hasta',
    ]

     const testinfo = [
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        {
            list_id:1,
            code:1223,
            product_name:"producto de prueba",
            category_name:"Category",
            unit_cost:120000,
            units:2,
            cost:120000,
            taxed:true,
        },
        
    ]

    // Getters of info
    const getListPriceInfo = async ()=>{
        setDisabled(true);
        setLoading(true);
        let res = await postInfo('/inventory/getPricesList',{
            company_id:appInfo.company_id,
            id: params.priceListId,
            limit:1
        });
        console.log(res);
        if(res[0]){
            setListPriceInfo(res[1][0]);
        }else{
            setListPriceInfo({});
        }
        setLoading(false);
        setDisabled(false);
    }

    const getProductsAndServices = async()=>{
        let allowedStores = undefined;
        let allowedCellars = undefined;
        if(userConfig.access.stores.enabled.length > 1){
            allowedStores = userConfig.access.stores.enabled;
        }
        if(userConfig.access.cellars.enabled.length > 1){
            allowedCellars = userConfig.access.cellars.enabled.length;
        }
        let res = await postInfo('/inventory/getProducts',{
            company_id:appInfo.company_id,
            allowedStores,
            allowedCellars,
            type:'service'
        })
        console.log('=======> ',res);
        if(res[0]){
            let C = []
            res[1].forEach(element => {
                C.push({
                    text:`${element.code} ${element.name}`,
                    value:element
                })
            });
            setProducts(C)
        }else{
            setProducts([]);
        }
    }

    // Events listeners
    useEffect(()=>{
        getListPriceInfo();
        getProductsAndServices();
    },[])


    if(!loading)return(
        <div className="PricesListDetails appSection">
            <div className="headList">
                <PathLocation/>
                <BoldTitle text={listPriceInfo.name}/>
                <DescriptionSpan text={listPriceInfo.description}/>       
                <div className="updatesInfo">
                    <span className="lastUpdated">
                        <i className="fa-regular fa-clock"/>
                        Ultima actualización: {formatDate(listPriceInfo.updated_at)}
                    </span>
                        <span className="lastUpdated">
                        <i className="fa-regular fa-calendar"/>
                        Fecha de creación: {formatDate(listPriceInfo.created_at)}
                    </span>
                </div>
            </div>
            <div className="searchContainer">
                <SearchBar placeholder={'Buscar'} action={setSearchVal} />
                <SelectOptions title={'Filtro'} options={['ninguno']}/>
                <SelectOptions title={'Orden'} options={['Alfabetico','Fecha de Creación','Categoría']}/>
                <ButtonDownload title={'Descargar listas de precios'}/>
                <MoreOptions children={<i className="fa-solid fa-ellipsis-vertical"/>} options={[
                    {text:'Añadir producto', action: undefined,icon:<i className="fa-solid fa-plus"/>},
                    {text:'Crear producto', action: undefined,icon:<i className="fa-solid fa-carrot"/>},
                    {text:'Refrescar', action: undefined,icon:<i className="fa-solid fa-sync"/>},
                    {text:'Ver Historial', action: undefined,icon:<i className="fa-solid fa-eye"/>},
                    {text:'Descargar', action: undefined,icon:<i className="fa-solid fa-download"/>},
                    {text:'Compartir', action: undefined,icon:<i className="fa-solid fa-arrow-up-from-bracket"/>},
                    {text:'Analizar con IA', action: undefined,icon:<img src="https://res.cloudinary.com/djjxugmni/image/upload/v1772826198/Gemini_Generated_Image_fx4nzmfx4nzmfx4n-2_fizk0g.png"/>},
                ]}/>
                <AiButton attached={{}} sugerence={[
                    {text:'¿Que representa este informe?',context:``},
                    {text:'Realiza un analisis de este informe',context:``},
                    {text:'¿Que acciones me recomiendas basado en este informe?',context:``}
                ]}/>
            </div>
            <div className="contentDetailsList">
                <TablePricesList columns={columns} info={testinfo} products={products}/>
            </div>
        </div>
    )
    if(loading)return(
        <LoadingSpace title={'Cargando información lista de precios'}/>
    )
}