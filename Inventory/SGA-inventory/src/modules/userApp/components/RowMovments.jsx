
import { moneyFormat } from '../../../utils/functions'
import './RowMovments.css'

export function RowMovement({info}){

    const typeRow = {
        "sell":"Salida",
        "transfer":"Translado",
        "consuption":"Consumo",
        "entry":"Entrada"
    }


    return(
        <div className="RowMovement">
            <span>{info.movement_id}</span>
            <span>{typeRow[info.movement_type]}</span>
            <span>$ {moneyFormat(info.movement_value)}</span>
            <span><strong className='SelectOptionMov'>{info.user_name}</strong></span>
            <span>{info.store_name}</span>
            <span>{info.cellar_name}</span>
            <span><strong className='SelectOptionMov'>Ver todas</strong></span>
            <span>{info.movement_date}</span>
            <span>{info.movement_description != null? info.movement_description:"Sin descripción"}</span>
            <span>{info.movement_state}</span>
            <span title='Editar operación'><i className="fa-regular fa-pen-to-square"/></span>
            <span title='Bloquear operación'><i className="fa-solid fa-unlock"/></span>
        </div>
    )
}