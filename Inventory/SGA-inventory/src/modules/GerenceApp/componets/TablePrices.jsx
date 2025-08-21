
import { useEffect, useState } from 'react'
import { RowPricesList } from './RowPricesList'
import './TablePrices.css'
import { postInfo } from '../../../utils/functions';
import { useAppinfo } from '../../../context/context';

export function TablePrices({columns,info}){
    const {appInfo} = useAppinfo();
    console.log(info)
    const [products,setProducts] = useState([]);

    const getProducts = async()=>{
        let res = await postInfo('/getProducts',{
            company_id:appInfo.company_id,
            store_id:info.store_id,
            pricesList:true
        })
        if(res[0]){
            setProducts(res[1]);
        }
    }

    useEffect(()=>{
        getProducts();
    },[])

    return(
        <div className="TablePrices">
            <div className="headPrices">
                {columns.map((element,index)=>(
                    <span key={index}>{element}</span>
                ))}
            </div>
            <div className="rowsContainer">
                {products.length >0&& products.map((element,index)=>(
                    <RowPricesList info={element} key={index} list_id={info}/>
                ))}
            </div>
        </div>
    )
}