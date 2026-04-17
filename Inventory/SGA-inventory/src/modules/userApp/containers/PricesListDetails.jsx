
import { useParams } from 'react-router-dom'
import { SectionTitle } from '../components/SectionTitle'
import './PricesListDetails.css'
import { PathLocation } from '../components/PathLocation';
import { ListPriceProducts } from './ListPriceProducts';
import { useState, useEffect, useMemo } from 'react';
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
import { SearchinList } from '../components/SearchInList';
import { AiButton } from '../components/ChatAiComponents/AiButton';
import { FormButton } from '../components/FormButton';

export function PricesListDetails(){

    // Requierements
    const {appInfo, userConfig} = useAppInfo();
    const params = useParams();
    const [listPriceInfo, setListPriceInfo] = useState({});

    // Control
    const [searchVal,setSearchVal] = useState('');
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [loadingItems,setLoadingItems] = useState(false);
    const [listItems,setListItems] = useState([]);
    const [modifiedList,setModifiedList] = useState(false);

    const filteredListItems = useMemo(() => {
        if (!searchVal.trim()) return listItems;
        const query = searchVal.toLowerCase();
        return listItems.filter((item) => {
            // Buscamos coincidencia en SKU (code), Nombre o Descripción
            const codeMatch = item.code?.toLowerCase().includes(query);
            const nameMatch = item.name?.toLowerCase().includes(query);
            const costMatch = item.cost?.toLowerCase().includes(query);
            const valueMatch = item.value?.toLowerCase().includes(query);
            const descMatch = item.description?.toLowerCase().includes(query);

            return codeMatch || nameMatch || descMatch || costMatch || valueMatch;
        });
    }, [searchVal, listItems]);
    
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
        'Descuento %',
        'Margen',
        'Disponible desde',
        'Disponible hasta',
        'Eliminar'
    ]

        // Handlers of listItems
        const addListItem = (newElement)=>{
            if(newElement.id == undefined) return;
            setListItems([
                ...listItems,
                {
                    id:null,
                    code:newElement.code,
                    product_id:newElement.id,
                    name:newElement.name,
                    description:newElement.description,
                    cost:0,
                    value:0,
                    min_units:0,
                    discount:0,
                    start_date:undefined,
                    end_date:undefined,
                    edited:true
                }
            ])
        };

       const deleteListItem = async(indexToDelete,id) => {
            if(id != null){
                let res = await postInfo('/inventory/deleteItemPricesList',{
                    items:[id],
                    company_id:appInfo.company_id
                });
                console.log(res);
                if(!res || res[0] == false){
                    console.log('Error al eliminar elemento')
                    return;
                }
            }
            setListItems(prevItems => 
                prevItems.filter((_, index) => index !== indexToDelete)
            );
        };

        const updateListItem = (elIndex, property, value) => {
            setListItems((prevItems) => 
                prevItems.map((item,index) => {
                    // 1. Buscamos el elemento que queremos editar
                    if (elIndex == index) {
                        // 2. Retornamos una copia del objeto con la propiedad cambiada
                        return { 
                            ...item, 
                            [property]: value,
                            edited:true
                        };
                    }
                    // 3. Si no es el que buscamos, lo devolvemos tal cual
                    return item;
                })
            );
        };

        const saveListChanges = async()=>{
            setDisabled(true);
            setLoadingItems(true);
            let res = await postInfo('/inventory/updatePricesList',{
                items:listItems,
                company_id:appInfo.company_id,
                list_id:listPriceInfo.id,
            });
            console.log(res);
            setModifiedList(false);
            setLoadingItems(false)
            setDisabled(true);
            getPriceListItems();
        }

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

    const getPriceListItems = async()=>{
        setDisabled(true);
        setLoadingItems(true);
        let res = await postInfo('/inventory/getPricesListItems',{
            company_id:appInfo.company_id,
            list_id:params.priceListId
        })
        console.log(res);
        if(res[0]){
            setListItems(res[1]);
        }else{
            setListItems([]);
        }
        setLoadingItems(false);
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

    useEffect(()=>{
        if(listPriceInfo.id == undefined) return;
        getPriceListItems();
    },[listPriceInfo])

    useEffect(() => {
        if(listItems.length == 0) return;
        const hasEditedItems = listItems.some(element => element.edited);
        if (hasEditedItems) {
            setModifiedList(true);
        }
    }, [listItems]);

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
                    <span className="lastUpdated">
                        <i className="fa-regular fa-calendar"/>
                        Valido hasta: {formatDate(listPriceInfo.valid_from)}
                    </span>
                    <span className="lastUpdated">
                        <i className="fa-regular fa-calendar"/>
                        Valido hasta: {formatDate(listPriceInfo.valid_until)}
                    </span>
                </div>
            </div>
            <div className="actionsPricesList">
                {modifiedList && (
                    <div className="saveChanges">
                        <FormButton text={'Guardar cambios'} 
                            disabled={disabled}
                            onClick={()=>{
                                saveListChanges();
                            }}
                            >
                            <i className="fa-regular fa-floppy-disk"/>
                        </FormButton>
                    </div>
                )}
            </div>
            <div className="searchContainer">
                <SearchBar placeholder={'Buscar'} action={setSearchVal} />
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
                <SearchinList noActVal={true} action={addListItem} placeHolder={'+ Agregar nuevo producto'} list={products}/>
            </div>
            <div className="contentDetailsList">
                {!loadingItems && (
                    <TablePricesList columns={columns} info={filteredListItems} products={products}
                        functions={{
                            addListItem,
                            deleteListItem,
                            updateListItem
                        }}
                    />
                )}
                {loadingItems && (
                    <LoadingSpace title={'Cargando lista de precios'} description={'Esto no debe tardar mucho...'}/>
                )}
            </div>
        </div>
    )
    if(loading)return(
        <LoadingSpace title={'Cargando información lista de precios'}/>
    )
}