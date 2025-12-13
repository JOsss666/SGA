import { moneyFormat } from "../../../utils/functions"
import { CheckSquare } from "./CheckSquare"
import { UserCard } from "./UserCard"
import './RowTableReport.css'
import { useAlert, usePreview } from "../../../context/context"
import { useLocation, useNavigate } from "react-router-dom"

export function RowTableReport({columns,info,type,hidden}){

    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path)=>{
        navigate(`${location.pathname}/${path}`);
    }

    const {popInAlert} = useAlert();
    const {setOpenPreview,setPreviewInfo} = usePreview();
    const dictionaryElementsColum = {
        "ID":<span className="Redirect" onClick={()=>{
            info.type = 'Document'
            setPreviewInfo(info);
            setOpenPreview(true)
        }} >{info.docType}# {info.ownSerial}</span>,
        "Transacción":<span className="Redirect" onClick={()=>{
            info.type = 'Document'
            setPreviewInfo(info);
            setOpenPreview(true)
        }} >{info.docType}TR# {info.transaction_id}</span>,
        "OP":<span className="Redirect idHolder" onClick={()=>{
            setPreviewInfo({
                op_id:info.op_id,
                docType:'OP',
                type:'Document'
            });
            setOpenPreview(true)
            
        }}>OP# {info.op_id}</span>,
        "Movmiento Inventario":<span className="Redirect idHolder"># {info.movement_id}</span>,
        "Tienda":<span className="Redirect">{info.store_name}</span>,
        "Creada por":<UserCard name={info.user_name}/>,
        "Cliente":<UserCard name={info.names}/>,
        "Cuenta":<span>{info.account_code}</span>,
        'Estado':<span>{info.status}</span>,
        'Descripción':<span>{info.description}</span>,
        "Ingreso Presupuestado":<span>$ {parseFloat(info.budgetIncome) != undefined ? moneyFormat(parseFloat(info.budgetIncome)):0}</span>,
        "Costo Presupuestado":<span>$ {parseFloat(info.budgetCost)!= undefined? moneyFormat(parseFloat(info.budgetCost)):0}</span>,
        'Costo Ejecutado':<span>$ {parseFloat(info.executedCost) != undefined? moneyFormat(parseFloat(info.executedCost)):0}</span>,
        'Valor Facturado':<span>$ {parseFloat(info.invoicedValue) != undefined? moneyFormat(parseFloat(info.invoicedValue)):0}</span>,
        'Valor':<span>$ {info.total != undefined? moneyFormat(parseFloat(info.total)):0}</span>,
        'Fecha de entrega':<span>{info.doc_date != undefined? (info.doc_date).substring(0,10):''}</span>,
        'Fecha Documento':<span>{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Concepto':<span onClick={()=>{console.log(info)}}>{info.type =='payment'? 'Pago '+info.payment_name:info.concept_name}</span>,
        'Sub Total':<span>{`$ ${moneyFormat(parseFloat(info.subTotal))}`}</span>,
        'Base':<span>{`$ ${moneyFormat(parseFloat(info.subTotal))}`}</span>,
        'Valor ':<span>{`$ ${moneyFormat(parseFloat(info.total))}`}</span>,
        'Fecha de entrega':<span>{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Fecha creación':<span>{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Tipo Doc':<span>{info.doc_type}</span>,
        'Naturaleza':<span>{info.nature}</span>,
        'Debito':<span>{info.total_debit != undefined? moneyFormat(info.total_debit):0}</span>,
        'Crédito':<span>{info.total_credit != undefined? moneyFormat(info.total_credit):0}</span>,
        'Saldo inicial':<span>0</span>,
        'Saldo':<span>{info.balance != undefined? moneyFormat(info.balance):0}</span>,
        "Ver Detalles": <span className="Redirect" onClick={() => handleNavigate(`${info.id}`)}> Ver Detalles </span>
    }

    if(!hidden){
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
}