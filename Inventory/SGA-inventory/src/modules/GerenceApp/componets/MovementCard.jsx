
import './MovementCard.css'
import {moneyFormat} from '../../../utils/functions'

export function MovementCard({info}){

    if(info == undefined){
        info = {
            movement_type:"Prueba",
            movement_description:"Descripción",
            created_at:"1/08/25:12:45:12",
            user_name:"usuario",
            store_name:"Tienda",
            movement_value:0
        }
    }

    const titleCard = {
        "sell":"Salida",
        "transfer":"Translado",
        "consuption":"Consumo",
        "entry":"Entrada"
    }

    return(
        <div className="MovementCard">
            <div className="iconContainer">
                {info.movement_type == "transfer" && (
                    <i className="fa-solid fa-people-carry-box"/>
                )}
                {info.movement_type == "sell" && (
                    <i className="fa-solid fa-arrow-right-to-bracket"/>
                )}
                {info.movement_type == "entry" && (
                    <i className="fa-solid fa-truck-arrow-right"/>
                )}
                {info.movement_type == "consuption" && (
                    <i className="fa-solid fa-hammer"/>
                )}
            </div>
            <div className="movementInfo">
                <strong>{titleCard[info.movement_type]}<h6>- {info.user_name}</h6></strong>
                <span><h4>${moneyFormat(info.movement_value)}</h4> {info.movement_description != null? info.movement_description:"Sin descripción"}</span>
            </div>
            <div className="aditionalMovementData">
                <span>{(info.created_at).substring(0,10)}</span>
                <div className="StoreIndicator">
                    {info.store_name}
                </div>
            </div>
        </div>
    )
}