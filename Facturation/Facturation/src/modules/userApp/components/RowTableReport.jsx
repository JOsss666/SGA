import { moneyFormat } from "../../../utils/functions"
import { CheckSquare } from "./CheckSquare"
import { UserCard } from "./UserCard"
import './RowTableReport.css'
import { useAlert, usePreview } from "../../../context/context"
import { DocumentPreview } from "../containers/Alerts/DocumentPreview"
import { useLocation, useNavigate } from "react-router-dom"

export function RowTableReport({columns,info,hidden,navigation}){

    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path)=>{
        navigate(`${location.pathname}/${path}`);
    }
    
    const {popInAlert} = useAlert();
    const {setOpenPreview,setPreviewInfo} = usePreview();
    const dictionaryElementsColum = {
        "ID":<span className="Redirect idHolder rowSpan" onClick={()=>{
            info.type = 'Document'
            setPreviewInfo(info);
            setOpenPreview(true)
        }} >{info.docType}# {info.ownSerial != undefined? info.ownSerial:info.id}</span>,
        "Transacción":<span className="Redirect rowSpan" onClick={()=>{
            info.type = 'Document'
            setPreviewInfo(info);
            setOpenPreview(true)
        }} >{info.docType}TR# {info.transaction_id}</span>,
        "OP":<span className="Redirect idHolder rowSpan" onClick={()=>{
            setPreviewInfo({
                op_id:info.op_id,
                docType:'OP',
                type:'Document'
            });
            setOpenPreview(true)
            
        }}>OP# {info.op_id}</span>,
        "Movmiento Inventario":<span className="Redirect rowSpan"># {info.movement_id}</span>,
        "Tipo movimiento":<span className="Redirect rowSpan" title={info.movement_type}>{info.movement_type}</span>,
        "Serial":<span className="Redirect idHolder rowSpan"># {info.id}</span>,
        "Tienda":<span className="Redirect rowSpan">{info.store_name}</span>,
        "SKU":<span className="rowSpan"><i className="fa-solid fa-barcode"/> {info.product_sku}</span>,
        "Creada por":<UserCard name={info.user_name} imgSrc={info.user_img != undefined? info.user_img:'https://i.pinimg.com/736x/35/47/0c/35470c8c3ea8905f83e5efd5ccb3299b.jpg'}/>,
        "Cliente":<UserCard name={info.names}/>,
        "Referencia":<UserCard name={info.product_name} imgSrc={info.img}/>,
        "Unidades":<span className="rowSpan rightAl mediumCol">{info.units}</span>,
        "Cuenta":<span className="rowSpan">{info.account_code}</span>,
        'Estado':<span className="rowSpan idHolder">{info.status}</span>,
        'Descripción':<span className="rowSpan" >{info.description}</span>,
        'Negocio':<span className="rowSpan">{info.bussines_name != undefined? info.bussines_name:'null'}</span>,
        'Centro de costo':<span className="rowSpan">{info.costcenter_name != undefined? info.costcenter_name:'null'}</span>,
        'Tercero':<span className="rowSpan"><UserCard name={info.thirdparty_name} imgSrc={info.thirdparty_img != undefined? info.thirdparty_img:'https://i.pinimg.com/736x/35/47/0c/35470c8c3ea8905f83e5efd5ccb3299b.jpg'}/></span>,
        "Ingreso Presupuestado":<span className="rowSpan">$ {parseFloat(info.budgetIncome) != undefined ? moneyFormat(parseFloat(info.budgetIncome)):0}</span>,
        "Costo Presupuestado":<span className="rowSpan">$ {parseFloat(info.budgetCost)!= undefined? moneyFormat(parseFloat(info.budgetCost)):0}</span>,
        'Costo Ejecutado':<span className="rowSpan">$ {parseFloat(info.executedCost) != undefined? moneyFormat(parseFloat(info.executedCost)):0}</span>,
        'Valor Facturado':<span className="rowSpan">$ {parseFloat(info.invoicedValue) != undefined? moneyFormat(parseFloat(info.invoicedValue)):0}</span>,
        'Valor':<span className="rowSpan rightAl">$ {info.total != undefined? moneyFormat(parseFloat(info.total)):0}</span>,
        'Costo':<span className="rowSpan rightAl">$ {info.value != undefined? moneyFormat(parseFloat(info.value)):0}</span>,
        'Fecha de entrega':<span className="rowSpan">{info.doc_date != undefined? (info.doc_date).substring(0,10):''}</span>,
        'Fecha Documento':<span className="rowSpan">{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Concepto':<span className="rowSpan" onClick={()=>{console.log(info)}}>{info.type =='payment'? 'Pago '+info.payment_name:info.concept_name}</span>,
        'Subtotal':<span className="rowSpan rightAl">{`$ ${moneyFormat(parseFloat(info.subTotal))}`}</span>,
        'Base':<span className="rowSpan">{`$ ${moneyFormat(parseFloat(info.subTotal))}`}</span>,
        'Valor ':<span className="rowSpan rightAl">{`$ ${moneyFormat(parseFloat(info.total))}`}</span>,
        'Fecha de entrega':<span className="rowSpan">{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Fecha creación':<span className="rowSpan">{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Tipo Doc':<span className="rowSpan">{info.doc_type}</span>,
        'Documento':<span className="rowSpan idHolder Redirect">#{info.doc_id}</span>,
        'Naturaleza':<span className="rowSpan centerAl">{info.nature}</span>,
        'Debito':<span className="rowSpan">{info.total_debit != undefined? moneyFormat(info.total_debit):0}</span>,
        'Crédito':<span className="rowSpan">{info.total_credit != undefined? moneyFormat(info.total_credit):0}</span>,
        'Saldo inicial':<span className="rowSpan">{info.opening_balance != undefined? moneyFormat(info.opening_balance):0}</span>,
        'Saldo':<span className="rowSpan">{info.final_balance != undefined? moneyFormat(info.final_balance):0}</span>,
        "Ver Detalles": <span className="Redirect rowSpan" onClick={() => handleNavigate(`${info.id}`)}> Ver Detalles </span>,
    }

    if(!hidden){
        return(
            <div className="RowTableReport" onClick={()=>{
                if(info.id != undefined && navigation){
                    handleNavigate(info.id)
                }
            }}>
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