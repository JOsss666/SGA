
import { RowMovement } from '../componets/RowMovments'
import { RowTransactionReport } from '../componets/RowTransactionReport'
import './TableMovements.css'

export function TableMovements({columns,movements,type}){
    return(
        <div className="TableMovments">
            <div className="headTableMovements">
                {columns.length > 0 && columns.map((element,index)=>(
                    <span key={index}>{element}</span>
                ))}
                <span></span>
                {type == "movments" && (
                    <span></span>
                )}
            </div>
            {type == 'movments' && (
                <div className="bodyTableMov">
                    {movements.length >0 && movements.map((element,index)=>(
                        <RowMovement info={element} key={index}/>
                    ))}
                </div>
            )}
            {type == 'transactions' && (
                <div className="bodyTableMov">
                    {movements.length >0 && movements.map((element,index)=>(
                        <RowTransactionReport info={element} key={index}/>
                    ))}
                </div>
            )}
        </div>
    )
}