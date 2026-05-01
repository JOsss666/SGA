import { moneyFormat } from "../../../utils/functions"
import { CheckSquare } from "./CheckSquare"
import { UserCard } from "./UserCard"
import './RowTableReport.css'
import { useAlert, usePreview } from "../../../context/context"
import { DocumentPreview } from "../containers/Alerts/DocumentPreview"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { PreviewDocument } from "../containers/Preview/PreviewDocument"
import { ProcessStatusAlert } from "../containers/Alerts/ProcessStatusAlert"

export function RowTableReport({columns,info,hidden,navigation}){

    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

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
        'Fecha de entrega':<span className="rowSpan ">{info.doc_date != undefined? (info.doc_date).substring(0,10):''}</span>,
        'Fecha vencimiento':<span className="rowSpan">{info.due_date != undefined? (info.due_date).substring(0,10):''}</span>,
        'Fecha Documento':<span className="rowSpan ">{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Concepto':<span className="rowSpan" onClick={()=>{console.log(info)}}>{info.type =='payment'? 'Pago '+info.payment_name:info.concept_name}</span>,
        'Subtotal':<span className="rowSpan rightAl">{`$ ${moneyFormat(parseFloat(info.subTotal))}`}</span>,
        'Base':<span className="rowSpan">{`$ ${moneyFormat(parseFloat(info.subTotal))}`}</span>,
        'Valor ':<span className="rowSpan rightAl">{`$ ${moneyFormat(parseFloat(info.total))}`}</span>,
        'Pagado':<span className="rowSpan rightAl">{`$ ${moneyFormat(parseFloat(info.paid_amount))}`}</span>,
        'Pendiente':<span className="rowSpan rightAl">{`$ ${moneyFormat(parseFloat(info.pending_amount))}`}</span>,
        'Fecha de entrega':<span className="rowSpan">{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Fecha creación':<span className="rowSpan ">{info.created_at != undefined? (info.created_at).substring(0,10):''}</span>,
        'Tipo Doc':<span className="rowSpan">{info.doc_type}</span>,
        'Documento':<span className="rowSpan Redirect" onClick={()=>{
            window.open(`https://facturation.sga360.co/preview/Document/${params.company_key}/${info.doc_id}`,'_blank','noopener,noreferrer')
        }}>{`${info.doc_type}#${info.ownSerial}`}</span>,
        'Naturaleza':<span className="rowSpan idHolder centerAl">{info.nature}</span>,
        'Debito':<span className="rowSpan">{info.total_debit != undefined? moneyFormat(info.total_debit):0}</span>,
        'Crédito':<span className="rowSpan">{info.total_credit != undefined? moneyFormat(info.total_credit):0}</span>,
        'Saldo inicial':<span className="rowSpan">{info.opening_balance != undefined? moneyFormat(info.opening_balance):0}</span>,
        'Saldo':<span className="rowSpan">{info.final_balance != undefined? moneyFormat(info.final_balance):0}</span>,
        "Ver Detalles": <span className="Redirect rowSpan" onClick={() => handleNavigate(`${info.id}`)}> Ver Detalles </span>,
        "Terceros": <UserCard name={info.names} imgSrc={info.img}/> ,
        "Habilitado": <span className="rowSpan idHolder">{info.credit? "si":"no"}</span>,
        "Cartera":<span className="rowSpan rightAl">{moneyFormat(parseFloat(info.thirdParty_balance).toFixed(2))}</span>,
        "Corriente":<span className="rowSpan rightAl">{moneyFormat(parseFloat(info.thirdParty_currentBalance? info.thirdParty_currentBalance:0).toFixed(2))}</span>,
        "Plazo":<span className="rowSpan idHolder">{`${info.credit_term ? info.credit_term:0} días`}</span>,
        "Vencido":<span className="rowSpan rightAl">{moneyFormat(parseFloat(info.thirdParty_overdueBalance? info.thirdParty_overdueBalance:0).toFixed(2))}</span>,
        "Cupo_max":<span className="rowSpan rightAl">{moneyFormat(parseFloat(info.credit_value? info.credit_value:0).toFixed(2))}</span>,
        "Cupo_disponible":<span className="rowSpan rightAl">{moneyFormat(parseFloat(info.aviable_credit)-(parseFloat(info.thirdParty_currentBalance ?? 0)).toFixed(2))}</span>,
        "Instancia":<span className="rowSpan idHolder Redirect" onClick={()=>{
            popInAlert(<ProcessStatusAlert instance_id={info.instance_id}/>)
        }}>{`${info.process_code? info.process_code:'---'}#${info.instance_serial? info.instance_serial:'---'}`}</span>,
    }

    if(!hidden){
        return(
            <div className={`RowTableReport ${navigation? 'RowTableReport_redirectRow':''}`} onClick={()=>{
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