import { moneyFormat } from "../../../utils/functions"
import { CheckSquare } from "./CheckSquare"
import { UserCard } from "./UserCard"
import './RowTableReport.css'
import { useAlert, usePreview } from "../../../context/context"
import { DocumentPreview } from "../containers/Alerts/DocumentPreview"

export function RowTableReport({columns,info,type}){

    const {popInAlert} = useAlert();
    const {setOpenPreview,setPreviewInfo} = usePreview();
    const dictionaryElementsColum = {
        "ID":<span className="Redirect"># {type == 'OP'? info.op_id:info.id}</span>,
        "OP":<span className="Redirect idHolder" onClick={()=>{
            info.type = 'Document'
            setPreviewInfo(info);
            setOpenPreview(true)
        }}>OP# {info.op_id}</span>,
        "Movmiento Inventario":<span className="Redirect idHolder"># {info.movement_id}</span>,
        "Tienda":<span className="Redirect">{info.store_name}Tienda 1</span>,
        "Creada por":<UserCard name={info.user_name}/>,
        "Cliente":<UserCard name={info.names}/>,
        'Estado':<span>{info.status}</span>,
        'Descripción':<span>{info.description}</span>,
        "Ingreso Presupuestado":<span>$ {info.budgetIncome != undefined ? moneyFormat(info.budgetIncome):0}</span>,
        "Costo Presupuestado":<span>$ {info.budgetCost!= undefined? moneyFormat(info.budgetCost):0}</span>,
        'Costo Ejecutado':<span>$ {info.executedCost != undefined? moneyFormat(info.executedCost):0}</span>,
        'Valor Facturado':<span>$ {info.invoicedValue != undefined? moneyFormat(info.invoicedValue):0}</span>,
        'Valor':<span>$ {info.value != undefined? moneyFormat(info.value):0}</span>,
        'Fecha de entrega':<span>{(info.created_at).substring(0,10)}</span>,
        'Fecha creación':<span>{(info.created_at).substring(0,10)}</span>
    }

    return(
        <div className="RowTableReport">
            <CheckSquare/>
            {columns.map((element,index)=>(
                <div key={index} className="ElementRow">
                    {dictionaryElementsColum[element]}
                </div>
            ))}
        </div>
    )
}