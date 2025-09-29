import { useEffect, useState } from "react";
import { SectionTitle } from "../componets/SectionTitle";
import { SelectOptions } from "../componets/SelectOptions";
import './Analytics.css'
import { RangeDateInput } from "../componets/RangeDateInput";
import { ValueAnalytic } from "../componets/ValueAnalytic";
import { ChartIndicator } from "../componets/ChartIndicator";
import { DetailChart } from "../componets/DetailChart";
import { SearchBar } from "../componets/SearchBar";
import { SubSectionTitle } from "../componets/SubSectionTitle";
import { ProductInfoCard } from "../componets/ProductInfoCard";
import {useAppInfo} from '../../../context/context'
import {postInfo} from '../../../utils/functions'
import { useLocation, useNavigate } from "react-router-dom";

export function Analytics(){
    const [products,setProducts] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [entries,setEntries] = useState([]);
    const [departures,setDepartures] = useState([]);
    const [consuption,setConsuption] = useState([]);
    const [transfers,setTransfers] = useState([]);
    const {appInfo} = useAppInfo();

    const handleNavigate = (path,data)=>{
        console.log(location)
        if(data != null){
            navigate(location.pathname + path,{state:data});
        }else{
            navigate(location.pathname + path);
        }
    }

    const [searchValue,setSearchVal] = useState('');

    const visibleElement = (info)=>{
        if(searchValue != ""){
            return(((info.product_name).toLowerCase()).includes((searchValue).toLowerCase()) || ((info.product_code).toLowerCase()).includes((searchValue).toLowerCase()))
        }else{
            return(true)
        }
    }

    const getMovements = async()=>{
        let res = await postInfo('/getMovements',{company_id:appInfo.company_id});
        if(res[0]){
            let E = [];
            let D = [];
            let C = [];
            let T = [];
            res[1].forEach(element => {
                if(element.movement_type == 'entry'){
                    E.push(element);
                }else if(element.movement_type == 'sell'){
                    D.push(element);
                }else if(element.movement_type == 'consuption'){
                    C.push(element);
                }else{
                    T.push(element);
                }
            });
            setEntries(E);
            setDepartures(D);
            setConsuption(C);
            setTransfers(T);
        }
    }

    const getProducts = async()=>{
        let infoLine = {
            company_id:appInfo.company_id,
            totalProducts:true,
            totalStocks:true
        }
        let res = await postInfo('/getProducts',infoLine)
        if(res[0]){
            setProducts(res[1]);
        }
    }

    useEffect(()=>{
        getProducts();
        getMovements();
    },[appInfo])


    return(
        <div className="Analytics appSection">
            <div className="headAnalytics">
                <SectionTitle text={'Estadisticas'}/>
                <SelectOptions options={['Todas las tiendas','Tienda 1','Tienda 2']}/>
                <RangeDateInput/>
            </div>
            <div className="valuesAnalytics">
                <div className="documentsAnalytics">
                    <ValueAnalytic/>
                    <ValueAnalytic/>
                    <ValueAnalytic/>
                    <ValueAnalytic/>
                    <ValueAnalytic/>
                </div>
                <div className="chartsValues">
                    <ChartIndicator title={"Entradas"} data={entries}/>
                    <ChartIndicator title={"Salidas"} data={consuption}/>
                </div>
                <div className="secondaryValues">
                    <DetailChart/>
                    <DetailChart/>
                    <DetailChart/>
                    <DetailChart/>
                </div>
            </div>
            <div className="productsAnalitics">
                <SubSectionTitle text={'Productos'}/>
                <div className="searhProductC">
                    <SearchBar action={setSearchVal} placeholder={'Buscar Producto'}/>
                    <div className="productsGrid">
                        {products.length > 0  && products.map((element,index)=>(
                            <ProductInfoCard onClick={()=>{
                                handleNavigate(`/${element.product_id}`,element);
                            }} hidden={!visibleElement(element)}  info={ element} key={index}/>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}