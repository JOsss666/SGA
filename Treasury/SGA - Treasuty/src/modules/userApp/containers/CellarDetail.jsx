import { useEffect, useState } from "react";
import { PathLocation } from "../components/PathLocation";
import './CellarDetail.css'
import { moneyFormat, postInfo } from "../../../utils/functions";
import { useParams } from "react-router-dom";
import { useAppInfo } from "../../../context/context";
import { LoadingSpace } from "./LoadingSpace";
import { BoldTitle } from "../components/BoldTitle";
import { DescriptionSpan } from "../components/DescriptionSpan";
import { SelectOptions } from "../components/SelectOptions";
import { ButtonDownload } from "../components/ButtonDownload";
import { AiButton } from "../components/ChatAiComponents/AiButton";
import { SearchBar } from "../components/SearchBar";
import { ButtonMenu } from "../components/ButtonMenu";

export function CellarDetail(){

    // requirements
    const params = useParams();
    const {appInfo} = useAppInfo();
    const [cellarInfo,setCellarInfo] = useState({});
    const [stocks,setStocks] = useState([]);

    // control
    const [searchValue,setSearchValue] = useState();
    const [disabled,setDisabled] = useState(false);
    const [loading,setLoading] = useState(false);
    const [loadingStock,setLoadingStock] = useState(false);

    // functions

    const filterOptions = (value) => {
        if (!searchValue) return true; 
            return value.toLowerCase().includes(searchValue.toLowerCase());
    }

    const getCellarInfo = async()=>{
        setDisabled(true)
        setLoading(true)
        let res = await postInfo('/getCellars',{
            company_id:appInfo.company_id,
            id:params.cellar_id

        })
        if(res[0]){
            setCellarInfo(res[1][0]);
            getStocks();
        }
        setLoading(false)
        setDisabled(false)
    }

    const getStocks = async()=>{
        setDisabled(true);
        setLoadingStock(true);
        let res = await postInfo('/inventory/getStocks',{
            company_id:appInfo.company_id,
            store_id:params.store_id,
            cellar_id:params.cellar_id,
        })
        console.log(res)
        if(res[0]){
            setStocks(res[1])
        }
        setLoadingStock(false);
        setDisabled(false);
    }

    useEffect(()=>{
        getCellarInfo();
    },[])

    if(!loading){
        return(
            <div className="CellarDetail">
                <div className="headSection">
                    <PathLocation/>
                    <BoldTitle text={cellarInfo.name}/>
                    <DescriptionSpan text={cellarInfo.address}/>
                </div>
                <div className="stocksGrid">
                    <div className="filtersStock">
                        <SearchBar placeholder={'Buscar producto'} action={setSearchValue}/>
                        <SelectOptions
                            options={[
                                "Ascendente (fecha)",
                                "Descendente (fecha)",
                                "Ascendente (Nombre)",
                                "Descendente (Nombre)",
                            ]}
                            title={"Orden"}
                            />
                            <ButtonMenu title={"Mas Ajustes"} children={<i className="fa-solid fa-sliders" />} noRotate={true} />
                            <ButtonMenu title={"Refrescar"} children={<i className="fa-solid fa-arrow-rotate-right"/>}onClick={()=>{
                                getStocks();
                            }} />
                            <AiButton attached={stocks} sugerence={[
                                {text:'Analiza el estado de esta bodéga',context:`Listado de stock`},
                                {text:'Dame sugerencias con base al estado de esta bodega',context:`Listado de stock`},
                                {text:'Que productos deberia añadir a mi siguiente pedido',context:`Listado de stock`}
                            ]}/>
                        <ButtonDownload />
                    </div>
                    <div className="stockGrid">
                        {loadingStock && (
                            <LoadingSpace title={`Cargando inventario de ${cellarInfo.name}`} description={'Esto no debe tardar mucho...'}/>
                        )}
                        {!loadingStock && stocks.length>0 && stocks.map((element,index)=>(
                            <div style={{display:
                            `${(filterOptions(JSON.stringify(element)))? 'flex':'none'}`
                            }} key={index} className="stockCard">
                                <div className="productC">
                                    <img src={element.img} alt="" />
                                    <div className="productInfo">
                                        <strong>{element.name}</strong>
                                        <span>
                                            <i className="fa-solid fa-barcode"/>
                                            {element.code}
                                        </span>
                                    </div>
                                </div>
                                <span className="stockVal">
                                    Stock actual <b>{parseInt(element.stock)}</b>
                                </span>
                                <span className="stockVal">
                                    Stock min<b>{parseInt(element.min_stock)}</b>
                                </span>
                                <span className="stockVal">
                                    Stock max<b>{parseInt(element.max_stock)}</b>
                                </span>
                                <span className="stockVal">
                                    Costo prom<b>$ {moneyFormat(parseFloat(element.avg_cost))}</b>
                                </span>
                                <span className="stockVal">
                                    Valor venta<b>$ 0</b>
                                </span>
                                <span className="stockVal">
                                    Ultima cambio<b>{(element.updated_at).substring(0,10)}</b>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }else{
        return(<LoadingSpace title={'Cargando información de la bodega'} description={'Esto no debe tardar mucho ...'}/>)
    }
}