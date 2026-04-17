import { useState, useEffect, useMemo } from 'react';
import { postInfo } from '../../../utils/functions';
import { CheckSquare } from './CheckSquare';
import './RowPricesList.css';

export function RowPricesList({ disabled, columns, info, functions, index }) {
    // 1. Estado local: 'data' es nuestra fuente de verdad para el renderizado inmediato
    const [edited, setEdited] = useState(false);
    const [data, setNewInfo] = useState(info);

    // Utils
    const handleInputChange = (property, value) => {
        setEdited(true);
        setNewInfo(prev => ({
            ...prev,
            [property]: value
        }));
        functions.updateListItem(index, property, value);
    };

    const marginValue = useMemo(() => {
        const v = parseFloat(data.value) || 0;
        const c = parseFloat(data.cost) || 0;
        if (v === 0) return 0;
        const margin = ((v - c) / v) * 100;
        return margin.toFixed(2);
    }, [data.value, data.cost]);

    // Events listeners

    useEffect(() => {
        setNewInfo(info);
    }, [info]);

    const dictionaryElementsColum = {
        "SKU": (
            <span className="rowSpan Redirect idHolder">
                <i className="fa-solid fa-barcode" /> {data.code}
            </span>
        ),
        "Producto": <span className="rowSpan wideElement">{data.name}</span>,
        "Descripción": <span className="rowSpan wideElement">{data.description}</span>,
        "Costo": (
            <input 
                className='valueUpdateIn'
                type='number' 
                step={0.001}
                value={data.cost ?? 0}
                disabled={disabled}
                onChange={(e) => handleInputChange("cost", e.target.value)}
                placeholder='0'
            />
        ),
        "Valor venta": (
            <input 
                className='valueUpdateIn'
                type='number' 
                step={0.001} 
                value={data.value ?? 0} 
                disabled={disabled} 
                onChange={(e) => handleInputChange("value", e.target.value)}
                placeholder='0'
            />
        ),
        "Unidades min": (
            <input 
                className='valueUpdateIn' 
                type='number' 
                value={data.min_units ?? 0} 
                disabled={disabled} 
                onChange={(e) => handleInputChange("min_units", e.target.value)}
            />
        ),
        "Unidades max": (
            <input 
                className='valueUpdateIn' 
                type='number' 
                value={data.max_units ?? 0} 
                disabled={disabled}
                onChange={(e) => handleInputChange("max_units", e.target.value)}
            />
        ),
        "Descuento %": (
            <input 
                className='valueUpdateIn' 
                type='number' 
                value={data.discount ?? 0} 
                disabled={disabled}
                onChange={(e) => handleInputChange("discount", e.target.value)}
                placeholder='0%'
            />
        ),
        "Margen": <span className="rowSpan Redirect">{marginValue}%</span>,
        "Disponible desde": (
            <input 
                className='valueUpdateIn' 
                type='date'
                value={data.start_date || ''}
                disabled={disabled}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
            />
        ),
        "Disponible hasta": (
            <input 
                className='valueUpdateIn' 
                type='date' 
                value={data.end_date || ''}
                disabled={disabled}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
            />
        ),
    };

    return (
        <div className={`
            RowPricesList
            ${disabled ? 'DisabledPricesListRow' : ''}
            ${edited ? 'EditedPricesListRow' : ''}
        `}>
            <CheckSquare />
            {columns.map((colName, colIdx) => (
                <div key={`${index}-${colIdx}`} className="ElementRow">
                    {dictionaryElementsColum[colName]}
                </div>
            ))}
        </div>
    );
}