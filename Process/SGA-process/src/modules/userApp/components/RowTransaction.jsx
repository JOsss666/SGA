
import { moneyFormat } from '../../../utils/functions';
import { FormInput } from './FormInput';
import './RowTransaction.css'
import { useEffect, useState } from 'react';
import { SearchinList } from './SearchInList';

export function RowTransaction({disabled,info,products,index,addP,delP,updateTotal,type}){
    const [movementsUnits,setUnits] = useState(0);
    const [newCostP,setNewCost] = useState(0);

    console.log(info)

    useEffect(()=>{
        if(info != undefined){
            if(movementsUnits == ""){
                setUnits(0)
            }else{
                info.movementsUnits = JSON.parse(movementsUnits);
            }
            if(newCostP != ""){
                info.unit_cost = JSON.parse(newCostP);
            }
            if(updateTotal != undefined){
                updateTotal()
            }
        }
    },[movementsUnits,newCostP])

    useEffect(()=>{
        if(info != undefined){
            if(type == "entry"){
                info.unit_cost = newCostP;
            }
        }
    },[newCostP])

    return(
        <div className={`RowTransaction ${info != undefined? `RowTrans_${info.stateTransaction}`:""}`}>
            {info == undefined && (
                <>
                    <span></span>
                    <span>+</span>
                    <span className='productHolder'>
                        <SearchinList disabled={disabled} noActVal={true} action={addP} placeHolder={"Añadir producto o servicio"} list={products}/>
                    </span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </>
            )}
            {info != undefined && (
                <>
                    <span className='stateTransCs'>
                        {info.stateTransaction == "loading" && (
                            <i className="fa-solid fa-spinner fa-spin"/>
                        )}
                        {info.stateTransaction == "realized" && (
                            <i className="fa-solid fa-check aprovedTransIcon"/>
                        )}
                        {info.stateTransaction == "error" && (
                            <i className="fa-solid fa-xmark declinedTransIcon"/>
                        )}
                    </span>
                    <span>{index + 1}</span>
                    <span>{info.product_name}</span>
                    <span>#{info.product_code}</span>
                    <span>{info.product_description}</span>
                    <span className='inCTrans'><FormInput disabled={disabled} value={movementsUnits != 0? movementsUnits:""} action={setUnits} placeholder={type != "entry"? `${info.storeStock} unidades disponibles`:'0'} max={info.storeStock} min={0} type={"number"} /></span>
                    {type == "sell" || type == 'transfer'  && (
                        <>
                            <span>$ {moneyFormat(info.unit_value)}</span>
                            <span>$ {moneyFormat(movementsUnits * info.unit_value)}</span>
                        </>
                    )}
                    {type == "consuption" && (
                        <>
                            <span>$ {moneyFormat(info.unit_cost)}</span>
                            <span>$ {moneyFormat(movementsUnits * info.unit_cost)}</span>
                        </>
                    )}
                    {type == "entry" && (
                        <>
                            <span className='inCTrans'><FormInput disabled={disabled} value={newCostP != 0? newCostP:""} action={setNewCost} placeholder={"0"}type={"number"} /></span>
                            <span>$ { moneyFormat(movementsUnits * newCostP)}</span>
                        </>
                    )}
                </>
            )}
            <span><i title='Duplicar' className="fa-regular fa-clone"/></span>
            <span><i onClick={()=>{
                if(!disabled){
                    if(delP != undefined){
                        delP(index);
                    }
                }
            }} title='Eliminar' className="fa-solid fa-trash-can transactionBtn"/></span>
        </div>
    )

    //
}