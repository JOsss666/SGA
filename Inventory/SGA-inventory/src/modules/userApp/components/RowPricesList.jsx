
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
        "Categoría":<span className="rowSpan Redirect">{info.category_name}</span>,
        "Unidades":<span className='rowSpan'>{info.units}</span>,
        "Costo":<span className='rowSpan'>$ {formatCurrency(info.unit_cost)}</span>,
        "Gravado":<span className='rowSpan'>{info.taxed}</span>,
        "MOQ":<input min={1} className='valueUpdateIn' type='number' disabled={disabled} placeholder='1'/>,
        "Precio Venta":<input className='valueUpdateIn' type='number' disabled={disabled} placeholder='$ 0'/>,
        "Margen":<span className='rowSpan'>0%</span>
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