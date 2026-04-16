
import { useAlert } from '../../../context/context'
import { postInfo } from '../../../utils/functions';
import { useState, useEffect } from 'react';
import { FormInput } from './FormInput';
import { CheckSquare } from './CheckSquare';
import './RowPricesList.css'

export function RowPricesList({disabled,columns,info}){

    const {popInAlert,setOpenAlert} = useAlert();
    const [data,setNewInfo] = useState(info);

    const formatCurrency = (value) =>
        new Intl.NumberFormat("es-CO").format(value);

    const isInList = true;

    const dictionaryElementsColum = {
        "SKU":<span className="rowSpan Redirect idHolder">{info.code}</span>,
        "Producto":<span className="rowSpan Redirect">{info.product_name}</span>,
        "Descripción":<span className="rowSpan Redirect">{info.product_name}</span>,
        "Costo":<span className="rowSpan Redirect">{info.category_name}</span>,
        "Valor venta":<span className='rowSpan'>{(formatCurrency(info.cost))}</span>,
        "Unidades min":<span className='rowSpan'>$ {info.units}</span>,
        "Unidades max":<span className='rowSpan'>{info.units}</span>,
        "Descuento %":<input min={1} className='valueUpdateIn' type='number' disabled={disabled} placeholder='1'/>,
        "Margen":<input min={1} className='valueUpdateIn' type='number' disabled={disabled} placeholder='1'/>,
        "Disponible desde":<input min={1} className='valueUpdateIn' type='date' disabled={disabled} placeholder='1'/>,
        "Disponible hasta":<input min={1} className='valueUpdateIn' type='date' disabled={disabled} placeholder='1'/>,
    }

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
            <CheckSquare/>
            {columns.map((element,index)=>(
                <div key={index} className="ElementRow">
                    {dictionaryElementsColum[element]}
                </div>
            ))}
        </div>
    )
}