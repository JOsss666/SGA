
import './RowPricesList.css'
import { TagIndicator } from './TagIndicator'
import { useAlert } from '../../../context/context'
import { PreviewProduct } from '../containers/alerts/PreviewProduct';
import { BoldButton } from './BoldButton';
import { postInfo } from '../../../utils/functions';
import { useState, useEffect } from 'react';
import { EditCostValueList } from '../containers/forms/EditCostValueList';
import { moneyFormat } from '../../../utils/functions';

export function RowPricesList({info,list_id}){

    const {popInAlert,setOpenAlert} = useAlert();
    const [data,setNewInfo] = useState(info);

    const isInList = info.list_id == list_id.list_id;

    const ReloadInfo = async(info)=>{
        let res = await postInfo('/getProducts',info);
        if(res[0]){
            console.log('Actualizando información')
            setNewInfo(res[1][0]);
        }
        console.log(res)
    }

    useEffect(()=>{
        console.log(data);
    },[data])

    return(
        <div className={`RowPricesList ${isInList? "ActualListProduct":""}`}>
            <span>#{data.product_code}</span>
            <span onClick={()=>{
                popInAlert(<PreviewProduct info={data}/>)
                setOpenAlert(true)
            }} className='multipleSelect'>{data.product_name}</span>
            <span className='multipleSelect'>Nombre del Proveedor</span>
            <span><TagIndicator/></span>
            <span className='editableSpan'>$ {moneyFormat(data.unit_cost!= undefined? data.unit_cost:0)} </span>
            <span className='editableSpan'>$ {moneyFormat(data.unit_value != undefined? data.unit_value:0)} <BoldButton onClick={()=>{popInAlert(<EditCostValueList reloadFun={ReloadInfo} info={data} listInfo={list_id} />);setOpenAlert(true)}} title={`Editar precio de ${data.product_name}`} children={<i className="fa-solid fa-pencil"/>}/></span>
            <span>{data.storeStock == null? 0:data.storeStock}</span>
            <span>{data.units}</span>
            <span>{data.unit_value != undefined && data.unit_cost != undefined? (((data.unit_value * 100)/ data.unit_cost)-100).toFixed(2):'-- '}%</span>
            <span>{data.min_stock == null? 0:data.min_stock}</span>
        </div>
    )
}